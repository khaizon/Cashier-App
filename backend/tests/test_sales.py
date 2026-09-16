"""Sale recording tests — the replacement for the Sheets append."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Item, Sale


def test_create_sale_computes_totals_server_side(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    response = client.post(
        "/api/sales",
        headers=auth_headers,
        json={
            "payment": "cash",
            "items": [
                {"item_id": catalog["espresso_id"], "quantity": 2},  # 2 x 3.00
                {"item_id": catalog["flat_white_id"], "quantity": 1},  # 1 x 5.00
            ],
        },
    )

    assert response.status_code == 201, response.text
    body = response.json()

    assert body["total"] == 11.0
    assert body["payment"] == "cash"
    assert body["order_ref"]
    assert len(body["items"]) == 2

    espresso = next(line for line in body["items"] if line["item_id"] == catalog["espresso_id"])
    assert espresso["title"] == "Espresso"
    assert espresso["price"] == 3.0
    assert espresso["quantity"] == 2
    assert espresso["subtotal"] == 6.0


def test_client_supplied_price_is_ignored(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    response = client.post(
        "/api/sales",
        headers=auth_headers,
        json={
            "payment": "cash",
            "items": [{"item_id": catalog["flat_white_id"], "quantity": 1, "price": 0.01, "subtotal": 0.01}],
        },
    )

    assert response.status_code == 201
    assert response.json()["total"] == 5.0
    assert response.json()["items"][0]["price"] == 5.0


def test_duplicate_item_ids_are_merged_into_one_line(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    response = client.post(
        "/api/sales",
        headers=auth_headers,
        json={
            "items": [
                {"item_id": catalog["espresso_id"], "quantity": 1},
                {"item_id": catalog["espresso_id"], "quantity": 2},
            ]
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["quantity"] == 3
    assert body["total"] == 9.0


def test_cent_arithmetic_stays_exact(client: TestClient, auth_headers: dict[str, str], db_session: Session, catalog: dict[str, int]):
    item = Item(category_id=1, title="Odd Price", price_cents=333, img="odd.png", sort_order=0)
    db_session.add(item)
    db_session.commit()

    response = client.post("/api/sales", headers=auth_headers, json={"items": [{"item_id": item.id, "quantity": 3}]})

    assert response.status_code == 201
    assert response.json()["total"] == 9.99


def test_unknown_item_id_is_rejected(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    response = client.post("/api/sales", headers=auth_headers, json={"items": [{"item_id": 99999, "quantity": 1}]})

    assert response.status_code == 400
    assert "99999" in response.json()["detail"]


def test_invalid_payloads_are_rejected(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    cases = [
        {"items": []},
        {"items": [{"item_id": catalog["espresso_id"], "quantity": 0}]},
        {"items": [{"item_id": catalog["espresso_id"], "quantity": -1}]},
        {"items": [{"item_id": catalog["espresso_id"], "quantity": 1000}]},
        {"items": [{"quantity": 1}]},
        {"items": [{"item_id": catalog["espresso_id"], "quantity": 1}], "payment": "bitcoin"},
    ]

    for payload in cases:
        response = client.post("/api/sales", headers=auth_headers, json=payload)
        assert response.status_code == 422, f"{payload} should not be accepted"


def test_sales_are_listed_newest_first_with_unique_refs(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    for _ in range(3):
        assert (
            client.post(
                "/api/sales", headers=auth_headers, json={"items": [{"item_id": catalog["green_tea_id"], "quantity": 1}]}
            ).status_code
            == 201
        )

    sales = client.get("/api/sales", headers=auth_headers).json()

    assert len(sales) == 3
    assert len({sale["order_ref"] for sale in sales}) == 3
    assert [sale["id"] for sale in sales] == sorted((sale["id"] for sale in sales), reverse=True)


def test_sale_is_persisted_with_the_authenticated_user(
    client: TestClient, auth_headers: dict[str, str], db_session: Session, catalog: dict[str, int], user
):
    client.post("/api/sales", headers=auth_headers, json={"items": [{"item_id": catalog["espresso_id"], "quantity": 1}]})

    sale = db_session.query(Sale).one()
    assert sale.user_id == user.id
    assert sale.total_cents == 300
    assert len(sale.items) == 1
