// ═══ Minimal binary glTF (.glb) writer for a framed painting ═══
// Builds a true-to-size 3D model: a thin panel with the artwork on its front,
// optionally surrounded by a frame. Units are metres. The back of the model
// sits at z = 0 (against the wall); the picture faces +Z.
//
// Written by hand (no three.js) so the model can be generated on the server in
// a few milliseconds and handed to the phone's native AR viewer as a plain URL.

type Vec3 = [number, number, number];

interface Prim {
  positions: number[];
  normals: number[];
  uvs?: number[];
  indices: number[];
  material: number;
}

function quad(p: Prim, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3, uv?: number[]) {
  const base = p.positions.length / 3;
  p.positions.push(...a, ...b, ...c, ...d);
  p.normals.push(...n, ...n, ...n, ...n);
  if (uv && p.uvs) p.uvs.push(...uv);
  p.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

/** Axis-aligned box. `skipFront` leaves the +Z face off (it gets the artwork). */
function box(p: Prim, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, skipFront = false) {
  if (!skipFront) quad(p, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
  quad(p, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]); // back
  quad(p, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]); // left
  quad(p, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);  // right
  quad(p, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);  // top
  quad(p, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]); // bottom
}

function srgbToLinear(hex: string): [number, number, number, number] {
  const h = hex.replace("#", "");
  const ch = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return [ch(0), ch(2), ch(4), 1];
}

export interface PaintingModel {
  widthM: number;
  heightM: number;
  /** JPEG bytes of the (already cropped) artwork */
  texture: Uint8Array;
  /** colour of the panel's sides */
  edgeColor: string;
  /** frame colour, or null for no frame */
  frameColor: string | null;
  /** frame moulding width in metres */
  frameWidthM: number;
  name: string;
}

export function buildPaintingGlb(m: PaintingModel): Uint8Array {
  const hw = m.widthM / 2;
  const hh = m.heightM / 2;
  const hasFrame = !!m.frameColor;
  const panelDepth = hasFrame ? 0.022 : 0.035; // bare canvas reads as a gallery-wrapped stretcher
  const frameDepth = 0.034;
  const fw = m.frameWidthM;

  const art: Prim = { positions: [], normals: [], uvs: [], indices: [], material: 0 };
  // glTF UV origin is the top-left of the image
  quad(art, [-hw, -hh, panelDepth], [hw, -hh, panelDepth], [hw, hh, panelDepth], [-hw, hh, panelDepth], [0, 0, 1], [0, 1, 1, 1, 1, 0, 0, 0]);

  const edge: Prim = { positions: [], normals: [], indices: [], material: 1 };
  box(edge, -hw, -hh, 0, hw, hh, panelDepth, true);

  const prims: Prim[] = [art, edge];
  if (hasFrame) {
    const fr: Prim = { positions: [], normals: [], indices: [], material: 2 };
    box(fr, -hw - fw, hh, 0, hw + fw, hh + fw, frameDepth);   // top
    box(fr, -hw - fw, -hh - fw, 0, hw + fw, -hh, frameDepth); // bottom
    box(fr, -hw - fw, -hh, 0, -hw, hh, frameDepth);           // left
    box(fr, hw, -hh, 0, hw + fw, hh, frameDepth);             // right
    prims.push(fr);
  }

  // ── pack the binary buffer ──
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const bufferViews: Record<string, unknown>[] = [];
  const accessors: Record<string, unknown>[] = [];
  const pushView = (bytes: Uint8Array, target?: number): number => {
    const pad = (4 - (bytes.byteLength % 4)) % 4;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, ...(target ? { target } : {}) });
    chunks.push(bytes);
    if (pad) chunks.push(new Uint8Array(pad));
    offset += bytes.byteLength + pad;
    return bufferViews.length - 1;
  };
  const f32 = (arr: number[]) => new Uint8Array(new Float32Array(arr).buffer);
  const u16 = (arr: number[]) => new Uint8Array(new Uint16Array(arr).buffer);

  const meshPrims = prims.map((p) => {
    const xs = p.positions.filter((_, i) => i % 3 === 0);
    const ys = p.positions.filter((_, i) => i % 3 === 1);
    const zs = p.positions.filter((_, i) => i % 3 === 2);
    const count = p.positions.length / 3;
    const attributes: Record<string, number> = {};

    accessors.push({
      bufferView: pushView(f32(p.positions), 34962), componentType: 5126, count, type: "VEC3",
      min: [Math.min(...xs), Math.min(...ys), Math.min(...zs)],
      max: [Math.max(...xs), Math.max(...ys), Math.max(...zs)],
    });
    attributes.POSITION = accessors.length - 1;

    accessors.push({ bufferView: pushView(f32(p.normals), 34962), componentType: 5126, count, type: "VEC3" });
    attributes.NORMAL = accessors.length - 1;

    if (p.uvs) {
      accessors.push({ bufferView: pushView(f32(p.uvs), 34962), componentType: 5126, count, type: "VEC2" });
      attributes.TEXCOORD_0 = accessors.length - 1;
    }

    accessors.push({ bufferView: pushView(u16(p.indices), 34963), componentType: 5123, count: p.indices.length, type: "SCALAR" });
    return { attributes, indices: accessors.length - 1, material: p.material, mode: 4 };
  });

  const imageView = pushView(m.texture);

  const materials: Record<string, unknown>[] = [
    { name: "artwork", pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.9 } },
    { name: "edge", pbrMetallicRoughness: { baseColorFactor: srgbToLinear(m.edgeColor), metallicFactor: 0, roughnessFactor: 0.95 } },
  ];
  if (hasFrame) {
    materials.push({ name: "frame", pbrMetallicRoughness: { baseColorFactor: srgbToLinear(m.frameColor!), metallicFactor: 0, roughnessFactor: 0.6 } });
  }

  const gltf = {
    asset: { version: "2.0", generator: "Palm Art Studio wall preview" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: m.name }],
    meshes: [{ name: m.name, primitives: meshPrims }],
    materials,
    textures: [{ sampler: 0, source: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: imageView, mimeType: "image/jpeg" }],
    buffers: [{ byteLength: offset }],
    bufferViews,
    accessors,
  };

  // ── GLB container: header + JSON chunk (space padded) + BIN chunk ──
  let json = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonPad = (4 - (json.byteLength % 4)) % 4;
  if (jsonPad) {
    const padded = new Uint8Array(json.byteLength + jsonPad).fill(0x20);
    padded.set(json);
    json = padded;
  }
  const total = 12 + 8 + json.byteLength + 8 + offset;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true); // "glTF"
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, json.byteLength, true);
  dv.setUint32(16, 0x4e4f534a, true); // "JSON"
  out.set(json, 20);
  let p = 20 + json.byteLength;
  dv.setUint32(p, offset, true);
  dv.setUint32(p + 4, 0x004e4942, true); // "BIN\0"
  p += 8;
  for (const c of chunks) { out.set(c, p); p += c.byteLength; }
  return out;
}
