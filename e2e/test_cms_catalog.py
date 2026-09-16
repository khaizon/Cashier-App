"""CMS end-to-end: crop an image in the browser and see it on the till.

Exercises the full path the feature is about — file picker → square crop UI →
upload → database → served bytes → catalog — rather than any one layer in
isolation.
"""

from __future__ import annotations

import re
from io import BytesIO
from pathlib import Path

from PIL import Image
from playwright.sync_api import Page, expect

from conftest import login


def write_landscape_png(path: Path, width: int = 640, height: int = 360) -> Path:
    """A non-square image, so the cropper has real work to do."""
    Image.new("RGB", (width, height), (220, 60, 60)).save(path, format="PNG")
    return path


def open_cms(page: Page) -> None:
    login(page)
    page.get_by_role("button", name="catalog cms").click()
    expect(page.get_by_role("heading", name="Catalog CMS")).to_be_visible()


def test_cropper_appears_for_a_non_square_image(page: Page, tmp_path: Path) -> None:
    source = write_landscape_png(tmp_path / "wide.png")
    open_cms(page)

    first_row = page.locator(".cmsItem").first
    first_row.locator("input[type=file]").set_input_files(str(source))

    dialog = page.get_by_role("dialog", name="Crop image to a square")
    expect(dialog).to_be_visible()
    # The header confirms the source dimensions the browser decoded.
    expect(dialog).to_contain_text("640×360")

    dialog.get_by_role("button", name="cancel").click()
    expect(dialog).to_be_hidden()


def test_uploading_a_cropped_image_updates_the_catalog(page: Page, tmp_path: Path) -> None:
    source = write_landscape_png(tmp_path / "wide.png")
    open_cms(page)

    first_row = page.locator(".cmsItem").first
    title = first_row.locator(".cmsItemTitle").input_value()
    first_row.locator("input[type=file]").set_input_files(str(source))

    dialog = page.get_by_role("dialog", name="Crop image to a square")
    expect(dialog).to_be_visible()

    # Crop a tighter square, then apply.
    dialog.locator("input[type=range]").fill("2")
    dialog.get_by_role("button", name="use this crop").click()
    expect(dialog).to_be_hidden()

    # The row now has a stored image and a pending change to save.
    thumb = first_row.locator(".cmsThumb img")
    expect(thumb).to_be_visible()
    src = thumb.get_attribute("src") or ""
    assert "/api/images/" in src, f"thumbnail should point at the stored asset, got {src!r}"

    # Saving persists it; the image must come back from the API as a square.
    first_row.get_by_role("button", name="save").click()
    expect(first_row.get_by_role("button", name="save")).to_be_disabled()

    response = page.request.get(src)
    assert response.ok, f"stored image not retrievable: {response.status}"
    with Image.open(BytesIO(response.body())) as stored:
        assert stored.width == stored.height, f"stored image is not square: {stored.size}"

    # The till shows the new asset after leaving the CMS. The catalog URL adds a
    # cache-busting ?v= that the upload response does not carry, so compare the
    # path rather than the exact string.
    page.get_by_role("button", name="back to till").click()
    card = page.locator(".itemCard").filter(has_text=title).first
    expect(card.locator("img")).to_have_attribute("src", re.compile(rf"^{re.escape(src)}(\?v=\d+)?$"))
