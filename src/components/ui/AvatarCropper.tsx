"use client";

import { useRef, useState, useCallback, useEffect } from "react";

type AvatarCropperProps = {
  imageSrc: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
};

const CANVAS_SIZE = 240;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;

export default function AvatarCropper({ imageSrc, onCrop, onCancel }: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;

      // Fit image to cover the circle
      const fitScale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
      setScale(fitScale);
      setOffset({
        x: (CANVAS_SIZE - img.width * fitScale) / 2,
        y: (CANVAS_SIZE - img.height * fitScale) / 2,
      });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
    ctx.restore();

    // Draw circle border
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(45, 212, 191, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [scale, offset]);

  useEffect(() => {
    if (imgLoaded) draw();
  }, [imgLoaded, draw]);

  // Mouse/touch drag handlers
  function handlePointerDown(e: React.PointerEvent) {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setOffset({
      x: offsetStart.current.x + (e.clientX - dragStart.current.x),
      y: offsetStart.current.y + (e.clientY - dragStart.current.y),
    });
  }

  function handlePointerUp() {
    setDragging(false);
  }

  // Zoom via wheel
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;

    const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));

    // Zoom toward center
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const ratio = newScale / scale;
    setOffset({
      x: cx - (cx - offset.x) * ratio,
      y: cy - (cy - offset.y) * ratio,
    });
    setScale(newScale);
  }

  // Zoom via slider
  function handleSliderChange(newScale: number) {
    const img = imgRef.current;
    if (!img) return;

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const ratio = newScale / scale;
    setOffset({
      x: cx - (cx - offset.x) * ratio,
      y: cy - (cy - offset.y) * ratio,
    });
    setScale(newScale);
  }

  function handleCrop() {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    if (!ctx || !img) return;

    // Draw circular crop
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);

    canvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      "image/png",
      1
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Canvas preview */}
      <div
        className="rounded-full overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block" />
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 w-full max-w-[240px]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-dim shrink-0">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.01}
          value={scale}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-teal) ${((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%, var(--theme-border) ${((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%)`,
          }}
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-dim shrink-0">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
          <line x1="11" y1="8" x2="11" y2="14" />
        </svg>
      </div>

      <p className="text-[11px] text-text-dim">Drag to reposition. Scroll or use slider to zoom.</p>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border px-4 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)] transition-colors cursor-pointer"
          style={{ borderColor: "var(--theme-border)" }}
        >
          Cancel
        </button>
        <button type="button" onClick={handleCrop} className="flex-1 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-btn-text transition-all hover:bg-teal-dark cursor-pointer">
          Confirm
        </button>
      </div>
    </div>
  );
}
