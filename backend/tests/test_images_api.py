"""Image upload, processing-on-upload, and public delivery."""

from __future__ import annotations

import hashlib
from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image


def png_bytes(width: int = 400, height: int = 200, *, fmt: str = "PNG") -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (width, height), (30, 140, 200)).save(buffer, format=fmt)
    return buffer.getvalue()


def quadrant_png_bytes(size: int = 200) -> bytes:
    """Flat red over the top-left half, flat blue over the bottom-right."""
    image = Image.new("RGB", (size, size), (255, 0, 0))
    for x in range(size // 2, size):
        for y in range(size // 2, size):
            image.putpixel((x, y), (0, 0, 255))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def upload(client: TestClient, headers: dict[str, str], data: bytes, *, filename: str = "photo.png", **crop):
    files = {"file": (filename, data, "image/png")}
    form = {key: str(value) for key, value in crop.items()}
    return client.post("/api/images", headers=headers, files=files, data=form or None)


def centre_pixel(data: bytes) -> tuple[int, int, int]:
    image = Image.open(BytesIO(data)).convert("RGB")
    return image.getpixel((image.width // 2, image.height // 2))


def test_upload_requires_authentication(client: TestClient):
    response = client.post("/api/images", files={"file": ("p.png", png_bytes(), "image/png")})

    assert response.status_code == 401


def test_upload_returns_metadata_for_a_square_image(client: TestClient, auth_headers: dict[str, str]):
    response = upload(client, auth_headers, png_bytes(400, 200), filename="mug.png")

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["width"] == body["height"] == 200
    assert body["content_type"] == "image/webp"
    assert body["original_filename"] == "mug.png"
    assert body["url"].startswith("/api/images/")
    assert body["byte_size"] > 0


def test_uploaded_image_is_served_back_as_bytes(client: TestClient, auth_headers: dict[str, str]):
    body = upload(client, auth_headers, png_bytes(300, 300)).json()

    response = client.get(body["url"])

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/webp"
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"
    assert Image.open(BytesIO(response.content)).size == (300, 300)


def test_crop_parameters_choose_the_stored_region(client: TestClient, auth_headers: dict[str, str]):
    """Top-left and bottom-right crops of the same upload must differ."""
    # A flat image would dedup to the same asset even if the crop were ignored,
    # so the source has to carry spatial detail.
    source = quadrant_png_bytes()

    top_left = upload(client, auth_headers, source, crop_left=0.0, crop_top=0.0, crop_right=0.5, crop_bottom=0.5)
    bottom_right = upload(client, auth_headers, source, crop_left=0.5, crop_top=0.5, crop_right=1.0, crop_bottom=1.0)

    assert top_left.status_code == 201, top_left.text
    assert bottom_right.status_code == 201, bottom_right.text
    # Different regions -> different bytes -> different stored assets.
    assert top_left.json()["id"] != bottom_right.json()["id"]

    left_bytes = client.get(top_left.json()["url"]).content
    right_bytes = client.get(bottom_right.json()["url"]).content
    assert left_bytes != right_bytes

    left_center = centre_pixel(left_bytes)
    right_center = centre_pixel(right_bytes)
    # WebP is lossy; assert the dominant channel rather than exact RGB.
    assert left_center[0] > 200 and left_center[2] < 60  # red
    assert right_center[2] > 200 and right_center[0] < 60  # blue


def test_partial_crop_parameters_are_rejected(client: TestClient, auth_headers: dict[str, str]):
    response = upload(client, auth_headers, png_bytes(), crop_left=0.2)

    assert response.status_code == 422
    assert "all four crop values" in response.json()["detail"]


def test_crop_outside_zero_to_one_is_rejected(client: TestClient, auth_headers: dict[str, str]):
    response = client.post(
        "/api/images",
        headers=auth_headers,
        files={"file": ("p.png", png_bytes(), "image/png")},
        data={"crop_left": "2", "crop_top": "0", "crop_right": "3", "crop_bottom": "1"},
    )

    assert response.status_code == 422


def test_non_image_upload_is_rejected(client: TestClient, auth_headers: dict[str, str]):
    response = upload(client, auth_headers, b"definitely not an image", filename="notes.txt")

    assert response.status_code == 400
    assert "not a readable image" in response.json()["detail"]


def test_identical_uploads_reuse_one_stored_image(client: TestClient, auth_headers: dict[str, str]):
    first = upload(client, auth_headers, png_bytes(250, 250)).json()
    second = upload(client, auth_headers, png_bytes(250, 250)).json()

    assert first["id"] == second["id"]
    assert first["url"] == second["url"]


def test_unknown_image_url_returns_404(client: TestClient):
    assert client.get("/api/images/does-not-exist").status_code == 404


def test_uploaded_asset_replaces_the_catalog_image_url(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    uploaded = upload(client, auth_headers, png_bytes(200, 200)).json()

    response = client.patch(
        f"/api/admin/items/{catalog['espresso_id']}",
        headers=auth_headers,
        json={"image_id": uploaded["id"]},
    )
    assert response.status_code == 200, response.text

    espresso = client.get("/api/catalog", headers=auth_headers).json()[0]["items"][0]
    assert espresso["image_id"] == uploaded["id"]
    # The catalog now advertises the stored asset instead of the seeded filename.
    assert espresso["img"].startswith("/api/images/")
    assert client.get(espresso["img"]).status_code == 200


def test_dedup_key_is_the_hash_of_the_stored_bytes(client: TestClient, auth_headers: dict[str, str]):
    body = upload(client, auth_headers, png_bytes(320, 320)).json()

    response = client.get(body["url"])
    assert hashlib.sha256(response.content).hexdigest() == response.headers["etag"].strip('"')
