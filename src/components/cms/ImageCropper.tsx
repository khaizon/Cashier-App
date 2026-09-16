import { FC, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';

import './ImageCropper.css';
import type { CropBox } from '../../api/client';

type ImageCropperProps = {
  file: File;
  onCancel: () => void;
  /** Receives a normalised, guaranteed-square crop box in 0..1 coordinates. */
  onApply: (crop: CropBox) => void;
  busy?: boolean;
};

/** Square edge as a fraction of the source image's shorter edge. */
const MAX_ZOOM = 8;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Keep the crop window inside the image by centring on the requested point. */
function clampOffset(offset: number, side: number, limit: number): number {
  if (side >= limit) return 0;
  return clamp(offset, (side - limit) / 2, (limit - side) / 2);
}

const ImageCropper: FC<ImageCropperProps> = ({ file, onCancel, onApply, busy = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [source, setSource] = useState<ImageBitmap | null>(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [boxSize, setBoxSize] = useState(240);

  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  // Decode once per file. createImageBitmap applies EXIF orientation, so what is
  // shown here matches what the server sees (it calls exif_transpose).
  useEffect(() => {
    let cancelled = false;
    let bitmap: ImageBitmap | null = null;

    createImageBitmap(file, { imageOrientation: 'from-image' })
      .then((result) => {
        if (cancelled) {
          result.close();
          return;
        }
        bitmap = result;
        setSource(result);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setError('');
      })
      .catch(() => {
        if (!cancelled) setError('That file could not be opened as an image.');
      });

    return () => {
      cancelled = true;
      bitmap?.close();
    };
  }, [file]);

  // Every derived value falls out of zoom + offset + the image's own size.
  const side = source ? Math.min(source.width, source.height) / zoom : 0;
  const viewport = source
    ? {
        x: clamp(source.width / 2 + offset.x - side / 2, 0, source.width - side),
        y: clamp(source.height / 2 + offset.y - side / 2, 0, source.height - side),
      }
    : { x: 0, y: 0 };

  const displaySize = boxSize;

  // Track the available width so the crop square scales down on small screens.
  useEffect(() => {
    const measure = () => setBoxSize(clamp(Math.round(window.innerWidth * 0.6), 160, 340));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source || side <= 0) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const pixels = Math.max(1, Math.round(displaySize));
    if (canvas.width !== pixels || canvas.height !== pixels) {
      canvas.width = pixels;
      canvas.height = pixels;
    }

    // Zoomed in far enough that smoothing would only blur detail.
    context.imageSmoothingEnabled = zoom <= 2;
    context.clearRect(0, 0, pixels, pixels);
    context.drawImage(source, viewport.x, viewport.y, side, side, 0, 0, pixels, pixels);
  }, [source, side, viewport.x, viewport.y, zoom, displaySize]);

  useEffect(() => {
    draw();
  }, [draw]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!source) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !source || displaySize <= 0) return;

    // Pointer pixels -> source pixels, so dragging tracks the cursor 1:1 at any zoom.
    const scale = side / displaySize;
    setOffset({
      x: clampOffset(drag.originX - (event.clientX - drag.startX) * scale, side, source.width),
      y: clampOffset(drag.originY - (event.clientY - drag.startY) * scale, side, source.height),
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  const apply = () => {
    if (!source || side <= 0) return;
    // Normalised against each axis independently: for a non-square source the
    // x and y fractions differ, which is exactly what the API expects.
    onApply({
      left: viewport.x / source.width,
      top: viewport.y / source.height,
      right: (viewport.x + side) / source.width,
      bottom: (viewport.y + side) / source.height,
    });
  };

  const isSquare = source ? source.width === source.height : false;

  return (
    <div className="cropperBackdrop" role="dialog" aria-modal="true" aria-label="Crop image to a square">
      <div className="cropperCard">
        <header className="cropperHeader">
          <h2>Crop to square</h2>
          <p>
            {source
              ? isSquare
                ? 'Already square — adjust the framing if you like.'
                : `Source is ${source.width}×${source.height}. Drag to choose the square.`
              : 'Loading image…'}
          </p>
        </header>

        {error ? (
          <div className="cropperError">{error}</div>
        ) : (
          <>
            <div
              className="cropperStage"
              style={{ width: boxSize, height: boxSize }}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <canvas ref={canvasRef} className="cropperCanvas" />
              <div ref={boxRef} className="cropperFrame" aria-hidden="true" />
              <span className="cropperHint">drag to reposition</span>
            </div>

            <label className="cropperZoom">
              zoom
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                disabled={!source}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setZoom(next);
                  // Re-clamp so a wider crop cannot leave the box out of bounds.
                  if (source) {
                    const nextSide = Math.min(source.width, source.height) / next;
                    setOffset((current) => ({
                      x: clampOffset(current.x, nextSide, source.width),
                      y: clampOffset(current.y, nextSide, source.height),
                    }));
                  }
                }}
              />
            </label>
          </>
        )}

        <footer className="cropperActions">
          <button type="button" className="cropperSecondary" onClick={onCancel} disabled={busy}>
            cancel
          </button>
          <button type="button" className="cropperPrimary" onClick={apply} disabled={!source || busy || !!error}>
            {busy ? 'uploading…' : 'use this crop'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ImageCropper;
