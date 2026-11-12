import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { groq } from "next-sanity";
import { client } from "../../../../sanity/lib/client";
import NavClient from "../../../components/NavClient";
import SiteFooter from "../../../components/SiteFooter";
import TimelineViewer from "../../../components/TimelineViewer";
import { JsonLdScript, breadcrumbList, visualArtworkLd } from "../../../components/StructuredData";
import { sanityImg, sanitySrcSet, mediumLabel } from "../../../lib/img";

// One real, shareable, indexable page per artwork. This is also where the
// Buy button will live when the store ships.
export const revalidate = 60;

const SITE_URL = "https://palmartstudio.com";

const artworkQuery = groq`*[_type == "artwork" && (slug.current == $slug || _id == $slug)][0]{
  _id, title, slug, medium, dimensions, year, description, status, price, printPrice, category,
  "imageUrl": image.asset->url,
  "imageLqip": image.asset->metadata.lqip,
  "imageDims": image.asset->metadata.dimensions{width, height},
  "additionalImages": additionalImages[]{ "url": asset->url, "lqip": asset->metadata.lqip },
  processTimeline[]{
    _key, stage, caption, capturedAt, mediaType,
    "imageUrl": image.asset->url,
    "imageLqip": image.asset->metadata.lqip,
    "videoUrl": video.asset->url,
    "videoMimeType": video.asset->mimeType,
    "videoPosterUrl": videoPoster.asset->url,
    "videoPosterLqip": videoPoster.asset->metadata.lqip
  }
}`;

const othersQuery = groq`*[_type == "artwork" && _id != $id && defined(image.asset)] | order(order asc)[0...24]{
  _id, title, slug, medium, dimensions, status, price,
  "imageUrl": image.asset->url,
  "imageLqip": image.asset->metadata.lqip
}`;

async function getArtwork(slug: string) {
  try {
    return await client.fetch(artworkQuery, { slug });
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const rows: { slug?: string; _id: string }[] = await client.fetch(
      groq`*[_type == "artwork"]{ _id, "slug": slug.current }`,
    );
    return rows.map((r) => ({ slug: r.slug || r._id }));
  } catch {
    return [];
  }
}

function priceLine(a: any): string {
  if (a.status === "sold") return "Sold";
  if (a.status === "nfs") return "Not for sale";
  if (a.status === "print-only") return a.printPrice ? `Prints from $${Number(a.printPrice).toLocaleString("en-US")}` : "Available as a print";
  if (a.price) return `$${Number(a.price).toLocaleString("en-US")}`;
  return "Price on request";
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await getArtwork(decodeURIComponent(params.slug));
  if (!a) return { title: "Artwork not found", robots: { index: false } };
  const slug = a.slug?.current || a._id;
  const medium = mediumLabel(a.medium);
  const title = `${a.title} — ${medium} by Carolyn Jenkins`;
  const facts = [medium, a.dimensions, a.year].filter(Boolean).join(", ");
  const description = (a.description ? `${a.description} ` : "") + `${facts}. ${priceLine(a)}. Palm Art Studio, Deltona, Florida.`;
  const url = `${SITE_URL}/gallery/${slug}`;
  const image = a.imageUrl ? sanityImg(a.imageUrl, 1200) : undefined;
  return {
    title,
    description: description.slice(0, 300),
    alternates: { canonical: url },
    openGraph: { title, description: description.slice(0, 300), url, type: "article", ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: "summary_large_image", title, description: description.slice(0, 200), ...(image ? { images: [image] } : {}) },
  };
}

export default async function ArtworkPage({ params }: { params: { slug: string } }) {
  const a = await getArtwork(decodeURIComponent(params.slug));
  if (!a) notFound();

  const slug: string = a.slug?.current || a._id;
  const medium = mediumLabel(a.medium);
  const isSold = a.status === "sold";
  const canInquire = a.status !== "nfs";
  const inquireHref = `/?about=${encodeURIComponent(a.title)}#contact`;
  const timeline = Array.isArray(a.processTimeline) ? a.processTimeline.filter((t: any) => t?.imageUrl || t?.videoUrl) : [];
  const extras: { url: string; lqip?: string }[] = Array.isArray(a.additionalImages) ? a.additionalImages.filter((x: any) => x?.url) : [];
  const ratio = a.imageDims?.width && a.imageDims?.height ? `${a.imageDims.width} / ${a.imageDims.height}` : "4 / 3";

  let others: any[] = [];
  try {
    const all: any[] = await client.fetch(othersQuery, { id: a._id });
    const same = all.filter((o) => o.medium === a.medium);
    const rest = all.filter((o) => o.medium !== a.medium);
    others = [...same, ...rest].slice(0, 3);
  } catch {}

  const facts: [string, string][] = [
    ["Medium", medium],
    ...(a.dimensions ? [["Size", a.dimensions] as [string, string]] : []),
    ...(a.year ? [["Year", String(a.year)] as [string, string]] : []),
    ["Availability", isSold ? "Sold" : a.status === "nfs" ? "Not for sale" : a.status === "print-only" ? "Prints only" : "Available"],
  ];

  return (
    <div className="ap-root">
      <JsonLdScript id="ld-artwork" data={visualArtworkLd(a)} />
      <JsonLdScript
        id="ld-breadcrumb-artwork"
        data={breadcrumbList([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Gallery", url: `${SITE_URL}/gallery` },
          { name: a.title, url: `${SITE_URL}/gallery/${slug}` },
        ])}
      />
      <NavClient theme="dark" activeHref="/gallery" />

      <main className="ap-main">
        <nav className="ap-crumbs" aria-label="Breadcrumb">
          <a href="/gallery">← Back to Gallery</a>
        </nav>

        <div className="ap-grid">
          <div className="ap-media">
            {a.imageUrl && (
              <a
                href={sanityImg(a.imageUrl, 2400, { q: 85 })}
                target="_blank"
                rel="noopener"
                className="ap-frame"
                style={{
                  aspectRatio: ratio,
                  background: a.imageLqip ? `#1E1B17 url(${a.imageLqip}) center / cover no-repeat` : "#1E1B17",
                }}
                aria-label={`Open a larger image of ${a.title}`}
              >
                <img
                  src={sanityImg(a.imageUrl, 1400)}
                  srcSet={sanitySrcSet(a.imageUrl, [700, 1100, 1400, 2000])}
                  sizes="(max-width: 900px) 100vw, 58vw"
                  alt={`${a.title} — ${medium}${a.dimensions ? `, ${a.dimensions}` : ""}, by Carolyn Jenkins`}
                  fetchPriority="high"
                  decoding="async"
                />
              </a>
            )}
            {a.imageUrl && <div className="ap-zoomhint">Tap the image to see it larger</div>}
            {extras.length > 0 && (
              <div className="ap-extras">
                {extras.map((x, i) => (
                  <a key={i} href={sanityImg(x.url, 2000, { q: 85 })} target="_blank" rel="noopener" aria-label={`${a.title}, additional view ${i + 1}`}>
                    <img src={sanityImg(x.url, 400, { h: 400 })} alt={`${a.title} — additional view ${i + 1}`} loading="lazy" decoding="async" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="ap-info">
            <div className="ap-eyebrow">{medium}{a.year ? ` · ${a.year}` : ""}</div>
            <h1 className="ap-title">{a.title}</h1>
            <div className="ap-byline">Carolyn Jenkins · Palm Art Studio</div>

            <div className={`ap-price${isSold ? " is-sold" : ""}`}>{priceLine(a)}</div>
            {a.status === "available" && a.printPrice ? (
              <div className="ap-printprice">Prints available from ${Number(a.printPrice).toLocaleString("en-US")}</div>
            ) : null}

            {a.description && <p className="ap-desc">{a.description}</p>}

            <dl className="ap-facts">
              {facts.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>

            {canInquire && (
              <div className="ap-actions">
                <a href={inquireHref} className="ap-btn ap-btn-primary">
                  {isSold ? "Commission Something Similar" : "Inquire About This Piece"}
                </a>
                <a href="tel:3522179709" className="ap-btn ap-btn-ghost">Call or Text (352) 217-9709</a>
              </div>
            )}
            <p className="ap-note">
              {isSold
                ? "This piece has found a home. Carolyn takes commissions — tell her what you loved about it."
                : "Questions about framing, shipping, or seeing it in person? Just ask — Carolyn answers every message herself."}
            </p>
          </div>
        </div>

        {timeline.length > 0 && (
          <section className="ap-section">
            <div className="ap-eyebrow">Behind the Canvas</div>
            <h2 className="ap-h2">How this piece was made</h2>
            <TimelineViewer
              steps={timeline}
              finalImageUrl={a.imageUrl}
              finalImageLqip={a.imageLqip}
              finalTitle={a.title}
              variant="page"
              theme="dark"
              artworkId={`page-${slug}`}
            />
          </section>
        )}

        {others.length > 0 && (
          <section className="ap-section">
            <div className="ap-eyebrow">Keep Looking</div>
            <h2 className="ap-h2">More from the gallery</h2>
            <div className="ap-more">
              {others.map((o) => (
                <a key={o._id} href={`/gallery/${o.slug?.current || o._id}`} className="ap-card">
                  <div className="ap-card-img" style={{ background: o.imageLqip ? `#1E1B17 url(${o.imageLqip}) center / cover no-repeat` : "#1E1B17" }}>
                    <img
                      src={sanityImg(o.imageUrl, 700, { h: 560 })}
                      srcSet={`${sanityImg(o.imageUrl, 480, { h: 384 })} 480w, ${sanityImg(o.imageUrl, 900, { h: 720 })} 900w`}
                      sizes="(max-width: 700px) 100vw, 33vw"
                      alt={`${o.title} — ${mediumLabel(o.medium)} by Carolyn Jenkins`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="ap-card-title">{o.title}</div>
                  <div className="ap-card-meta">
                    {mediumLabel(o.medium)}{o.dimensions ? ` · ${o.dimensions}` : ""}
                    {o.status === "sold" ? " · Sold" : o.price ? ` · $${Number(o.price).toLocaleString("en-US")}` : ""}
                  </div>
                </a>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <a href="/gallery" className="ap-btn ap-btn-ghost">View the Full Gallery</a>
            </div>
          </section>
        )}
      </main>

      <SiteFooter current="/gallery" />

      <style dangerouslySetInnerHTML={{ __html: `
        .ap-root{background:#1E1B17;color:#F5F0E8;min-height:100vh;}
        .ap-main{max-width:1320px;margin:0 auto;padding:clamp(96px,12vw,130px) clamp(16px,4vw,56px) clamp(56px,8vw,96px);}
        .ap-crumbs a{display:inline-flex;align-items:center;min-height:48px;font-family:'Outfit',sans-serif;font-size:0.95rem;letter-spacing:0.04em;color:#D4C9B8;text-decoration:none;}
        .ap-crumbs a:hover{color:#F5F0E8;}
        .ap-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:clamp(28px,5vw,72px);align-items:start;margin-top:8px;}
        .ap-media{min-width:0;}
        .ap-frame{display:block;width:100%;max-height:82vh;overflow:hidden;cursor:zoom-in;box-shadow:0 30px 80px rgba(0,0,0,0.45);}
        .ap-frame img{display:block;width:100%;height:100%;object-fit:contain;background:#1E1B17;}
        .ap-zoomhint{font-family:'Outfit',sans-serif;font-size:0.85rem;color:#B8AFA3;margin-top:12px;text-align:center;}
        .ap-extras{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px;margin-top:16px;}
        .ap-extras img{display:block;width:100%;aspect-ratio:1;object-fit:cover;}
        .ap-info{min-width:0;position:sticky;top:104px;}
        .ap-eyebrow{font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:#C4A86E;margin-bottom:12px;}
        .ap-title{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(2.1rem,4.4vw,3.4rem);line-height:1.08;margin:0 0 10px;color:#F5F0E8;}
        .ap-byline{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.2rem;color:#D4C9B8;margin-bottom:24px;}
        .ap-price{font-family:'DM Serif Display',serif;font-size:2rem;color:#F5F0E8;margin-bottom:6px;}
        .ap-price.is-sold{color:#A9B79C;}
        .ap-printprice{font-family:'Outfit',sans-serif;font-size:1rem;color:#D4C9B8;margin-bottom:6px;}
        .ap-desc{font-family:'Outfit',sans-serif;font-weight:300;font-size:1.0625rem;line-height:1.8;color:#E4DCCD;margin:20px 0 0;white-space:pre-line;}
        .ap-facts{margin:28px 0 0;border-top:1px solid rgba(245,240,232,0.14);}
        .ap-facts > div{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid rgba(245,240,232,0.14);font-family:'Outfit',sans-serif;font-size:1rem;}
        .ap-facts dt{color:#B8AFA3;letter-spacing:0.04em;}
        .ap-facts dd{margin:0;color:#F5F0E8;text-align:right;}
        .ap-actions{display:flex;flex-direction:column;gap:12px;margin-top:28px;}
        .ap-btn{display:flex;align-items:center;justify-content:center;min-height:54px;padding:14px 26px;font-family:'Outfit',sans-serif;font-size:0.95rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;text-align:center;transition:background .25s,color .25s,border-color .25s;}
        .ap-btn-primary{background:#C47D5A;color:#FFFDF9;}
        .ap-btn-primary:hover{background:#D08A66;}
        .ap-btn-ghost{border:1px solid rgba(245,240,232,0.45);color:#F5F0E8;display:inline-flex;}
        .ap-actions .ap-btn-ghost{display:flex;}
        .ap-btn-ghost:hover{border-color:#F5F0E8;background:rgba(245,240,232,0.06);}
        .ap-note{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.15rem;line-height:1.6;color:#D4C9B8;margin:20px 0 0;}
        .ap-section{margin-top:clamp(64px,9vw,110px);padding-top:clamp(40px,6vw,64px);border-top:1px solid rgba(245,240,232,0.1);min-width:0;}
        .ap-h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(1.7rem,3vw,2.4rem);margin:0 0 28px;color:#F5F0E8;}
        .ap-more{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;}
        .ap-card{display:block;text-decoration:none;color:inherit;}
        .ap-card-img{aspect-ratio:5/4;overflow:hidden;}
        .ap-card-img img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.25,.8,.25,1);}
        .ap-card:hover .ap-card-img img{transform:scale(1.04);}
        .ap-card-title{font-family:'Cormorant Garamond',serif;font-size:1.45rem;color:#F5F0E8;margin-top:14px;}
        .ap-card-meta{font-family:'Outfit',sans-serif;font-size:0.92rem;color:#B8AFA3;margin-top:4px;}
        @media(max-width:900px){
          .ap-grid{grid-template-columns:minmax(0,1fr);}
          .ap-info{position:static;}
          .ap-frame{max-height:none;}
          .ap-more{grid-template-columns:minmax(0,1fr);}
        }
      ` }} />
    </div>
  );
}
