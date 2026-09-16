"""Image intake for CMS uploads: decode, square-crop, re-encode.

Every uploaded image leaves this module as a *square*: the app renders item
tiles in a square frame, so cropping is a data-normalisation step here rather
than something each client has to reimplement.

The crop is described by the client as four floats in 0..1 coordinates
(``left``/``top``/``right``/``bottom``, relative to the *oriented, full-size*
image). That keeps the contract resolution-independent: the browser can preview
on a downscaled canvas and still describe a crop that is exact on the original
pixels. The server is the one that has to be right here, so it never trusts the
client to have sent a square — it re-derives and clamps the box, and always
emits a square regardless.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

# Pillow refuses images above this many pixels (decompression-bomb guard). Well
# above any phone camera, so it only ever rejects hostile input.
Image.MAX_IMAGE_PIXELS = 64_000_000

# Hard ceiling on the request body we are willing to buffer.
MAX_UPLOAD_BYTES = 12 * 1024 * 1024

# Longest edge of the stored square. Item tiles never need more than this, and
# it keeps the SQLite blob small (~40 KB typical for WebP).
OUTPUT_SIZE = 1024

# Smallest crop the client may ask for, as a fraction of the shorter edge.
# Prevents "zoom into 12 pixels" producing an unusable asset.
MIN_CROP_FRACTION = 0.05

# WebP keeps transparency and is markedly smaller than PNG/JPEG at equal quality.
OUTPUT_CONTENT_TYPE = "image/webp"
OUTPUT_FORMAT = "WEBP"


class ImageError(ValueError):
    """Uploaded bytes or crop parameters are unusable.

    ``status_code`` lets the router map each case to a sensible HTTP response.
    """

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class CropBox:
    """A normalised crop rectangle, in 0..1 coordinates of the source image."""

    left: float
    top: float
    right: float
    bottom: float

    @property
    def width(self) -> float:
        return self.right - self.left

    @property
    def height(self) -> float:
        return self.bottom - self.top


@dataclass(frozen=True)
class ProcessedImage:
    """Bytes plus the metadata needed to persist an ``ItemImage`` row."""

    data: bytes
    content_type: str
    width: int
    height: int
    byte_size: int
    sha256: str
    crop: CropBox


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def resolve_crop(
    *,
    width: int,
    height: int,
    crop: CropBox | None,
) -> tuple[CropBox, tuple[int, int, int, int]]:
    """Turn a requested crop into a guaranteed-square box.

    Returns the normalised box actually used (for echoing back to the client)
    and the integer pixel rect to hand to Pillow.

    ``None`` means "centre square", which is what a client sends when the user
    accepts the default framing.
    """
    if width <= 0 or height <= 0:
        raise ImageError("Image has no usable pixels.")

    shorter = min(width, height)

    if crop is None:
        # Largest centred square.
        if width >= height:
            left_px = (width - shorter) // 2
            box = CropBox(
                left=left_px / width,
                top=0.0,
                right=(left_px + shorter) / width,
                bottom=1.0,
            )
        else:
            top_px = (height - shorter) // 2
            box = CropBox(
                left=0.0,
                top=top_px / height,
                right=1.0,
                bottom=(top_px + shorter) / height,
            )
    else:
        for name, value in (("left", crop.left), ("top", crop.top), ("right", crop.right), ("bottom", crop.bottom)):
            if not (value == value) or value in (float("inf"), float("-inf")):
                raise ImageError(f"Crop {name} must be a finite number.")
            if not 0.0 <= value <= 1.0:
                raise ImageError(f"Crop {name} must be between 0 and 1 (got {value}).")

        if crop.width <= 0 or crop.height <= 0:
            raise ImageError("Crop rectangle is empty.")

        side = min(crop.width, crop.height)
        if side < MIN_CROP_FRACTION:
            raise ImageError(
                f"Crop is too small ({side:.3f} of the image); "
                f"keep at least {MIN_CROP_FRACTION:.0%} of the shorter edge."
            )

        # Re-derive a true square centred on the requested rectangle, then slide
        # it inside the image bounds. This is what makes a non-square (or
        # out-of-bounds) request come out square and valid.
        cx = (crop.left + crop.right) / 2
        cy = (crop.top + crop.bottom) / 2

        left = _clamp(cx - side / 2, 0.0, 1.0 - side)
        top = _clamp(cy - side / 2, 0.0, 1.0 - side)
        box = CropBox(left=left, top=top, right=left + side, bottom=top + side)

    left_px = round(box.left * width)
    top_px = round(box.top * height)
    # Integer sides must match, or the crop is not square in pixel space.
    side_px = min(round(box.width * width), round(box.height * height))
    if side_px < 1:
        raise ImageError("Crop rectangle is smaller than one pixel.")

    left_px = min(left_px, width - side_px)
    top_px = min(top_px, height - side_px)
    left_px = max(left_px, 0)
    top_px = max(top_px, 0)

    return box, (left_px, top_px, left_px + side_px, top_px + side_px)


def process_upload(
    raw: bytes,
    *,
    crop: CropBox | None = None,
    output_size: int = OUTPUT_SIZE,
) -> ProcessedImage:
    """Decode ``raw``, apply ``crop`` (or centre-square), and re-encode.

    Re-encoding is deliberate: it strips EXIF and trailing payloads, so a
    "JPEG" cannot smuggle arbitrary bytes into the database.
    """
    if not raw:
        raise ImageError("Uploaded file is empty.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ImageError(
            f"Image is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
            status_code=413,
        )

    try:
        image = Image.open(BytesIO(raw))
        # Honour EXIF rotation *before* geometry, so a portrait phone photo is
        # cropped in the orientation the user actually saw in the browser.
        image = ImageOps.exif_transpose(image)
        image.load()
    except UnidentifiedImageError as exc:
        raise ImageError("That file is not a readable image.") from exc
    except Image.DecompressionBombError as exc:  # pragma: no cover - guard path
        raise ImageError("Image is too large to process.", status_code=413) from exc
    except OSError as exc:
        raise ImageError("That image is corrupt or truncated.") from exc

    if image.mode not in ("RGB", "RGBA", "L", "LA", "P"):
        image = image.convert("RGBA")
    if image.mode in ("L", "LA", "P"):
        # Keep it simple: no palette/grayscale arithmetic downstream.
        image = image.convert("RGBA" if "A" in image.mode else "RGB")

    width, height = image.size
    box, rect = resolve_crop(width=width, height=height, crop=crop)

    square = image.crop(rect)

    # Never upscale: a 200px crop stored as 1024px is just a bigger lie.
    side = min(rect[2] - rect[0], output_size)
    if square.size != (side, side):
        square = square.resize((side, side), Image.Resampling.LANCZOS)

    if square.mode == "RGBA":
        # Without this, WebP may store a fully-opaque alpha channel needlessly.
        alpha = square.getchannel("A")
        if alpha.getextrema() == (255, 255):
            square = square.convert("RGB")
    elif square.mode != "RGB":
        square = square.convert("RGB")

    buffer = BytesIO()
    try:
        square.save(buffer, format=OUTPUT_FORMAT, quality=88, method=4)
    except OSError as exc:  # pragma: no cover - encoder failure
        raise ImageError("Could not encode the processed image.") from exc

    data = buffer.getvalue()
    return ProcessedImage(
        data=data,
        content_type=OUTPUT_CONTENT_TYPE,
        width=square.width,
        height=square.height,
        byte_size=len(data),
        sha256=hashlib.sha256(data).hexdigest(),
        crop=box,
    )
