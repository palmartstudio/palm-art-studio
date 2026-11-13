"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FRAME_STYLES, FrameStyle, formatInches } from "../lib/wall";

// ═══ "See it on your wall" ═══
// Two ways to preview a painting at true size:
//   1. Live camera — the phone's own AR viewer (Scene Viewer on Android,
//      AR Quick Look on iPhone/iPad) hangs a 3D model of the piece on the wall.
//   2. Photo — works everywhere: a sample room, or the visitor's own photo,
//      with the piece draggable and scaled against a known width.

const MODEL_VIEWER_SRC = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";

export interface WallPreviewProps {
  title: string;
  slug: string;
  /** cropped artwork image, same-origin (see /ar/[slug]/[file]) */
  textureUrl: string;
  widthIn: number;
  heightIn: number;
  /** photo already shows the piece's real frame — no virtual frame offered */
  framed: boolean;
  frameWidthIn: number;
  version: string;
}

const WALLS = ["#EFE9DD", "#D9DED6", "#C9CED6", "#E4D3C4", "#5D6B66", "#2F3A44"];

let modelViewerLoading: Promise<void> | null = null;
function loadModelViewer(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.customElements?.get("model-viewer")) return Promise.resolve();
  if (!modelViewerLoading) {
    modelViewerLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.type = "module";
      s.src = MODEL_VIEWER_SRC;
      s.onload = () => resolve();
      s.onerror = () => { modelViewerLoading = null; reject(new Error("viewer failed to load")); };
      document.head.appendChild(s);
    });
  }
  return modelViewerLoading;
}

export default function WallPreview(props: WallPreviewProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" className="wp-open" onClick={() => setOpen(true)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="3" y="4" width="18" height="13" rx="1" /><rect x="8" y="7.5" width="8" height="6" /><path d="M3 20.5h18" />
        </svg>
        See It on Your Wall
      </button>
      {/* Portal to <body>: the artwork page's sticky column makes its own stacking
          context, which would trap the overlay underneath the site navigation. */}
      {open && createPortal(<WallPreviewModal {...props} onClose={close} />, document.body)}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </>
  );
}

function WallPreviewModal(p: WallPreviewProps & { onClose: () => void }) {
  const [mode, setMode] = useState<"live" | "photo">("photo");
  const [frame, setFrame] = useState<FrameStyle>(p.framed ? "none" : "black");
  const [arSupport, setArSupport] = useState<"checking" | "yes" | "no">("checking");
  const [viewerReady, setViewerReady] = useState(false);
  const mvRef = useRef<any>(null);
  const { onClose } = p;

  const glbUrl = `/ar/${encodeURIComponent(p.slug)}/${frame}-${p.version}.glb`;
  const sizeLabel = `${formatInches(p.widthIn)} × ${formatInches(p.heightIn)} in`;

  // lock page scroll + Escape to close
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  // Load the 3D viewer, then ask it whether this device can do live AR.
  useEffect(() => {
    let cancelled = false;
    loadModelViewer()
      .then(() => window.customElements.whenDefined("model-viewer"))
      .then(() => { if (!cancelled) setViewerReady(true); })
      .catch(() => { if (!cancelled) setArSupport("no"); });
    return () => { cancelled = true; };
  }, []);

  // The viewer works out AR support a moment after it mounts. Phones that can
  // do it switch to the live camera tab automatically; everything else stays
  // on the room photo, which works everywhere.
  const userChoseMode = useRef(false);
  const [arFailed, setArFailed] = useState(false);
  // Phones open on the camera tab; it runs inside the page, so it works in any browser.
  useEffect(() => {
    const phone = window.matchMedia?.("(pointer: coarse)").matches && !!navigator.mediaDevices?.getUserMedia;
    if (phone && !userChoseMode.current) setMode("live");
  }, []);
  // If the phone's own AR app can't open, the viewer sends the page back with this marker.
  useEffect(() => {
    const onHash = () => { if (window.location.hash.includes("model-viewer-no-ar-fallback")) setArFailed(true); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (!viewerReady) return;
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (mvRef.current?.canActivateAR === true) {
        setArSupport("yes");
        clearInterval(t);
      } else if (tries > 16) {
        setArSupport("no");
        clearInterval(t);
      }
    }, 250);
    return () => clearInterval(t);
  }, [viewerReady]);

  const choose = (m: "live" | "photo") => { userChoseMode.current = true; setMode(m); };

  const startAR = () => { try { mvRef.current?.activateAR(); } catch {} };

  return (
    <div className="wp-overlay" role="dialog" aria-modal="true" aria-label={`See ${p.title} on your wall`}>
      <div className="wp-panel">
        <header className="wp-head">
          <div>
            <div className="wp-eyebrow">See it on your wall</div>
            <div className="wp-title">{p.title} <span>· {sizeLabel}</span></div>
          </div>
          <button type="button" className="wp-close" onClick={p.onClose} aria-label="Close">✕</button>
        </header>

        <div className="wp-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === "live"} className={mode === "live" ? "on" : ""} onClick={() => choose("live")}>Live camera</button>
          <button type="button" role="tab" aria-selected={mode === "photo"} className={mode === "photo" ? "on" : ""} onClick={() => choose("photo")}>Room photo</button>
        </div>

        {!p.framed && (
          <div className="wp-frames" aria-label="Frame">
            <span>Frame</span>
            {(Object.keys(FRAME_STYLES) as FrameStyle[]).map((k) => (
              <button key={k} type="button" className={frame === k ? "on" : ""} onClick={() => setFrame(k)} aria-pressed={frame === k}>
                <i style={{ background: FRAME_STYLES[k].color || "transparent", borderStyle: FRAME_STYLES[k].color ? "solid" : "dashed" }} />
                {FRAME_STYLES[k].label}
              </button>
            ))}
          </div>
        )}

        {mode === "live" && <PhotoRoom key="camera" camera {...p} frame={frame} />}
        {mode === "photo" && <PhotoRoom key="photo" {...p} frame={frame} />}

        {/* The 3D viewer stays mounted but out of sight: it detects whether the phone has
            its own AR app and hands the model to it. The camera view above never depends on it. */}
        <div className="wp-mv" aria-hidden="true">
          {viewerReady && createElement("model-viewer", {
            ref: mvRef,
            src: glbUrl,
            ar: "",
            "ar-modes": "scene-viewer quick-look",
            "ar-placement": "wall",
            "ar-scale": "fixed",
            "interaction-prompt": "none",
            style: { width: "100%", height: "100%" },
          })}
        </div>
        {mode === "live" && arSupport === "yes" && !arFailed && (
          <div className="wp-extra">
            <button type="button" className="wp-file" onClick={startAR}>Try 3D View (exact size)</button>
            <p className="wp-hint">Optional, for newer phones: opens your phone&apos;s own 3D viewer and pins the painting to the wall at its exact size. If nothing opens, just use the camera view above.</p>
          </div>
        )}
        {mode === "live" && arFailed && (
          <p className="wp-hint wp-extra">The 3D viewer isn&apos;t available on this phone — the camera view above does the same job.</p>
        )}

      </div>
    </div>
  );
}

// ───────────────────────── Photo / sample-room mode ─────────────────────────

// Typical phone main camera: about 63° across the long side of the video frame.
const CAMERA_FOV_TAN = Math.tan((63 / 2) * Math.PI / 180);

function PhotoRoom(p: WallPreviewProps & { frame: FrameStyle; camera?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [vid, setVid] = useState({ w: 0, h: 0 });
  const [camErr, setCamErr] = useState("");
  const [starting, setStarting] = useState(false);
  const [distFt, setDistFt] = useState(8); // how far the visitor stands from the wall
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const artImg = useRef<HTMLImageElement | null>(null);
  const roomImg = useRef<HTMLImageElement | null>(null);
  const [artReady, setArtReady] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [wall, setWall] = useState(WALLS[0]);
  // how many feet of wall the picture shows, left to right
  const sampleSpan = Math.max(11, (p.widthIn * 2.6) / 12);
  const [spanFt, setSpanFt] = useState(sampleSpan);
  const [pos, setPos] = useState({ x: 0.5, y: 0.4 }); // artwork centre, as a fraction of the stage
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { artImg.current = img; setArtReady(true); };
    img.src = p.textureUrl;
  }, [p.textureUrl]);

  // keep the canvas matched to its box
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = p.camera
        ? Math.round(Math.max(320, window.innerHeight * 0.6))
        : Math.round(Math.min(window.innerHeight * 0.52, w * 0.72));
      setSize({ w, h: Math.max(240, h) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [p.camera]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setCamErr(""); setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) throw new Error("no video");
      v.srcObject = stream;
      await v.play();
      setVid({ w: v.videoWidth, h: v.videoHeight });
      setPos({ x: 0.5, y: 0.4 });
      setLive(true);
    } catch (e: any) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const denied = e?.name === "NotAllowedError" || e?.name === "SecurityError";
      setCamErr(denied
        ? "The camera is blocked for this site. Allow camera access in your browser, or use the Room photo tab and take a picture of your wall instead."
        : "The camera couldn't be opened on this device. Use the Room photo tab and take a picture of your wall instead.");
    } finally { setStarting(false); }
  };

  const geometry = useCallback((W: number, H: number) => {
    let ppi = W / (spanFt * 12); // pixels per inch
    if (live && vid.w && vid.h) {
      // live camera: size from how far away the wall is and the camera's field of view
      const focalPx = (Math.max(vid.w, vid.h) / 2) / CAMERA_FOV_TAN;
      ppi = (focalPx * Math.max(W / vid.w, H / vid.h)) / (distFt * 12);
    }
    const frameIn = p.framed || p.frame === "none" ? 0 : p.frameWidthIn;
    const aw = p.widthIn * ppi, ah = p.heightIn * ppi, f = frameIn * ppi;
    const cx = pos.x * W, cy = pos.y * H;
    return { ppi, aw, ah, f, cx, cy, floorY: H * 0.8 };
  }, [spanFt, pos, p.widthIn, p.heightIn, p.frameWidthIn, p.framed, p.frame, live, vid, distFt]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number, forExport = false) => {
    const g = geometry(W, H);
    ctx.clearRect(0, 0, W, H);

    if (p.camera) {
      // the live video shows through the canvas; it is only painted in for a saved picture
      const v = videoRef.current;
      if (forExport && live && v && v.videoWidth) {
        const s = Math.max(W / v.videoWidth, H / v.videoHeight);
        const dw = v.videoWidth * s, dh = v.videoHeight * s;
        ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
      }
      if (!live) return;
    } else if (hasPhoto && roomImg.current) {
      // cover-fit the visitor's photo
      const im = roomImg.current;
      const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
      const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
      ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      // sample room: wall, floor, and a sofa of known width for scale
      ctx.fillStyle = wall; ctx.fillRect(0, 0, W, g.floorY);
      const shade = ctx.createLinearGradient(0, 0, 0, g.floorY);
      shade.addColorStop(0, "rgba(255,255,255,0.10)"); shade.addColorStop(1, "rgba(0,0,0,0.10)");
      ctx.fillStyle = shade; ctx.fillRect(0, 0, W, g.floorY);
      ctx.fillStyle = "#8a6a4a"; ctx.fillRect(0, g.floorY, W, H - g.floorY);
      const fl = ctx.createLinearGradient(0, g.floorY, 0, H);
      fl.addColorStop(0, "rgba(0,0,0,0.28)"); fl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fl; ctx.fillRect(0, g.floorY, W, H - g.floorY);
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillRect(0, g.floorY - 4 * g.ppi, W, 4 * g.ppi); // baseboard

      const sw = 84 * g.ppi, sh = 33 * g.ppi, sx = W / 2 - sw / 2, sy = g.floorY - sh + 2 * g.ppi;
      const r = 5 * g.ppi;
      ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(W / 2, g.floorY + 2 * g.ppi, sw * 0.52, 4 * g.ppi, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#6f7a78"; rounded(ctx, sx, sy, sw, sh, r); ctx.fill();                                // back
      ctx.fillStyle = "#7f8b88"; rounded(ctx, sx + 6 * g.ppi, sy + 14 * g.ppi, sw - 12 * g.ppi, sh - 17 * g.ppi, r * 0.7); ctx.fill(); // seat
      ctx.fillStyle = "#64706d"; rounded(ctx, sx - 2 * g.ppi, sy + 8 * g.ppi, 10 * g.ppi, sh - 8 * g.ppi, r * 0.8); ctx.fill();     // arms
      rounded(ctx, sx + sw - 8 * g.ppi, sy + 8 * g.ppi, 10 * g.ppi, sh - 8 * g.ppi, r * 0.8); ctx.fill();
    }

    if (!artImg.current) return;
    const ow = g.aw + g.f * 2, oh = g.ah + g.f * 2;
    const x = g.cx - ow / 2, y = g.cy - oh / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.38)"; ctx.shadowBlur = Math.max(8, 5 * g.ppi); ctx.shadowOffsetY = Math.max(3, 2 * g.ppi);
    ctx.fillStyle = g.f > 0 ? (FRAME_STYLES[p.frame].color || "#111") : "#111";
    ctx.fillRect(x, y, ow, oh);
    ctx.restore();
    ctx.drawImage(artImg.current, x + g.f, y + g.f, g.aw, g.ah);
    if (g.f > 0) { // inner lip so the frame reads as having depth
      ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = Math.max(1, g.f * 0.08);
      ctx.strokeRect(x + g.f, y + g.f, g.aw, g.ah);
    }
  }, [geometry, hasPhoto, wall, p.frame, p.camera, live]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size.w * dpr); c.height = Math.round(size.h * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, size.w, size.h);
  }, [draw, size, artReady]);

  // In the sample room, start the piece centred above the sofa at a natural hanging height.
  useEffect(() => {
    if (hasPhoto || p.camera || !size.h) return;
    const ppi = size.w / (spanFt * 12);
    const floorY = size.h * 0.8;
    const centreFromFloor = Math.max(58, 33 + 8 + p.heightIn / 2); // eye level, but clear of the sofa
    const y = (floorY - centreFromFloor * ppi) / size.h;
    setPos({ x: 0.5, y: Math.max(0.5 * (p.heightIn * ppi) / size.h + 0.03, y) });
  }, [hasPhoto, p.camera, size.w, size.h, spanFt, p.heightIn]);

  const onDown = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const g = geometry(rect.width, rect.height);
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    drag.current = { id: e.pointerId, dx: px - g.cx, dy: py - g.cy };
    // a tap away from the piece moves it there
    if (Math.abs(px - g.cx) > g.aw / 2 + g.f + 16 || Math.abs(py - g.cy) > g.ah / 2 + g.f + 16) {
      drag.current = { id: e.pointerId, dx: 0, dy: 0 };
      setPos({ x: px / rect.width, y: py / rect.height });
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({
      x: Math.min(1, Math.max(0, (e.clientX - rect.left - drag.current.dx) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top - drag.current.dy) / rect.height)),
    });
  };
  const onUp = () => { drag.current = null; };

  const pickPhoto = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { roomImg.current = img; setHasPhoto(true); setSpanFt(8); setPos({ x: 0.5, y: 0.42 }); };
    img.src = url;
  };
  const useSample = () => { roomImg.current = null; setHasPhoto(false); setSpanFt(sampleSpan); };

  const save = async () => {
    let c = canvasRef.current;
    if (!c) return;
    if (p.camera) {
      // compose the current camera frame and the painting into one picture
      const out = document.createElement("canvas");
      out.width = c.width; out.height = c.height;
      const octx = out.getContext("2d");
      if (!octx) return;
      const dpr = c.width / size.w;
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(octx, size.w, size.h, true);
      c = out;
    }
    c.toBlob(async (blob) => {
      if (!blob) return;
      const name = `${p.slug}-on-my-wall.jpg`;
      const file = new File([blob], name, { type: "image/jpeg" });
      const nav = navigator as any;
      try {
        if (nav.canShare?.({ files: [file] })) { await nav.share({ files: [file], title: `${p.title} — Palm Art Studio` }); return; }
      } catch { /* cancelled or unsupported — fall through to download */ }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="wp-photo">
      <div ref={wrapRef} className="wp-stage">
        {p.camera && <video ref={videoRef} className="wp-video" playsInline muted autoPlay style={{ opacity: live ? 1 : 0 }} />}
        <canvas
          ref={canvasRef}
          style={{ width: size.w || "100%", height: size.h || 300, touchAction: "none", cursor: "grab", display: "block", position: "relative" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          aria-label={`${p.title} shown on a wall. Drag to move it.`}
        />
        {!artReady && <div className="wp-loading wp-loading-abs">Loading the painting…</div>}
        {p.camera && !live && (
          <div className="wp-camstart">
            <button type="button" className="wp-cta" onClick={startCamera} disabled={starting}>{starting ? "Opening the camera…" : "Turn On Camera"}</button>
            <p className="wp-hint">{camErr || "Your browser will ask to use the camera. Point it at your wall and the painting appears on top. Nothing is recorded or uploaded."}</p>
          </div>
        )}
      </div>

      {p.camera ? (
        <>
          {live && (
            <>
              <div className="wp-controls">
                <button type="button" className="wp-file wp-file-primary" onClick={save}>Save / Share Picture</button>
                <button type="button" className="wp-file" onClick={stopCamera}>Turn Camera Off</button>
              </div>
              <div className="wp-scale">
                <label htmlFor="wp-dist">
                  <strong>Make it true to size:</strong> about how far are you standing from the wall?
                  <b> {formatInches(distFt)} ft</b>
                </label>
                <input id="wp-dist" type="range" min={3} max={20} step={0.5} value={distFt} onChange={(e) => setDistFt(Number(e.target.value))} />
                <p className="wp-hint">Drag the painting to move it. The size is a close estimate — one big step is about 3 ft.</p>
              </div>
            </>
          )}
        </>
      ) : (<>

      <div className="wp-controls">
        <label className="wp-file wp-file-primary">
          <input type="file" accept="image/*" capture="environment" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          Take a Photo of My Wall
        </label>
        <label className="wp-file">
          <input type="file" accept="image/*" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          Choose a Photo
        </label>
        {hasPhoto && <button type="button" className="wp-file" onClick={useSample}>Sample Room</button>}
        <button type="button" className="wp-file" onClick={save}>Save / Share Picture</button>
      </div>

      {hasPhoto ? (
        <div className="wp-scale">
          <label htmlFor="wp-span">
            <strong>Make it true to size:</strong> about how wide is the stretch of wall in your photo?
            <b> {formatInches(spanFt)} ft</b>
          </label>
          <input id="wp-span" type="range" min={3} max={24} step={0.5} value={spanFt} onChange={(e) => setSpanFt(Number(e.target.value))} />
          <p className="wp-hint">Tip: a standard interior door is about 3 ft wide, and a sofa about 7 ft. Drag the painting to move it.</p>
        </div>
      ) : (
        <div className="wp-scale">
          <div className="wp-swatches" aria-label="Wall colour">
            <span>Wall colour</span>
            {WALLS.map((c) => (
              <button key={c} type="button" aria-label={`Wall colour ${c}`} aria-pressed={wall === c} className={wall === c ? "on" : ""} style={{ background: c }} onClick={() => setWall(c)} />
            ))}
          </div>
          <p className="wp-hint">Shown at true size next to a 7-foot sofa. Drag the painting to move it, or use a photo of your own wall.</p>
        </div>
      )}
      </>)}
    </div>
  );
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const CSS = `
.wp-open{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:54px;padding:14px 22px;background:transparent;border:1px solid #C4A86E;color:#E9D7A8;font-family:'Outfit',sans-serif;font-size:0.95rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:background .25s,color .25s;}
.wp-open:hover{background:rgba(196,168,110,0.14);color:#fff;}
.wp-overlay{position:fixed;inset:0;z-index:3000;background:rgba(18,16,13,0.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;justify-content:center;overflow-y:auto;overscroll-behavior:contain;}
.wp-panel{width:100%;max-width:980px;padding:18px clamp(14px,3vw,28px) 40px;color:#F5F0E8;font-family:'Outfit',sans-serif;}
.wp-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px;}
.wp-eyebrow{font-size:0.82rem;letter-spacing:0.16em;text-transform:uppercase;color:#C4A86E;margin-bottom:4px;}
.wp-title{font-family:'DM Serif Display',serif;font-size:clamp(1.3rem,3.4vw,1.8rem);line-height:1.2;}
.wp-title span{font-family:'Outfit',sans-serif;font-size:1rem;color:#D4C9B8;white-space:nowrap;}
.wp-close{flex-shrink:0;width:48px;height:48px;border:1px solid rgba(245,240,232,0.3);background:none;color:#F5F0E8;font-size:1.15rem;cursor:pointer;border-radius:50%;}
.wp-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
.wp-tabs button{min-height:50px;border:1px solid rgba(245,240,232,0.25);background:none;color:#D4C9B8;font:inherit;font-size:1rem;letter-spacing:0.06em;cursor:pointer;}
.wp-tabs button.on{background:#F5F0E8;color:#2A2520;border-color:#F5F0E8;font-weight:600;}
.wp-frames{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:14px;}
.wp-frames span,.wp-swatches span{font-size:0.9rem;color:#B8AFA3;margin-right:4px;}
.wp-frames button{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border:1px solid rgba(245,240,232,0.22);background:none;color:#E4DCCD;font:inherit;font-size:0.95rem;cursor:pointer;}
.wp-frames button.on{border-color:#C47D5A;background:rgba(196,125,90,0.18);color:#fff;}
.wp-frames i{width:18px;height:18px;border:1px solid rgba(245,240,232,0.5);display:inline-block;}
.wp-live{flex-direction:column;gap:14px;}
.wp-stage3d{height:min(48vh,460px);min-height:260px;background:radial-gradient(ellipse at 50% 40%,#3a342d,#1c1915);}
.wp-cta{min-height:58px;padding:14px 22px;border:none;background:#C47D5A;color:#FFFDF9;font:inherit;font-size:1.05rem;font-weight:600;letter-spacing:0.06em;cursor:pointer;}
.wp-steps{margin:0;padding-left:1.3em;font-size:1.05rem;line-height:1.7;color:#E4DCCD;}
.wp-hint{font-size:0.98rem;line-height:1.6;color:#C9BFB0;margin:0;}
.wp-hint button{background:none;border:none;padding:0;color:#E9D7A8;font:inherit;text-decoration:underline;cursor:pointer;}
.wp-loading{display:flex;align-items:center;justify-content:center;height:100%;color:#B8AFA3;font-size:1rem;}
.wp-loading-abs{position:absolute;inset:0;pointer-events:none;}
.wp-stage{position:relative;background:#1c1915;overflow:hidden;}
.wp-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.wp-camstart{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;background:radial-gradient(ellipse at 50% 40%,#3a342d,#1c1915);}
.wp-camstart .wp-hint{max-width:440px;}
.wp-cta:disabled{opacity:0.7;}
.wp-mv{position:absolute;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none;}
.wp-extra{display:flex;flex-direction:column;gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(245,240,232,0.15);}
.wp-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin:12px 0;}
.wp-file{display:flex;align-items:center;justify-content:center;min-height:52px;padding:10px 14px;border:1px solid rgba(245,240,232,0.3);background:none;color:#F5F0E8;font:inherit;font-size:1rem;text-align:center;cursor:pointer;}
.wp-file-primary{background:#C47D5A;border-color:#C47D5A;font-weight:600;}
.wp-file input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
.wp-scale{display:flex;flex-direction:column;gap:10px;}
.wp-scale label{font-size:1.02rem;line-height:1.5;color:#E4DCCD;}
.wp-scale label b{color:#E9D7A8;white-space:nowrap;}
.wp-scale input[type=range]{width:100%;height:36px;accent-color:#C47D5A;}
.wp-swatches{display:flex;flex-wrap:wrap;align-items:center;gap:10px;}
.wp-swatches button{width:44px;height:44px;border-radius:50%;border:2px solid rgba(245,240,232,0.25);cursor:pointer;}
.wp-swatches button.on{border-color:#C47D5A;box-shadow:0 0 0 3px rgba(196,125,90,0.35);}
`;
