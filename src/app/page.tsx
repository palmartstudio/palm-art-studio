import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/client";
import {
  siteSettingsQuery,
  artistBioQuery,
  featuredArtworkQuery,
  shopItemsQuery,
  upcomingEventsQuery,
} from "../../sanity/lib/queries";

async function getData() {
  const [settings, artist, artwork, shopItems, events] = await Promise.all([
    client.fetch(siteSettingsQuery).catch(() => null),
    client.fetch(artistBioQuery).catch(() => null),
    client.fetch(featuredArtworkQuery).catch(() => []),
    client.fetch(shopItemsQuery).catch(() => []),
    client.fetch(upcomingEventsQuery).catch(() => []),
  ]);
  return { settings, artist, artwork, shopItems, events };
}

export default async function Home() {
  const { settings, artist, artwork, shopItems, events } = await getData();

  const artistName = artist?.name || "Carolyn Jenkins";
  const studioLocation = artist?.studioLocation || "Deltona, FL";
  const quote = artist?.quote || "It doesn\u2019t matter what others think\u2014create for yourself. It is good for the soul and well-being. Feel the freedom!";
  const heroTitle = settings?.heroTitle || "Art from the Soul";

  return (
    <>
      {/* NAV */}
      <nav className="nav" id="nav">
        <a href="#" className="nav-logo">Palm Art Studio</a>
        <ul className="nav-links" id="navLinks">
          <li><a href="/gallery">Gallery</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="#shop">Shop</a></li>
          <li><a href="#community">Events</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><a href="#shop" className="nav-cta">Shop Prints</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-bg-element hero-bg-1" />
        <div className="hero-bg-element hero-bg-2" />
        <div className="hero-bg-element hero-bg-3" />
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-eyebrow">{artistName} · {studioLocation}</div>
            <h1 className="hero-title">
              {heroTitle.includes("Soul") ? (
                <>Art from the <em>Soul</em></>
              ) : heroTitle}
            </h1>
            <p className="hero-subtitle">&ldquo;{quote}&rdquo;</p>
            <div className="hero-actions">
              <a href="#gallery" className="btn-primary">Explore the Gallery</a>
              <a href="#shop" className="btn-secondary">Shop Originals &amp; Prints</a>
            </div>
          </div>
          <div className="hero-gallery">
            {artist?.portrait ? (
              <div className="hero-frame hero-frame-1">
                <img src={urlFor(artist.portrait).width(800).url()} alt={artistName} style={{width:"100%",height:"100%",objectFit:"cover"}} />
              </div>
            ) : (
              <div className="hero-frame hero-frame-1"><div className="hero-frame-inner"><span>Featured Artwork</span></div></div>
            )}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery">
        <div className="section-header reveal">
          <div className="section-eyebrow">Featured Works</div>
          <h2 className="section-title">The Collection</h2>
          <p className="section-desc">From watercolors of historic Florida architecture to bold mixed-media explorations — each piece carries emotion, story, and soul.</p>
        </div>
        <div className="gallery-grid">
          {(artwork.length > 0 ? artwork : Array(6).fill(null)).map((item: any, i: number) => (
            <div key={i} className="gallery-item reveal">
              <div className="gallery-item-bg">
                {item?.imageUrl ? (
                  <img src={urlFor(item.image).width(600).url()} alt={item.title} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                ) : (
                  <span className="gallery-placeholder">Artwork {i + 1}</span>
                )}
              </div>
              <div className="gallery-item-overlay">
                <div className="gallery-item-title">{item?.title || `Artwork ${i + 1}`}</div>
                <div className="gallery-item-meta">{item?.medium || "Mixed Media"}{item?.dimensions ? ` · ${item.dimensions}` : ""}</div>
                {item?.price && <div className="gallery-item-price">${item.price.toLocaleString()}</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="gallery-cta reveal"><a href="#" className="btn-primary">View Full Collection</a></div>
      </section>

      {/* ABOUT */}
      <section id="about">
        <div className="about-grid">
          <div className="about-image reveal">
            {artist?.portrait ? (
              <img src={urlFor(artist.portrait).width(600).height(800).url()} alt={artistName} style={{width:"100%",height:"100%",objectFit:"cover"}} />
            ) : (
              <div className="about-image-placeholder">Artist Portrait</div>
            )}
          </div>
          <div className="about-body reveal">
            <div className="section-eyebrow">The Artist</div>
            <h3>From AOL &amp; Disney to <em>Fine Art</em></h3>
            <p>Born in Towson, Maryland, and raised in Winter Park, Florida, Carolyn Jenkins has been painting and creating since childhood. Her artistic journey spans from the Maitland Center of the Arts and Rollins College to founding her own design firm, Storm Hill Studio.</p>
            <p>Her commercial career began in the pre-digital era at Tom Griffin Commercial Art Studio in Winter Park. She went on to create original icon art for AOL&apos;s early user interface, design menus for Walt Disney World and Darden Restaurants, illustrate for the Wayne Taylor Indy Racing team, and create packaging for brands like Juice Bowl.</p>
            <p>Now based in {studioLocation}, Carolyn continues to create works in acrylic and watercolor, with over fourteen years exhibiting in art festivals across Florida. She is an active member of the West Volusia Artists.</p>
            <div className="about-credentials">
              {(artist?.credentials || [
                { number: "40+", label: "Years Creating" },
                { number: "14+", label: "Years Exhibiting" },
                { number: "6+", label: "Awards Won" },
              ]).map((c: any, i: number) => (
                <div key={i} className="credential">
                  <div className="credential-number">{c.number}</div>
                  <div className="credential-label">{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMMERCIAL */}
      <section id="commercial" style={{background:"var(--warm-white)"}}>
        <div className="section-header reveal">
          <div className="section-eyebrow">Commercial Work</div>
          <h2 className="section-title">Design &amp; Illustration</h2>
          <p className="section-desc">Decades of professional design work for iconic brands.</p>
        </div>
        <div className="commercial-grid">
          {(artist?.commercialClients || [
            { name: "AOL", description: "Original icon art for early UI" },
            { name: "Walt Disney World", description: "Menu design for Disney dining" },
            { name: "Darden Restaurants", description: "Menu and promotional design" },
            { name: "Wayne Taylor Racing", description: "Indy Racing team illustrations" },
            { name: "Sea Ray Boats", description: "T-shirt line design" },
            { name: "Juice Bowl", description: "Classic juice can packaging" },
            { name: "Orlando Museum of Art", description: "Promotional materials" },
            { name: "Coach Transit", description: "Product catalogs" },
          ]).map((c: any, i: number) => (
            <div key={i} className="commercial-card reveal">
              <div className="commercial-card-name">{c.name}</div>
              <div className="commercial-card-desc">{c.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <div className="quote-banner">
        <p className="quote-text">&ldquo;{quote}&rdquo;</p>
        <div className="quote-attr">— {artistName}</div>
      </div>

      {/* SHOP */}
      <section id="shop">
        <div className="section-header reveal">
          <div className="section-eyebrow">Shop</div>
          <h2 className="section-title">Bring Art Home</h2>
          <p className="section-desc">Original paintings, limited edition prints, and commissions. Each piece is signed and ships with a certificate of authenticity.</p>
        </div>
        <div className="shop-grid">
          {(shopItems.length > 0 ? shopItems : [
            { title: "Victorian Dawn — Print", medium: "Giclée on Archival Paper · 18 × 24 in", price: 85, badge: "Limited Edition" },
            { title: "Emotional Currents", medium: "Mixed Media on Canvas · 24 × 36 in", price: 1800, badge: "Original" },
            { title: "Florida Collection — Set of 3", medium: "Giclée Prints · 11 × 14 in each", price: 180, comparePrice: 225 },
            { title: "Custom Commission", medium: "Watercolor or Mixed Media · Your Subject", price: 500 },
          ]).map((item: any, i: number) => (
            <div key={i} className="shop-card reveal">
              <div className="shop-card-image">
                {item?.imageUrl ? (
                  <img src={urlFor(item.image).width(400).url()} alt={item.title} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                ) : (
                  <span className="gallery-placeholder">{item.title}</span>
                )}
                {item.badge && <div className="shop-card-badge">{item.badge}</div>}
              </div>
              <div className="shop-card-body">
                <div className="shop-card-title">{item.title}</div>
                <div className="shop-card-medium">{item.medium}</div>
                <div className="shop-card-footer">
                  <div className="shop-card-price">
                    {item.price ? `$${item.price.toLocaleString()}` : "Inquire"}
                    {item.comparePrice && <span className="original">${item.comparePrice}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section id="community">
        <div className="section-header reveal">
          <div className="section-eyebrow">Community</div>
          <h2 className="section-title">Shows &amp; Events</h2>
          <p className="section-desc">Join Carolyn at upcoming exhibitions, art festivals, and studio events.</p>
        </div>
        <div className="events-list">
          {(events.length > 0 ? events : [
            { title: "CityArts Spring Exhibition", date: "2026-04-12", location: "Orlando, FL" },
            { title: "Central Florida Art Festival", date: "2026-05-03", location: "Winter Park, FL" },
            { title: "Studio Open House", date: "2026-06-18", location: "Palm Art Studio" },
          ]).map((evt: any, i: number) => {
            const d = new Date(evt.date + "T00:00:00");
            const month = d.toLocaleString("en", { month: "short" });
            const day = d.getDate().toString().padStart(2, "0");
            return (
              <div key={i} className="event-item reveal">
                <div className="event-date">
                  <div className="event-month">{month}</div>
                  <div className="event-day">{day}</div>
                </div>
                <div className="event-info">
                  <h4>{evt.title}</h4>
                  <p>{evt.location}</p>
                </div>
                {evt.rsvpUrl ? (
                  <a href={evt.rsvpUrl} className="event-action">RSVP</a>
                ) : (
                  <a href="#contact" className="event-action">Details</a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* NEWSLETTER */}
      <div className="newsletter">
        <h3>{settings?.newsletterHeading || "Stay in the Studio"}</h3>
        <p>{settings?.newsletterText || "New works, behind-the-scenes stories, and exhibition announcements — delivered to your inbox."}</p>
        <div className="newsletter-form">
          <input type="email" placeholder="Your email address" aria-label="Email address" />
          <button type="button">Subscribe</button>
        </div>
      </div>

      {/* CONTACT */}
      <section id="contact">
        <div className="section-header reveal">
          <div className="section-eyebrow">Get in Touch</div>
          <h2 className="section-title">Let&apos;s Connect</h2>
          <p className="section-desc">Interested in a commission, a purchase, or just want to talk art? Reach out anytime.</p>
        </div>
        <div className="contact-grid">
          <div className="contact-info reveal">
            <h3>Palm Art Studio</h3>
            <div className="contact-detail">
              <div className="contact-detail-text">
                <a href="tel:3522179709">{artist?.phone || "(352) 217-9709"}</a>
                <small>Call or Text</small>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-detail-text">
                <a href={`mailto:${artist?.email || "cj@palmartstudio.com"}`}>{artist?.email || "cj@palmartstudio.com"}</a>
                <small>For inquiries &amp; commissions</small>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-detail-text">
                <a href="#">{studioLocation}</a>
                <small>Studio visits by appointment</small>
              </div>
            </div>
            <div className="social-links">
              {(artist?.socialLinks || [
                { label: "TT", url: "#" },
                { label: "IG", url: "#" },
                { label: "SA", url: "#" },
                { label: "FB", url: "#" },
              ]).map((s: any, i: number) => (
                <a key={i} href={s.url || "#"} className="social-link" aria-label={s.platform || s.label}>{s.label}</a>
              ))}
            </div>
          </div>
          <div className="contact-form reveal">
            <input type="text" placeholder="Your Name" aria-label="Name" />
            <input type="email" placeholder="Email Address" aria-label="Email" />
            <input type="text" placeholder="Subject — Commission, Purchase, Other" aria-label="Subject" />
            <textarea placeholder="Tell me about what you're looking for..." aria-label="Message" />
            <button className="btn-primary" type="button">Send Message</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">Palm Art Studio</div>
          <ul className="footer-links">
            <li><a href="/gallery">Gallery</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="#shop">Shop</a></li>
            <li><a href="#community">Events</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <div className="footer-copy">{settings?.footerText || "© 2026 Palm Art Studio — Carolyn Jenkins. All rights reserved."}</div>
        </div>
      </footer>
    </>
  );
}
