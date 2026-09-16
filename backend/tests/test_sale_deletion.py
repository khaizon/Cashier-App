"""Deleting a recorded sale, and the audit trail it leaves.

Deleting money from the ledger is the most destructive thing the API can do, so
these tests are as much about what survives as about what disappears.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Sale, SaleDeletion, SaleItem


def record(client: TestClient, headers: dict[str, str], lines: list[tuple[int, int]], payment: str = "cash") -> dict:
    response = client.post(
        "/api/sales",
        headers=headers,
        json={"payment": payment, "items": [{"item_id": item_id, "quantity": qty} for item_id, qty in lines]},
    )
    assert response.status_code == 201, response.text
    return response.json()


def delete(client: TestClient, headers: dict[str, str], sale_id: int, reason: str = "rang up by mistake"):
    return client.request(
        "DELETE", f"/api/sales/{sale_id}", headers=headers, json={"reason": reason}
    )


def test_delete_requires_authentication(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    sale = record(client, auth_headers, [(catalog["espresso_id"], 1)])

    assert client.request("DELETE", f"/api/sales/{sale['id']}", json={"reason": "x"}).status_code == 401


def test_deleting_a_sale_removes_it(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session):
    sale = record(client, auth_headers, [(catalog["espresso_id"], 2)])

    response = delete(client, auth_headers, sale["id"])

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["order_ref"] == sale["order_ref"]
    assert body["total"] == 6.0
    assert body["reason"] == "rang up by mistake"
    assert body["deleted_by"] == "cashier"  # from the test fixture user

    assert db_session.query(Sale).count() == 0
    assert client.get("/api/sales", headers=auth_headers).json() == []


def test_deleting_a_sale_removes_its_lines(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session):
    sale = record(client, auth_headers, [(catalog["espresso_id"], 2), (catalog["flat_white_id"], 1)])

    delete(client, auth_headers, sale["id"])

    # Cascade, or the ledger keeps orphaned lines that reports would still see.
    assert db_session.query(SaleItem).count() == 0


def test_a_reason_is_required(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session):
    sale = record(client, auth_headers, [(catalog["espresso_id"], 1)])

    for payload in ({}, {"reason": ""}, {"reason": "   "}):
        response = client.request("DELETE", f"/api/sales/{sale['id']}", headers=auth_headers, json=payload)
        assert response.status_code == 422, f"{payload} should be rejected"

    # Nothing was removed by the rejected attempts.
    assert db_session.query(Sale).count() == 1


def test_deleting_an_unknown_sale_is_404(client: TestClient, auth_headers: dict[str, str]):
    assert delete(client, auth_headers, 99999).status_code == 404


def test_a_sale_cannot_be_deleted_twice(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    sale = record(client, auth_headers, [(catalog["espresso_id"], 1)])

    assert delete(client, auth_headers, sale["id"]).status_code == 200
    assert delete(client, auth_headers, sale["id"]).status_code == 404


def test_an_audit_record_survives_the_delete(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session, user
):
    sale = record(client, auth_headers, [(catalog["espresso_id"], 2)])
    delete(client, auth_headers, sale["id"], reason="customer walked out")

    record_row = db_session.query(SaleDeletion).one()
    assert record_row.sale_id == sale["id"]
    assert record_row.order_ref == sale["order_ref"]
    assert record_row.total_cents == 600
    assert record_row.payment == "cash"
    assert record_row.reason == "customer walked out"
    assert record_row.deleted_by_id == user.id
    assert record_row.deleted_at is not None
    # The lines are snapshotted, since sale_items is gone by now.
    assert '"title":"Espresso"' in record_row.items_json
    assert '"quantity":2' in record_row.items_json


def test_deleted_sales_disappear_from_reporting(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    keep = record(client, auth_headers, [(catalog["flat_white_id"], 1)])  # 5.00
    drop = record(client, auth_headers, [(catalog["espresso_id"], 3)])  # 9.00

    before = client.get("/api/sales/stats", headers=auth_headers).json()
    assert before["period"]["revenue"] == 14.0
    assert before["period"]["transactions"] == 2

    delete(client, auth_headers, drop["id"])

    after = client.get("/api/sales/stats", headers=auth_headers).json()
    assert after["period"]["revenue"] == 5.0
    assert after["period"]["transactions"] == 1
    assert after["period"]["items_sold"] == 1
    # And the item stops being credited with the removed quantity.
    assert [entry["title"] for entry in after["top_items"]] == ["Flat White"]
    assert client.get("/api/sales", headers=auth_headers).json()[0]["order_ref"] == keep["order_ref"]


def test_deleted_sales_disappear_from_the_csv_export(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    keep = record(client, auth_headers, [(catalog["flat_white_id"], 1)])
    drop = record(client, auth_headers, [(catalog["espresso_id"], 1)])

    delete(client, auth_headers, drop["id"])

    export = client.get("/api/sales/export.csv", headers=auth_headers).text
    assert keep["order_ref"] in export
    assert drop["order_ref"] not in export


def test_a_deleted_sale_still_counts_against_its_idempotency_key(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    """A replay must not resurrect a sale an operator deliberately removed.

    The `client_ref` row is gone with the sale, so a retry would be accepted as a
    new sale unless the deleted key is remembered. This is the behaviour that
    makes deleting a *synced* offline sale safe.
    """
    import uuid

    payload = {
        "items": [{"item_id": catalog["espresso_id"], "quantity": 1}],
        "client_ref": str(uuid.uuid4()),
    }
    first = client.post("/api/sales", headers=auth_headers, json=payload)
    assert first.status_code == 201

    assert delete(client, auth_headers, first.json()["id"], reason="duplicate").status_code == 200

    replay = client.post("/api/sales", headers=auth_headers, json=payload)
    assert replay.status_code == 409
    assert "deleted" in replay.json()["detail"].lower()
    assert client.get("/api/sales", headers=auth_headers).json() == []


def test_deletion_audit_trail_is_listed_newest_first(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    first = record(client, auth_headers, [(catalog["espresso_id"], 1)])
    second = record(client, auth_headers, [(catalog["flat_white_id"], 1)])

    delete(client, auth_headers, first["id"], reason="first removal")
    delete(client, auth_headers, second["id"], reason="second removal")

    trail = client.get("/api/sales/deletions", headers=auth_headers).json()

    assert [entry["reason"] for entry in trail] == ["second removal", "first removal"]
    assert [entry["order_ref"] for entry in trail] == [second["order_ref"], first["order_ref"]]


def test_the_audit_trail_requires_authentication(client: TestClient):
    assert client.get("/api/sales/deletions").status_code == 401


@pytest.mark.parametrize("reason", ["x" * 255])
def test_a_very_long_reason_is_truncated_not_rejected(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], reason: str
):
    sale = record(client, auth_headers, [(catalog["espresso_id"], 1)])

    response = delete(client, auth_headers, sale["id"], reason=reason)

    assert response.status_code == 200
    assert len(response.json()["reason"]) == 255
