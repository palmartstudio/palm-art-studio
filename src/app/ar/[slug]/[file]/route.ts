import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { client } from "../../../../../sanity/lib/client";
import { buildPaintingGlb } from "../../../../lib/glb";
import { FRAME_STYLES, frameWidthIn, isFrameStyle, wallSpec, wallTextureUrl } from "../../../../lib/wall";

// GET /ar/<artwork-slug>/art-<version>.jpg
//   The cropped picture, served from our own address so the room-photo canvas
//   can use it on any domain (the image CDN only allows the main domain).
// GET /ar/<artwork-slug>/<frame>-<version>.glb
//   A true-to-size 3D model of the painting, for the phone's AR viewer.
//   <frame> is none | black | white | wood.
// <version> is ignored by the server; it only makes the URL change when the
// crop or size changes, so caches refresh.

export const dynamic = "force-dynamic";

const CACHE = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

const query = groq`*[_type == "artwork" && (slug.current == $slug || _id == $slug)][0]{
  _id, title, dimensions, wallCrop, wallFramed,
  "imageUrl": image.asset->url,
  "imgW": image.asset->metadata.dimensions.width,
  "imgH": image.asset->metadata.dimensions.height
}`;

export async function GET(_req: NextRequest, { params }: { params: { slug: string; file: string } }) {
  try {
    const file = decodeURIComponent(params.file).toLowerCase();
    const isImage = file.endsWith(".jpg") || file.endsWith(".jpeg");
    const isModel = file.endsWith(".glb");
    if (!isImage && !isModel) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const art = await client.fetch(query, { slug: decodeURIComponent(params.slug) });
    const spec = art?.imageUrl ? wallSpec(art) : null;
    if (!art || !spec) return NextResponse.json({ error: "No wall preview for this artwork" }, { status: 404 });

    if (isImage) {
      const img = await fetch(wallTextureUrl(art.imageUrl, spec, 1400));
      if (!img.ok) throw new Error(`image fetch failed: ${img.status}`);
      return new NextResponse(Buffer.from(await img.arrayBuffer()), {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": CACHE },
      });
    }

    // A photo that already shows the real frame never gets a second, virtual one.
    const frameName = file.split("-")[0].replace(".glb", "");
    const frame = !spec.framed && isFrameStyle(frameName) ? frameName : "none";
    const frameColor = FRAME_STYLES[frame].color;

    const texRes = await fetch(wallTextureUrl(art.imageUrl, spec, 1600));
    if (!texRes.ok) throw new Error(`texture fetch failed: ${texRes.status}`);
    const texture = new Uint8Array(await texRes.arrayBuffer());

    const glb = buildPaintingGlb({
      widthM: spec.widthM,
      heightM: spec.heightM,
      texture,
      edgeColor: spec.framed ? "#1f1c19" : frameColor ? "#2a2622" : "#e7dfd0",
      frameColor,
      frameWidthM: frameWidthIn(spec) * 0.0254,
      name: String(art.title || "Painting").slice(0, 80),
    });

    return new NextResponse(Buffer.from(glb), {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Length": String(glb.byteLength),
        "Content-Disposition": `inline; filename="${params.slug}.glb"`,
        "Cache-Control": CACHE,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    console.error("AR route error:", e);
    return NextResponse.json({ error: "Could not build the wall preview" }, { status: 500 });
  }
}
