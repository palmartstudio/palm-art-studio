import { client } from "../../../sanity/lib/client";
import { urlFor } from "../../../sanity/lib/client";
import { artistBioQuery } from "../../../sanity/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Carolyn Jenkins | Palm Art Studio",
  description: "Born in Towson, Maryland and raised in Winter Park, Florida. From AOL icon design and Disney World menus to award-winning fine art. The story of Carolyn Jenkins.",
};

async function getData() {
  const artist = await client.fetch(artistBioQuery).catch(() => null);
  return { artist };
}

export default async function AboutPage() {
  const { artist } = await getData();
  const artistName = artist?.name || "Carolyn Jenkins";
  const studioLocation = artist?.studioLocation || "Deltona, FL";

  return (
    <>
      {/* NAV */}
      <nav className="nav scrolled">
        <a href="/" className="nav-logo">Palm Art Studio</a>
        <ul className="nav-links">
          <li><a href="/#gallery">Gallery</a></li>
          <li><a href="/about" className="active">About</a></li>
          <li><a href="/#shop">Shop</a></li>
          <li><a href="/#community">Events</a></li>
          <li><a href="/#contact">Contact</a></li>
          <li><a href="/#shop" className="nav-cta">Shop Prints</a></li>
        </ul>
      </nav>

      {/* ABOUT HERO */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <div className="section-eyebrow">The Artist</div>
          <h1 className="about-hero-title">Carolyn <em>Jenkins</em></h1>
          <p className="about-hero-subtitle">Artist &amp; Designer · {studioLocation}</p>
        </div>
      </section>

      {/* ORIGIN STORY */}
      <section className="about-story">
        <div className="about-story-grid">
          <div className="about-story-image reveal">
            {artist?.portrait ? (
              <img src={urlFor(artist.portrait).width(700).height(900).url()} alt={artistName} style={{width:"100%",height:"100%",objectFit:"cover"}} />
            ) : (
              <div className="about-image-placeholder">Artist Portrait</div>
            )}
          </div>
          <div className="about-story-body reveal">
            <h2>The Beginning</h2>
            <p>Born in Towson, Maryland, and raised in Winter Park, Florida, Carolyn has been painting and creating since childhood. Her artistic journey began at the Maitland Center of the Arts and Rollins College, where she studied privately with artists who shaped her eye for detail and composition.</p>
            <p>In 1972, she was accepted into the prestigious Ringling School of Art. However, faced with a family emergency, she chose to redirect her college funds to pay for her Godmother&apos;s life-saving open-heart surgery. That decision blessed her with her Godmother&apos;s presence for another twenty years.</p>
            <p className="about-pullquote">&ldquo;Today, I create with a sense of gratitude and freedom, aiming to learn without judgment and share the joy of art with others.&rdquo;</p>
          </div>
        </div>
      </section>

      {/* COMMERCIAL CAREER */}
      <section className="about-commercial">
        <div className="about-commercial-inner">
          <div className="about-commercial-text reveal">
            <div className="section-eyebrow">Commercial Design &amp; Illustration</div>
            <h2>The Professional Journey</h2>
            <p>Carolyn&apos;s career began in the pre-digital era at Tom Griffin Commercial Art Studio in Winter Park, specializing in hand-drawn designs for packaging, logos, and brochures. As the industry evolved, she embraced the digital age, founding Storm Hill Studio in Maitland, FL.</p>
            <p>Her diverse commercial portfolio spans some of the most recognizable brands in America — from the earliest days of the consumer internet to theme parks and professional motorsport.</p>
          </div>
          <div className="about-client-grid reveal">
            {[
              { name: "AOL", desc: "Created original icon art for AOL\u2019s early user interface — one of the first digital design projects of the internet era", icon: "\uD83D\uDDA5\uFE0F" },
              { name: "Walt Disney World", desc: "Designed menus for Walt Disney World dining experiences across the resort", icon: "\u2728" },
              { name: "Darden Restaurants", desc: "Menu design and promotional materials for the restaurant group", icon: "\uD83C\uDF7D\uFE0F" },
              { name: "Wayne Taylor Racing", desc: "Illustrations for the Wayne Taylor Indy Racing team", icon: "\uD83C\uDFCE\uFE0F" },
              { name: "Sea Ray Boats", desc: "T-shirt line design for the marine manufacturer", icon: "\u26F5" },
              { name: "Juice Bowl", desc: "Created classic juice can packaging designs for the brand", icon: "\uD83E\uDDC3" },
              { name: "Orlando Museum of Art", desc: "Promotional materials for one of Central Florida\u2019s premier cultural institutions", icon: "\uD83C\uDFDB\uFE0F" },
              { name: "Coach Transit Components", desc: "Product catalogs for the commercial vehicle parts manufacturer", icon: "\uD83D\uDE8C" },
            ].map((c, i) => (
              <div key={i} className="about-client-card">
                <div className="about-client-icon">{c.icon}</div>
                <div className="about-client-name">{c.name}</div>
                <div className="about-client-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINE ART CAREER */}
      <section className="about-fineart">
        <div className="about-fineart-inner">
          <div className="about-fineart-text reveal">
            <div className="section-eyebrow">Fine Art &amp; Exhibitions</div>
            <h2>Returning to the Canvas</h2>
            <p>In addition to commercial work, Carolyn spent over fourteen years exhibiting in art festivals across Florida, earning multiple awards including 1st, 2nd, 3rd place and Honorable Mentions for her detailed watercolors of old buildings and Victorian-era houses — showing at festivals from 1975 through 1988.</p>
            <p>She then entered a show in Orlando benefiting Harbor House, a haven for domestic abuse survivors — a cause deeply personal to her. Out of 4,000 entries, only three hundred were chosen. Her work was among them.</p>
            <p>Since 2023, she has returned to showing with renewed energy — exhibiting at the California Upland Habitat Show (where she won 2nd place), several CityArts exhibits in Orlando, and shows in Michigan, Wisconsin, and Minnesota. She is currently an active member of the West Volusia Artists.</p>
          </div>
          <div className="about-credentials-full reveal">
            <div className="credential-row">
              <div className="credential-lg">
                <div className="credential-number">40+</div>
                <div className="credential-label">Years Creating Art</div>
              </div>
              <div className="credential-lg">
                <div className="credential-number">14+</div>
                <div className="credential-label">Years Exhibiting</div>
              </div>
              <div className="credential-lg">
                <div className="credential-number">6+</div>
                <div className="credential-label">Awards Won</div>
              </div>
              <div className="credential-lg">
                <div className="credential-number">5</div>
                <div className="credential-label">States Exhibited</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <div className="quote-banner">
        <p className="quote-text">&ldquo;What I tell anyone who wants to create is simple: Do it. It doesn&apos;t matter what others think — create for yourself. It is good for the soul and well-being. Feel the freedom!&rdquo;</p>
        <div className="quote-attr">— Carolyn Jenkins</div>
      </div>

      {/* PERSONAL NOTE */}
      <section className="about-personal">
        <div className="about-personal-inner reveal">
          <div className="section-eyebrow">A Personal Note</div>
          <h2>Gratitude &amp; Freedom</h2>
          <p>My path as an artist has been defined by both passion and sacrifice. The decision to forgo Ringling in 1972 shaped everything that followed — it taught me that art is not just what you put on canvas, but the choices you make with your life.</p>
          <p>I am not inspired by any single artist. I feel if I was, I would just be considered a copier. I proceed because it&apos;s my way naturally — to project my emotions, my method of communication, my heart and soul. I am also a collector of art, with a collection spanning the 1920s to today.</p>
          <p>I love to utilize recycled pieces in some of my paintings and explore as far as I can with my work. Every day I paint, I exceed my own limitations and imagination. That&apos;s the beauty of creating — you never stop growing.</p>
          <div className="about-personal-cta">
            <a href="/#gallery" className="btn-primary">View My Work</a>
            <a href="/#contact" className="btn-secondary">Get in Touch</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">Palm Art Studio</div>
          <ul className="footer-links">
            <li><a href="/#gallery">Gallery</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/#shop">Shop</a></li>
            <li><a href="/#community">Events</a></li>
            <li><a href="/#contact">Contact</a></li>
          </ul>
          <div className="footer-copy">© 2026 Palm Art Studio — Carolyn Jenkins. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}
