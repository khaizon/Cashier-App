"""Catalog endpoint tests — the shape here is what the React app consumes."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_catalog_returns_categories_ordered_with_dollar_prices(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    response = client.get("/api/catalog", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()

    assert [category["category"] for category in body] == ["Coffee", "Tea"]
    assert body[0]["palette1"] == "#111111"

    coffee_items = body[0]["items"]
    assert [item["title"] for item in coffee_items] == ["Espresso", "Flat White"]
    # Price comes back in dollars; it is stored as integer cents.
    assert coffee_items[0]["price"] == 3.0
    assert coffee_items[1]["price"] == 5.0
    assert coffee_items[0]["id"] == catalog["espresso_id"]
    assert coffee_items[0]["img"] == "espresso.png"


def test_catalog_items_carry_every_field_the_frontend_needs(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    body = client.get("/api/catalog", headers=auth_headers).json()
    item = body[0]["items"][0]

    assert set(item) == {"id", "img", "title", "price", "image_id"}
    assert set(body[0]) == {"category", "palette1", "palette2", "palette3", "items"}


def test_catalog_is_empty_before_seeding(client: TestClient, auth_headers: dict[str, str]):
    assert client.get("/api/catalog", headers=auth_headers).json() == []
