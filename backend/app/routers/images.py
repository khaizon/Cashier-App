"""Catalogue image storage and delivery.

Uploads are CMS-only (bearer token). Delivery is deliberately unauthenticated:
these bytes are rendered by a plain ``<img src>``, which cannot carry an
``Authorization`` header, so requiring a token here would mean inventing a
signed-URL scheme for no real gain. Instead each image is addressed by a random
``public_id`` and is never referenced by its sequential primary key, so the
public surface cannot be enumerated by counting upwards.

Images are immutable: editing an item's picture persists a *new* row and
repoints the item at it. That is what makes ``Cache-Control: immutable`` safe,
and it also means a sale's historical image keeps resolving.
"""

from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..images import CropBox, ImageError, process_upload
from ..models import ItemImage
from ..schemas import ItemImageOut, image_out

router = APIRouter(prefix="/api/images", tags=["images"])

PUBLIC_ID_BYTES = 16


def store_image(
    db: DbSession,
    *,
    raw: bytes,
    filename: str,
    crop: CropBox | None,
) -> ItemImage:
    """Process ``raw`` and persist it, reusing an identical existing asset.

    Content-addressing on the encoded bytes makes re-uploading the same picture
    free, and keeps the table from accumulating duplicates of the seeded set.
    """
    try:
        processed = process_upload(raw, crop=crop)
    except ImageError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    existing = db.scalar(select(ItemImage).where(ItemImage.sha256 == processed.sha256))
    if existing is not None:
        return existing

    image = ItemImage(
        public_id=secrets.token_urlsafe(PUBLIC_ID_BYTES),
        data=processed.data,
        content_type=processed.content_type,
        filename=(filename or "")[:255],
        width=processed.width,
        height=processed.height,
        byte_size=processed.byte_size,
        sha256=processed.sha256,
    )
    db.add(image)
    db.flush()
    return image


def _parse_crop(
    *,
    crop_left: float | None,
    crop_top: float | None,
    crop_right: float | None,
    crop_bottom: float | None,
) -> CropBox | None:
    """All four crop fields or none — a partial box is a client bug."""
    supplied = [crop_left, crop_top, crop_right, crop_bottom]
    if all(value is None for value in supplied):
        return None
    if any(value is None for value in supplied):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Provide all four crop values (crop_left, crop_top, crop_right, crop_bottom) or none.",
        )
    assert crop_left is not None and crop_top is not None and crop_right is not None and crop_bottom is not None
    return CropBox(left=crop_left, top=crop_top, right=crop_right, bottom=crop_bottom)


@router.post(
    "",
    response_model=ItemImageOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an image (optionally cropped to a square)",
)
def upload_image(
    db: DbSession,
    _user: CurrentUser,
    file: Annotated[UploadFile, File(description="Image to store; any format Pillow can read")],
    crop_left: Annotated[float | None, Form(ge=0.0, le=1.0)] = None,
    crop_top: Annotated[float | None, Form(ge=0.0, le=1.0)] = None,
    crop_right: Annotated[float | None, Form(ge=0.0, le=1.0)] = None,
    crop_bottom: Annotated[float | None, Form(ge=0.0, le=1.0)] = None,
) -> ItemImageOut:
    crop = _parse_crop(
        crop_left=crop_left,
        crop_top=crop_top,
        crop_right=crop_right,
        crop_bottom=crop_bottom,
    )
    raw = file.file.read()
    image = store_image(db, raw=raw, filename=file.filename or "", crop=crop)
    db.commit()
    db.refresh(image)
    return image_out(image)


@router.get("/{public_id}", summary="Fetch an image's bytes")
def read_image(public_id: str, db: DbSession) -> Response:
    image = db.scalar(select(ItemImage).where(ItemImage.public_id == public_id))
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")

    etag = f'"{image.sha256}"'
    return Response(
        content=image.data,
        media_type=image.content_type,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": etag,
            "Content-Length": str(image.byte_size),
        },
    )
