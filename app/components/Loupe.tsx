"use client";

import { useRef, useState } from "react";

type Pos = { x: number; y: number; w: number; h: number };

/** A photographer's loupe: hover an image to inspect it under a magnifier. Mouse/pen only. */
export default function Loupe({
  src,
  children,
  zoom = 2.6,
  size = 170,
  className = "",
  style,
}: {
  src: string;
  children: React.ReactNode;
  zoom?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);

  function move(e: React.PointerEvent) {
    if (e.pointerType === "touch" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
  }

  return (
    <div
      ref={ref}
      className={`loupe-host ${pos ? "inspecting" : ""} ${className}`}
      style={style}
      onPointerMove={move}
      onPointerLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <div
          className="loupe"
          aria-hidden
          style={{
            width: size,
            height: size,
            left: pos.x - size / 2,
            top: pos.y - size / 2,
            backgroundImage: `url(${src})`,
            backgroundSize: `${pos.w * zoom}px ${pos.h * zoom}px`,
            backgroundPosition: `${-(pos.x * zoom - size / 2)}px ${-(pos.y * zoom - size / 2)}px`,
          }}
        />
      )}
    </div>
  );
}
