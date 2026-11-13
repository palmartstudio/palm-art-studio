"use client";

import { useEffect, useRef, useState } from "react";
import { FULL_CROP, WallCrop, formatInches, normCrop, wallSpec } from "../../lib/wall";
import { sanityImg } from "../../lib/img";

// ═══ Wall-preview crop tool (admin) ═══
// Drag the box so it covers just the piece itself. This crop is stored on its
// own and is only used by "See it on your wall" — the gallery photo, the
// artwork page and everything else keep using the full, original picture.

const T = {
  border: "rgba(245,240,232,0.12)", text: "#F5F0E8", muted: "#8B7F72", terra: "#C47D5A", gold: "#C4A86E", bg3: "#1c1915",
};

type Handle = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

export default function WallCropEditor({ imageUrl, dimensions, crop, framed, onChange }: {
  imageUrl?: string;
  dimensions?: string;
  crop?: Partial<WallCrop> | null;
  framed?: boolean;
  onChange: (next: { wallCrop: WallCrop; wallFramed: boolean }) => void;
}) {
  const c = normCrop(crop);
  // work from a light, resized copy — the original can be several MB (crop is stored as fractions, so size does not matter)
  const displayUrl = imageUrl ? sanityImg(imageUrl, 1400) : undefined;
  const boxRef = useRef<HTMLDivElement>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const drag = useRef<{ handle: Handle; id: number; sx: number; sy: number; start: WallCrop } | null>(null);
  const latest = useRef({ c, framed: !!framed, onChange });
  latest.current = { c, framed: !!framed, onChange };

  useEffect(() => { setNat(null); }, [imageUrl]);

  if (!imageUrl) {
    return <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Add a picture above first, then you can set how it shows on a wall.</p>;
  }

  const emit = (next: WallCrop, f = latest.current.framed) => latest.current.onChange({ wallCrop: normCrop(next), wallFramed: f });

  const down = (handle: Handle) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    drag.current = { handle, id: e.pointerId, sx: e.clientX, sy: e.clientY, start: { ...latest.current.c } };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current, el = boxRef.current;
    if (!d || d.id !== e.pointerId || !el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - d.sx) / r.width, dy = (e.clientY - d.sy) / r.height;
    const s = d.start, MIN = 0.06;
    let { left, top, right, bottom } = s;
    if (d.handle === "move") {
      const w = s.right - s.left, h = s.bottom - s.top;
      left = Math.min(1 - w, Math.max(0, s.left + dx)); right = left + w;
      top = Math.min(1 - h, Math.max(0, s.top + dy)); bottom = top + h;
    } else {
      if (d.handle.includes("w")) left = Math.min(s.right - MIN, Math.max(0, s.left + dx));
      if (d.handle.includes("e")) right = Math.max(s.left + MIN, Math.min(1, s.right + dx));
      if (d.handle.includes("n")) top = Math.min(s.bottom - MIN, Math.max(0, s.top + dy));
      if (d.handle.includes("s")) bottom = Math.max(s.top + MIN, Math.min(1, s.bottom + dy));
    }
    emit({ left, top, right, bottom });
  };
  const up = () => { drag.current = null; };

  const spec = nat ? wallSpec({ dimensions, imgW: nat.w, imgH: nat.h, wallCrop: c, wallFramed: framed }) : null;
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const HANDLE = 30; // big enough for a fingertip
  const handleStyle = (h: Handle): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute", width: HANDLE, height: HANDLE, background: "#fff", border: `3px solid ${T.terra}`,
      borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,0.5)", touchAction: "none", zIndex: 3,
    };
    const off = -HANDLE / 2;
    if (h === "nw") return { ...base, left: off, top: off, cursor: "nwse-resize" };
    if (h === "ne") return { ...base, right: off, top: off, cursor: "nesw-resize" };
    if (h === "sw") return { ...base, left: off, bottom: off, cursor: "nesw-resize" };
    if (h === "se") return { ...base, right: off, bottom: off, cursor: "nwse-resize" };
    const small: React.CSSProperties = { ...base, width: 22, height: 22, borderWidth: 2 };
    if (h === "n") return { ...small, left: "calc(50% - 11px)", top: -11, cursor: "ns-resize" };
    if (h === "s") return { ...small, left: "calc(50% - 11px)", bottom: -11, cursor: "ns-resize" };
    if (h === "w") return { ...small, top: "calc(50% - 11px)", left: -11, cursor: "ew-resize" };
    return { ...small, top: "calc(50% - 11px)", right: -11, cursor: "ew-resize" };
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
        Drag the corners so the box covers <strong style={{ color: T.text }}>only the piece</strong> — no wall, floor or table.
        This is only used for &ldquo;See it on your wall&rdquo;. Your gallery picture stays exactly as it is.
      </p>

      {/* padding leaves room for the handles when the crop touches an edge */}
      <div style={{ padding: 16, background: "#000", borderRadius: 10, margin: "0 auto", maxWidth: nat ? `calc(68vh * ${(nat.w / nat.h).toFixed(4)} + 32px)` : undefined }}>
        <div ref={boxRef} style={{ position: "relative", lineHeight: 0, userSelect: "none", touchAction: "none" }} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <img
            src={displayUrl} alt="" draggable={false}
            onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            style={{ display: "block", width: "100%", height: "auto", opacity: 0.38 }}
          />
          {/* the kept area, shown at full brightness */}
          <div style={{ position: "absolute", left: pct(c.left), top: pct(c.top), width: pct(c.right - c.left), height: pct(c.bottom - c.top), outline: `2px solid ${T.terra}`, boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)", zIndex: 2 }}>
            <div
              onPointerDown={down("move")}
              style={{
                position: "absolute", inset: 0, cursor: "move", touchAction: "none",
                backgroundImage: `url(${JSON.stringify(displayUrl).slice(1, -1)})`,
                backgroundSize: `${100 / (c.right - c.left)}% ${100 / (c.bottom - c.top)}%`,
                backgroundPosition: `${(c.left / Math.max(0.0001, 1 - (c.right - c.left))) * 100}% ${(c.top / Math.max(0.0001, 1 - (c.bottom - c.top))) * 100}%`,
              }}
            />
            {(["nw", "ne", "sw", "se", "n", "s", "e", "w"] as Handle[]).map((h) => (
              <div key={h} onPointerDown={down(h)} style={handleStyle(h)} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 12 }}>
        <button type="button" onClick={() => emit({ ...FULL_CROP })}
          style={{ padding: "10px 16px", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
          Use the whole photo
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: T.text, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={!!framed} onChange={(e) => emit(c, e.target.checked)} style={{ width: 18, height: 18 }} />
          The box includes this piece&apos;s real frame
        </label>
      </div>

      <div style={{ marginTop: 12, padding: "10px 14px", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, lineHeight: 1.5, color: T.text }}>
        {spec ? (
          <>On a wall this will appear <strong style={{ color: T.gold }}>{formatInches(spec.widthIn)} × {formatInches(spec.heightIn)} inches</strong>
            {framed ? " (frame included, no extra frame offered)." : ". Visitors can try it with a black, white or wood frame."}
            <span style={{ display: "block", color: T.muted, marginTop: 4 }}>The longest side comes from the Dimensions field; the other side follows the shape of the box.</span></>
        ) : (
          <span style={{ color: T.gold }}>Enter the size in the Dimensions field (for example 24 x 30) to turn on &ldquo;See it on your wall&rdquo; for this piece.</span>
        )}
      </div>
    </div>
  );
}
