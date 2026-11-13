// ═══ "See it on your wall" — shared sizing + crop logic ═══
// Used by the server (3D model route, artwork page) and the browser (preview,
// admin crop tool), so it must stay free of server-only or DOM-only imports.

/** Edges of the wall-preview crop as fractions of the photo (0–1). */
export interface WallCrop { left: number; top: number; right: number; bottom: number }

export const FULL_CROP: WallCrop = { left: 0, top: 0, right: 1, bottom: 1 };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function normCrop(c?: Partial<WallCrop> | null): WallCrop {
  if (!c) return { ...FULL_CROP };
  const num = (v: unknown, d: number) => (typeof v === "number" && isFinite(v) ? v : d);
  let left = clamp(num(c.left, 0), 0, 0.95);
  let top = clamp(num(c.top, 0), 0, 0.95);
  let right = clamp(num(c.right, 1), 0.05, 1);
  let bottom = clamp(num(c.bottom, 1), 0.05, 1);
  if (right - left < 0.05) right = Math.min(1, left + 0.05);
  if (bottom - top < 0.05) bottom = Math.min(1, top + 0.05);
  return { left, top, right, bottom };
}

/**
 * Pull two measurements out of free text such as "32x24", "24 X 60",
 * "15 x 13 framed", "18 × 24 in", "40 by 30", "60x90 cm". Returns inches.
 */
export function parseDimensions(text?: string | null): [number, number] | null {
  if (!text) return null;
  const t = text.toLowerCase().replace(/,/g, ".");
  const nums = (t.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter((n) => n > 0);
  if (nums.length < 2) return null;
  let [a, b] = nums;
  if (/\bcm\b|centim/.test(t)) { a /= 2.54; b /= 2.54; }
  else if (/\bft\b|feet|foot/.test(t) && !/\bin\b|inch|"/.test(t)) { a *= 12; b *= 12; }
  if (a > 240 || b > 240 || a < 1 || b < 1) return null; // not a believable painting size
  return [a, b];
}

export interface WallSpec {
  widthIn: number;
  heightIn: number;
  widthM: number;
  heightM: number;
  /** crop rectangle in source-image pixels */
  rect: { x: number; y: number; w: number; h: number };
  crop: WallCrop;
  /** the photo already shows the piece in its real frame */
  framed: boolean;
  /** changes whenever the model would change — used to bust caches */
  version: string;
}

/**
 * Work out the true on-wall size of a piece.
 *
 * The listed dimensions say how big it is but not which number is the width,
 * and photos are rarely perfectly square-on. So: the LONGEST listed side is
 * matched to the longest side of the cropped photo, and the other side follows
 * the photo's own proportions. The picture is never stretched.
 */
export function wallSpec(a: {
  dimensions?: string | null;
  imgW?: number | null;
  imgH?: number | null;
  wallCrop?: Partial<WallCrop> | null;
  wallFramed?: boolean | null;
}): WallSpec | null {
  const dims = parseDimensions(a.dimensions);
  if (!dims || !a.imgW || !a.imgH) return null;
  const crop = normCrop(a.wallCrop);
  const x = Math.round(crop.left * a.imgW);
  const y = Math.round(crop.top * a.imgH);
  const w = Math.max(8, Math.round((crop.right - crop.left) * a.imgW));
  const h = Math.max(8, Math.round((crop.bottom - crop.top) * a.imgH));
  const aspect = w / h;
  const long = Math.max(dims[0], dims[1]);
  const widthIn = aspect >= 1 ? long : long * aspect;
  const heightIn = aspect >= 1 ? long / aspect : long;
  const IN = 0.0254;
  return {
    widthIn, heightIn, widthM: widthIn * IN, heightM: heightIn * IN,
    rect: { x, y, w, h }, crop, framed: !!a.wallFramed,
    version: [x, y, w, h, Math.round(long * 10), a.wallFramed ? 1 : 0].join("-"),
  };
}

/** Cropped artwork image straight from the Sanity CDN (never alters the original). */
export function wallTextureUrl(imageUrl: string, spec: WallSpec, maxSide: number): string {
  const base = imageUrl.split("?")[0];
  const { x, y, w, h } = spec.rect;
  const side = w >= h ? `w=${Math.min(maxSide, w)}` : `h=${Math.min(maxSide, h)}`;
  return `${base}?rect=${x},${y},${w},${h}&${side}&fm=jpg&q=84`;
}

export const FRAME_STYLES = {
  none: { label: "No frame", color: null as string | null },
  black: { label: "Black", color: "#1b1a18" },
  white: { label: "White", color: "#f4f1ea" },
  wood: { label: "Natural wood", color: "#b08a5b" },
} as const;
export type FrameStyle = keyof typeof FRAME_STYLES;

export function isFrameStyle(s: string): s is FrameStyle {
  return Object.prototype.hasOwnProperty.call(FRAME_STYLES, s);
}

/** Frame moulding width in inches, scaled sensibly to the piece. */
export function frameWidthIn(spec: WallSpec): number {
  return clamp(Math.max(spec.widthIn, spec.heightIn) * 0.035, 0.75, 1.75);
}

export function formatInches(n: number): string {
  const r = Math.round(n * 2) / 2;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
