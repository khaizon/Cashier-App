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
    # Wait for the catalog to arrive so callers can count cards immediately.
    expect(page.locator(".cmsCategory").first).to_be_visible()


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

def test_catalog_editor_is_not_clipped_by_the_nav(page: Page) -> None:
    """The editor must fit .appView; a viewport-tall one hid the last category."""
    open_cms(page)

    overflow = page.evaluate(
        """() => {
            const editor = document.querySelector('.cms').getBoundingClientRect();
            const view = document.querySelector('.appView').getBoundingClientRect();
            return editor.bottom - view.bottom;
        }"""
    )

    assert overflow <= 0.5, f"catalog editor overflows its view by {overflow}px"


def test_category_order_can_be_moved_and_persists(page: Page) -> None:
    open_cms(page)

    names = page.locator(".cmsCategoryName")
    assert names.count() >= 2, "need at least two categories to test ordering"
    first_before = names.first.input_value()

    first_card = page.locator(".cmsCategory").first
    assert first_card.locator(".cmsCategoryOrder").inner_text().strip() == "1"

    first_card.get_by_role("button", name=re.compile(r"Move .* later")).click()

    # The moved category now sits second, and the position badges follow it.
    expect(names.nth(1)).to_have_value(first_before)
    expect(page.locator(".cmsCategory").nth(1).locator(".cmsCategoryOrder")).to_have_text("2")

    # Reload the editor; the server kept the new menu order.
    page.get_by_role("button", name="back to till").click()
    page.get_by_role("button", name="catalog cms").click()
    expect(page.locator(".cmsCategoryName").nth(1)).to_have_value(first_before)


def test_category_can_be_dragged_to_reorder(page: Page) -> None:
    """Exercise the drag handle path, not only the up/down buttons.

    Native HTML5 drag is driven with explicit mouse steps because Playwright's
    drag_to does not emit the drag lifecycle for this handle.
    """
    open_cms(page)

    names = page.locator(".cmsCategoryName")
    assert names.count() >= 2, "need at least two categories to test dragging"
    first_before = names.first.input_value()

    handle = page.locator(".cmsCategory").first.locator(".cmsDragHandle")
    target = page.locator(".cmsCategory").nth(1).locator(".cmsCategoryOrder")
    handle_box = handle.bounding_box()
    target_box = target.bounding_box()
    assert handle_box and target_box

    page.mouse.move(handle_box["x"] + handle_box["width"] / 2, handle_box["y"] + handle_box["height"] / 2)
    page.mouse.down()
    # Chromium needs real movement before it starts a native drag.
    page.mouse.move(
        handle_box["x"] + handle_box["width"] / 2 + 12,
        handle_box["y"] + handle_box["height"] / 2 + 12,
        steps=6,
    )
    page.mouse.move(target_box["x"] + target_box["width"] / 2, target_box["y"] + target_box["height"] / 2, steps=12)
    page.mouse.up()

    # The dragged category now sits second.
    expect(names.nth(1)).to_have_value(first_before)


