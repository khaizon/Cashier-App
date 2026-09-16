"""Image decoding, square-cropping, and re-encoding."""

from __future__ import annotations

from io import BytesIO

import pytest
from PIL import Image

from app.images import CropBox, ImageError, process_upload, resolve_crop


def make_image(width: int, height: int, *, color=(120, 60, 200), fmt: str = "PNG") -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (width, height), color).save(buffer, format=fmt)
    return buffer.getvalue()


def quadrant_image(size: int = 200) -> bytes:
    """Four flat quadrants so a crop's origin is identifiable from one pixel."""
    image = Image.new("RGB", (size, size), (255, 0, 0))  # top-left red
    half = size // 2
    for x in range(half, size):
        for y in range(half, size):
            image.putpixel((x, y), (0, 0, 255))  # bottom-right blue
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def decode(data: bytes) -> Image.Image:
    return Image.open(BytesIO(data))


def centre_pixel(data: bytes) -> tuple[int, int, int]:
    image = decode(data).convert("RGB")
    return image.getpixel((image.width // 2, image.height // 2))


def assert_color_close(actual: tuple[int, int, int], expected: tuple[int, int, int], tolerance: int = 6) -> None:
    """WebP is lossy, so channel values come back near-identical, not exact."""
    assert all(abs(a - e) <= tolerance for a, e in zip(actual, expected)), f"{actual} !~ {expected}"


# --------------------------------------------------------------------- resolve_crop


def test_centre_crop_of_landscape_is_square_and_centred():
    box, rect = resolve_crop(width=400, height=200, crop=None)

    assert rect == (100, 0, 300, 200)
    assert box.width == pytest.approx(0.5)
    assert box.height == pytest.approx(1.0)
    assert rect[2] - rect[0] == rect[3] - rect[1]


def test_centre_crop_of_portrait_is_square():
    _, rect = resolve_crop(width=200, height=400, crop=None)

    assert rect == (0, 100, 200, 300)


def test_square_input_is_left_alone():
    _, rect = resolve_crop(width=300, height=300, crop=None)

    assert rect == (0, 0, 300, 300)


def test_non_square_crop_request_is_re_derived_as_a_square():
    # 0..0.5 wide but 0..1 tall: the server must not honour that aspect ratio.
    _, rect = resolve_crop(width=400, height=400, crop=CropBox(left=0.0, top=0.0, right=0.5, bottom=1.0))

    assert rect[2] - rect[0] == rect[3] - rect[1] == 200


def test_crop_is_clamped_inside_the_image_bounds():
    # Sliding a full-height square hard against the right edge.
    _, rect = resolve_crop(width=400, height=200, crop=CropBox(left=0.9, top=0.0, right=1.0, bottom=1.0))

    assert rect[0] >= 0 and rect[1] >= 0
    assert rect[2] <= 400 and rect[3] <= 200


def test_all_zero_crop_is_rejected():
    with pytest.raises(ImageError):
        resolve_crop(width=100, height=100, crop=CropBox(left=0.5, top=0.5, right=0.5, bottom=0.5))


def test_crop_must_be_within_zero_to_one():
    with pytest.raises(ImageError):
        resolve_crop(width=100, height=100, crop=CropBox(left=-0.1, top=0.0, right=1.0, bottom=1.0))


# ------------------------------------------------------------------ process_upload


def test_landscape_upload_becomes_a_square():
    result = process_upload(make_image(400, 200))

    assert result.width == result.height == 200
    assert decode(result.data).size == (200, 200)
    assert result.content_type == "image/webp"


def test_portrait_upload_becomes_a_square():
    result = process_upload(make_image(150, 600))

    assert result.width == result.height == 150


def test_output_is_never_upscaled():
    result = process_upload(make_image(64, 64))

    assert result.width == 64


def test_large_upload_is_downscaled_to_output_size():
    result = process_upload(make_image(4000, 3000))

    assert result.width == result.height == 1024
    # Downscaling is the point: the stored blob should be far smaller than raw.
    assert result.byte_size < 4000 * 3000


def test_crop_selects_the_requested_region():
    result = process_upload(
        quadrant_image(),
        crop=CropBox(left=0.5, top=0.5, right=1.0, bottom=1.0),
    )

    red, green, blue = centre_pixel(result.data)
    assert blue > 200 and red < 60


def test_default_crop_centres_on_the_image():
    result = process_upload(make_image(400, 200, color=(10, 200, 10)))

    assert_color_close(centre_pixel(result.data), (10, 200, 10))


def test_exif_orientation_is_applied_before_cropping():
    """A phone photo tagged 'rotate 90' must be cropped in its visible orientation."""
    image = Image.new("RGB", (100, 50), (200, 30, 30))
    exif = image.getexif()
    exif[274] = 6  # Orientation: rotate 90° clockwise
    buffer = BytesIO()
    image.save(buffer, format="JPEG", exif=exif)

    result = process_upload(buffer.getvalue())

    # Untagged 100x50 would centre-crop to 50x50; with rotation applied the
    # visible image is 50x100, so the square is the full 50px width.
    assert result.width == result.height == 50


def test_sha256_matches_the_stored_bytes():
    import hashlib

    result = process_upload(make_image(80, 80))

    assert result.sha256 == hashlib.sha256(result.data).hexdigest()


def test_identical_input_produces_identical_bytes():
    first = process_upload(quadrant_image())
    second = process_upload(quadrant_image())

    assert first.sha256 == second.sha256


def test_empty_upload_is_rejected():
    with pytest.raises(ImageError):
        process_upload(b"")


def test_non_image_bytes_are_rejected():
    with pytest.raises(ImageError):
        process_upload(b"this is not an image, it is a sentence")


def test_oversized_upload_is_rejected():
    from app.images import MAX_UPLOAD_BYTES

    with pytest.raises(ImageError) as excinfo:
        process_upload(b"\x00" * (MAX_UPLOAD_BYTES + 1))

    assert excinfo.value.status_code == 413


def test_transparency_survives_round_trip():
    buffer = BytesIO()
    Image.new("RGBA", (100, 100), (255, 0, 0, 128)).save(buffer, format="PNG")

    result = process_upload(buffer.getvalue())

    assert decode(result.data).mode in ("RGBA", "RGB")
    assert decode(result.data).size == (100, 100)
