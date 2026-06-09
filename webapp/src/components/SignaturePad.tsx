import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, PenLine } from "lucide-react";

type Props = {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  height?: number;
};

export function SignaturePad({ value, onChange, height = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(Boolean(value));

  // Resize canvas to its container while preserving the drawing.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const cssWidth = wrapper.clientWidth;
      const cssHeight = height;
      // Preserve existing drawing
      const prev = canvas.toDataURL();
      canvas.width = cssWidth * ratio;
      canvas.height = cssHeight * ratio;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.2;
      if (hasInk) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
        img.src = prev;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Paint an existing value if provided.
  useEffect(() => {
    if (!value) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
      setHasInk(true);
    };
    img.src = value;
  }, [value]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(e);
    if (!ctx || !last.current) return;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };

  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div
        ref={wrapperRef}
        className="relative rounded-lg border border-border bg-white overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="block touch-none cursor-crosshair"
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 gap-2">
            <PenLine className="w-4 h-4" />
            Signez ici au doigt ou à la souris
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasInk}>
          <Eraser className="w-4 h-4 mr-1" /> Effacer
        </Button>
      </div>
    </div>
  );
}
