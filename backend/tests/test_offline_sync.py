"""Offline reconciliation: idempotency, batch sync, price conflicts, ETags."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Category, Item, Sale


def ref() -> str:
    return str(uuid.uuid4())


def sync(client: TestClient, headers: dict[str, str], sales: list[dict]) -> dict:
    response = client.post("/api/sales/sync", headers=headers, json={"sales": sales})
    assert response.status_code == 200, response.text
    return response.json()


def line(item_id: int, price_cents: int, quantity: int = 1, title: str = "Item") -> dict:
    return {"item_id": item_id, "quantity": quantity, "price_cents": price_cents, "title": title}


# ------------------------------------------------------------------ idempotency


def test_replaying_a_client_ref_does_not_sell_twice(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session
):
    """The whole point: a client that never saw the response retries safely."""
    client_ref = ref()
    payload = {"items": [{"item_id": catalog["espresso_id"], "quantity": 1}], "client_ref": client_ref}

    first = client.post("/api/sales", headers=auth_headers, json=payload)
    second = client.post("/api/sales", headers=auth_headers, json=payload)

    assert first.status_code == 201 and second.status_code == 201
    assert first.json()["order_ref"] == second.json()["order_ref"]
    assert first.json()["id"] == second.json()["id"]
    assert db_session.query(Sale).count() == 1


def test_sales_without_a_client_ref_are_still_independent(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session
):
    for _ in range(2):
        assert (
            client.post(
                "/api/sales", headers=auth_headers, json={"items": [{"item_id": catalog["espresso_id"], "quantity": 1}]}
            ).status_code
            == 201
        )

    assert db_session.query(Sale).count() == 2


# ------------------------------------------------------------------- batch sync


def test_sync_requires_authentication(client: TestClient):
    assert client.post("/api/sales/sync", json={"sales": []}).status_code == 401


def test_sync_records_a_batch(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    body = sync(
        client,
        auth_headers,
        [
            {"client_ref": ref(), "payment": "cash", "items": [line(catalog["espresso_id"], 300, 2)]},
            {"client_ref": ref(), "payment": "paynow", "items": [line(catalog["flat_white_id"], 500)]},
        ],
    )

    assert body["recorded"] == 2
    assert [result["status"] for result in body["results"]] == ["recorded", "recorded"]
    assert all(result["order_ref"] for result in body["results"])
    assert body["conflicts"] == 0


def test_sync_is_idempotent_across_replayed_batches(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session
):
    client_ref = ref()
    batch = [{"client_ref": client_ref, "items": [line(catalog["espresso_id"], 300)]}]

    first = sync(client, auth_headers, batch)
    second = sync(client, auth_headers, batch)

    assert first["recorded"] == 1 and first["duplicates"] == 0
    assert second["recorded"] == 0 and second["duplicates"] == 1
    assert first["results"][0]["order_ref"] == second["results"][0]["order_ref"]
    assert db_session.query(Sale).count() == 1


def test_sync_partial_success_keeps_the_good_entries(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session
):
    """One malformed entry must not discard real sales alongside it."""
    good_ref = ref()
    body = sync(
        client,
        auth_headers,
        [
            {"client_ref": ref(), "items": [line(catalog["espresso_id"], 300)]},
            # declares 500 held but a subtotal that contradicts 2 x 500
            {
                "client_ref": ref(),
                "items": [
                    {
                        "item_id": catalog["flat_white_id"],
                        "quantity": 2,
                        "price_cents": 500,
                        "subtotal_cents": 800,
                        "title": "Bad",
                    }
                ],
            },
            {"client_ref": good_ref, "items": [line(catalog["green_tea_id"], 350)]},
        ],
    )

    # The middle entry is internally inconsistent, so it is refused...
    assert body["rejected"] == 1
    assert body["recorded"] == 2
    statuses = [result["status"] for result in body["results"]]
    assert statuses == ["recorded", "rejected", "recorded"]
    # ...and the good ones are still committed.
    assert db_session.query(Sale).count() == 2


def test_sync_records_the_price_the_customer_paid(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session
):
    """A stale offline price is flagged, not silently rewritten."""
    espresso_id = catalog["espresso_id"]  # catalogue says 300
    client_ref = ref()

    body = sync(client, auth_headers, [{"client_ref": client_ref, "items": [line(espresso_id, 250, 2)]}])

    assert body["recorded"] == 1
    assert body["conflicts"] == 1
    result = body["results"][0]
    assert result["price_conflict"] is True
    assert "recorded at the price paid" in (result["reason"] or "")

    stored = db_session.query(Sale).one()
    assert stored.price_conflict is True
    # Two at the price actually charged, not the current catalogue price.
    assert stored.total_cents == 500
    assert stored.items[0].price_cents == 250


def test_sync_matching_prices_are_not_flagged(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session
):
    body = sync(client, auth_headers, [{"client_ref": ref(), "items": [line(catalog["espresso_id"], 300)]}])

    assert body["conflicts"] == 0
    assert db_session.query(Sale).one().price_conflict is False


def test_sync_keeps_sales_whose_item_was_deleted(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session
):
    """The snapshot is a historical fact; a deleted item must not lose the sale."""
    gone_id = catalog["green_tea_id"]
    assert client.delete(f"/api/admin/items/{gone_id}", headers=auth_headers).status_code == 204

    body = sync(client, auth_headers, [{"client_ref": ref(), "items": [line(gone_id, 350, 1, "Green Tea")]}])

    assert body["recorded"] == 1
    stored = db_session.query(Sale).one()
    assert stored.total_cents == 350
    assert stored.items[0].title == "Green Tea"
    assert stored.items[0].item_id is None


def test_sync_uses_the_catalogue_title_when_the_item_still_exists(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session
):
    body = sync(client, auth_headers, [{"client_ref": ref(), "items": [line(catalog["espresso_id"], 300, 1, "Stale")]}])

    assert body["recorded"] == 1
    # Device title is replaced by the authoritative one.
    assert db_session.query(Sale).one().items[0].title == "Espresso"


def test_sync_uses_the_authenticated_user_not_the_payload(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session, user
):
    sync(client, auth_headers, [{"client_ref": ref(), "items": [line(catalog["espresso_id"], 300)], "user_id": 9999}])

    assert db_session.query(Sale).one().user_id == user.id


# ----------------------------------------------------------- timestamp handling


def test_sync_accepts_a_recent_sold_at(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session):
    sold = datetime.now(timezone.utc) - timedelta(hours=3)

    sync(client, auth_headers, [{"client_ref": ref(), "sold_at": sold.isoformat(), "items": [line(catalog["espresso_id"], 300)]}])

    stored = db_session.query(Sale).one()
    assert stored.sold_at is not None
    assert abs((stored.sold_at.replace(tzinfo=timezone.utc) - sold).total_seconds()) < 2


def test_sync_rejects_an_absurd_device_clock(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session):
    """A wild clock must not corrupt reporting; fall back to server time."""
    long_ago = datetime.now(timezone.utc) - timedelta(days=400)
    far_future = datetime.now(timezone.utc) + timedelta(days=5)

    for bad in (long_ago, far_future):
        sync(client, auth_headers, [{"client_ref": ref(), "sold_at": bad.isoformat(), "items": [line(catalog["espresso_id"], 300)]}])

    stored = db_session.query(Sale).all()
    assert len(stored) == 2
    # sold_at is dropped rather than stored, so reporting uses created_at.
    assert all(sale.sold_at is None for sale in stored)


# --------------------------------------------------------------------- catalogue


def test_catalog_revision_probe_requires_auth(client: TestClient):
    assert client.get("/api/catalog/revision").status_code == 401


def test_catalog_etag_is_stable_and_changes_on_edit(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    first = client.get("/api/catalog", headers=auth_headers)
    assert first.status_code == 200
    etag = first.headers["etag"]
    assert etag.startswith('"cat-')

    # Unchanged catalogue: same tag, and a conditional GET is answered 304.
    again = client.get("/api/catalog", headers=auth_headers)
    assert again.headers["etag"] == etag
    conditional = client.get("/api/catalog", headers={**auth_headers, "If-None-Match": etag})
    assert conditional.status_code == 304
    assert conditional.content == b""

    # An admin edit must move the revision so offline clients refetch.
    item_id = catalog["espresso_id"]
    assert client.patch(f"/api/admin/items/{item_id}", headers=auth_headers, json={"price_cents": 350}).status_code == 200

    after = client.get("/api/catalog", headers=auth_headers)
    assert after.headers["etag"] != etag
    assert client.get("/api/catalog", headers={**auth_headers, "If-None-Match": etag}).status_code == 200


def test_revision_endpoint_tracks_edits(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    before = client.get("/api/catalog/revision", headers=auth_headers).json()["revision"]

    client.post("/api/admin/categories", headers=auth_headers, json={"name": "Merch"})

    after = client.get("/api/catalog/revision", headers=auth_headers).json()["revision"]
    assert after > before


def test_deleting_an_item_advances_the_revision(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    before = client.get("/api/catalog/revision", headers=auth_headers).json()["revision"]

    assert client.delete(f"/api/admin/items/{catalog['espresso_id']}", headers=auth_headers).status_code == 204

    assert client.get("/api/catalog/revision", headers=auth_headers).json()["revision"] > before


def test_creating_a_category_advances_the_revision(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    before = client.get("/api/catalog/revision", headers=auth_headers).json()["revision"]

    client.post("/api/admin/categories", headers=auth_headers, json={"name": "Extras"})

    assert client.get("/api/catalog/revision", headers=auth_headers).json()["revision"] > before
