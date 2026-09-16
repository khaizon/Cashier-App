"""Catalog administration endpoints used by the CMS."""

from __future__ import annotations

from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image


def png_bytes(width: int = 200, height: int = 200) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (width, height), (10, 20, 30)).save(buffer, format="PNG")
    return buffer.getvalue()


def upload_image(client: TestClient, headers: dict[str, str], *, size: int = 200) -> dict:
    response = client.post(
        "/api/images",
        headers=headers,
        files={"file": ("asset.png", png_bytes(size, size), "image/png")},
    )
    assert response.status_code == 201, response.text
    return response.json()


# ------------------------------------------------------------------------ access


def test_admin_catalog_requires_authentication(client: TestClient):
    assert client.get("/api/admin/catalog").status_code == 401


def test_mutations_require_authentication(client: TestClient):
    assert client.post("/api/admin/categories", json={"name": "Drinks"}).status_code == 401
    assert client.patch("/api/admin/items/1", json={"title": "x"}).status_code == 401
    assert client.delete("/api/admin/items/1").status_code == 401


# -------------------------------------------------------------------- categories


def test_admin_catalog_exposes_cents_and_ids(client: TestClient, auth_headers: dict[str, str], catalog):
    body = client.get("/api/admin/catalog", headers=auth_headers).json()

    assert [category["name"] for category in body] == ["Coffee", "Tea"]
    espresso = body[0]["items"][0]
    assert espresso["price_cents"] == 300
    assert espresso["category_id"] == body[0]["id"]
    assert espresso["image_url"] is None
    assert set(espresso) == {
        "id",
        "category_id",
        "title",
        "price_cents",
        "img",
        "image_id",
        "image_url",
        "sort_order",
    }


def test_create_category_appends_to_the_end(client: TestClient, auth_headers: dict[str, str], catalog):
    response = client.post("/api/admin/categories", headers=auth_headers, json={"name": "Merch"})

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["name"] == "Merch"
    assert body["sort_order"] > 1
    assert body["items"] == []


def test_duplicate_category_name_is_rejected(client: TestClient, auth_headers: dict[str, str], catalog):
    response = client.post("/api/admin/categories", headers=auth_headers, json={"name": "Coffee"})

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_update_category_palette(client: TestClient, auth_headers: dict[str, str], catalog):
    category_id = client.get("/api/admin/catalog", headers=auth_headers).json()[0]["id"]

    response = client.patch(
        f"/api/admin/categories/{category_id}",
        headers=auth_headers,
        json={"palette1": "#abcdef"},
    )

    assert response.status_code == 200
    assert response.json()["palette1"] == "#abcdef"
    # Untouched fields survive a partial update.
    assert response.json()["name"] == "Coffee"


def test_update_missing_category_is_404(client: TestClient, auth_headers: dict[str, str]):
    assert client.patch("/api/admin/categories/9999", headers=auth_headers, json={"name": "x"}).status_code == 404


def test_delete_category_removes_its_items(client: TestClient, auth_headers: dict[str, str], catalog):
    category_id = client.get("/api/admin/catalog", headers=auth_headers).json()[0]["id"]

    assert client.delete(f"/api/admin/categories/{category_id}", headers=auth_headers).status_code == 204

    remaining = client.get("/api/admin/catalog", headers=auth_headers).json()
    assert [category["name"] for category in remaining] == ["Tea"]


# ------------------------------------------------------------------------- items


def test_create_item_uses_cents_and_appends(client: TestClient, auth_headers: dict[str, str], catalog):
    category_id = client.get("/api/admin/catalog", headers=auth_headers).json()[0]["id"]

    response = client.post(
        "/api/admin/items",
        headers=auth_headers,
        json={"category_id": category_id, "title": "Mocha", "price_cents": 650},
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["price_cents"] == 650
    assert body["image_id"] is None
    assert body["sort_order"] > 1


def test_create_item_in_missing_category_is_404(client: TestClient, auth_headers: dict[str, str]):
    response = client.post(
        "/api/admin/items",
        headers=auth_headers,
        json={"category_id": 4242, "title": "Ghost", "price_cents": 100},
    )

    assert response.status_code == 404


def test_create_item_with_unknown_image_is_404(client: TestClient, auth_headers: dict[str, str], catalog):
    category_id = client.get("/api/admin/catalog", headers=auth_headers).json()[0]["id"]

    response = client.post(
        "/api/admin/items",
        headers=auth_headers,
        json={"category_id": category_id, "title": "Ghost", "price_cents": 100, "image_id": 9999},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Image not found."


def test_negative_price_is_rejected(client: TestClient, auth_headers: dict[str, str], catalog):
    category_id = client.get("/api/admin/catalog", headers=auth_headers).json()[0]["id"]

    response = client.post(
        "/api/admin/items",
        headers=auth_headers,
        json={"category_id": category_id, "title": "Refund", "price_cents": -1},
    )

    assert response.status_code == 422


def test_update_item_keeps_unspecified_fields(client: TestClient, auth_headers: dict[str, str], catalog):
    item_id = catalog["espresso_id"]

    response = client.patch(f"/api/admin/items/{item_id}", headers=auth_headers, json={"title": "Ristretto"})

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Ristretto"
    assert body["price_cents"] == 300  # untouched
    assert body["img"] == "espresso.png"  # untouched


def test_moving_item_to_another_category_appends_it(client: TestClient, auth_headers: dict[str, str], catalog):
    tea_id = client.get("/api/admin/catalog", headers=auth_headers).json()[1]["id"]

    response = client.patch(
        f"/api/admin/items/{catalog['espresso_id']}",
        headers=auth_headers,
        json={"category_id": tea_id},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["category_id"] == tea_id
    assert body["sort_order"] > 0


def test_delete_item(client: TestClient, auth_headers: dict[str, str], catalog):
    assert client.delete(f"/api/admin/items/{catalog['espresso_id']}", headers=auth_headers).status_code == 204

    coffee = client.get("/api/admin/catalog", headers=auth_headers).json()[0]
    assert [item["title"] for item in coffee["items"]] == ["Flat White"]


def test_delete_missing_item_is_404(client: TestClient, auth_headers: dict[str, str]):
    assert client.delete("/api/admin/items/9999", headers=auth_headers).status_code == 404


# ------------------------------------------------------------------------ images


def test_attaching_an_image_populates_the_admin_image_url(client: TestClient, auth_headers: dict[str, str], catalog):
    uploaded = upload_image(client, auth_headers)

    response = client.patch(
        f"/api/admin/items/{catalog['espresso_id']}",
        headers=auth_headers,
        json={"image_id": uploaded["id"]},
    )

    assert response.status_code == 200, response.text
    # First assignment bumps image_version to 1, which the URL carries.
    assert response.json()["image_url"] == f"{uploaded['url']}?v=1"


def test_replacing_an_image_bumps_the_cache_busting_version(client: TestClient, auth_headers: dict[str, str], catalog):
    first = upload_image(client, auth_headers, size=200)
    second = upload_image(client, auth_headers, size=180)
    assert first["id"] != second["id"]

    client.patch(f"/api/admin/items/{catalog['espresso_id']}", headers=auth_headers, json={"image_id": first["id"]})
    response = client.patch(
        f"/api/admin/items/{catalog['espresso_id']}",
        headers=auth_headers,
        json={"image_id": second["id"]},
    )

    url = response.json()["image_url"]
    assert url.startswith(second["url"])
    assert "?v=2" in url


def test_reassigning_the_same_image_does_not_bump_the_version(client: TestClient, auth_headers: dict[str, str], catalog):
    uploaded = upload_image(client, auth_headers)
    item_id = catalog["espresso_id"]
    client.patch(f"/api/admin/items/{item_id}", headers=auth_headers, json={"image_id": uploaded["id"]})

    response = client.patch(f"/api/admin/items/{item_id}", headers=auth_headers, json={"image_id": uploaded["id"]})

    assert "?v=1" in response.json()["image_url"]


def test_clearing_an_image_falls_back_to_the_legacy_url(client: TestClient, auth_headers: dict[str, str], catalog):
    uploaded = upload_image(client, auth_headers)
    item_id = catalog["espresso_id"]
    client.patch(f"/api/admin/items/{item_id}", headers=auth_headers, json={"image_id": uploaded["id"]})

    response = client.patch(f"/api/admin/items/{item_id}", headers=auth_headers, json={"image_id": None})

    assert response.status_code == 200, response.text
    assert response.json()["image_id"] is None
    assert response.json()["image_url"] is None


def test_deleting_an_image_in_use_is_refused(client: TestClient, auth_headers: dict[str, str], catalog):
    uploaded = upload_image(client, auth_headers)
    client.patch(f"/api/admin/items/{catalog['espresso_id']}", headers=auth_headers, json={"image_id": uploaded["id"]})

    response = client.delete(f"/api/admin/images/{uploaded['id']}", headers=auth_headers)

    assert response.status_code == 409
    assert "still used" in response.json()["detail"]


def test_deleting_an_unreferenced_image_succeeds(client: TestClient, auth_headers: dict[str, str]):
    uploaded = upload_image(client, auth_headers)

    assert client.delete(f"/api/admin/images/{uploaded['id']}", headers=auth_headers).status_code == 204
    assert client.get(uploaded["url"]).status_code == 404


def test_deleting_an_item_leaves_its_image_available(client: TestClient, auth_headers: dict[str, str], catalog):
    """Sale history reasons: the asset outlives the item that pointed at it."""
    uploaded = upload_image(client, auth_headers)
    item_id = catalog["espresso_id"]
    client.patch(f"/api/admin/items/{item_id}", headers=auth_headers, json={"image_id": uploaded["id"]})

    client.delete(f"/api/admin/items/{item_id}", headers=auth_headers)

    assert client.get(uploaded["url"]).status_code == 200
