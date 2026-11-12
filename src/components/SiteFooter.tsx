// Shared footer for the inner pages (gallery, artwork, process, about).
// Only links to places that exist — add Shop here when the store ships.
const LINKS = [
  { href: "/gallery", label: "Gallery" },
  { href: "/process", label: "Process" },
  { href: "/about", label: "About" },
  { href: "/#community", label: "Events" },
  { href: "/#contact", label: "Contact" },
];

export default function SiteFooter({ current }: { current?: string }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-logo">Palm Art Studio</div>
        <ul className="footer-links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} aria-current={current === l.href ? "page" : undefined}>{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="footer-copy">&copy; {new Date().getFullYear()} Palm Art Studio &mdash; Carolyn Jenkins. All rights reserved.</div>
      </div>
    </footer>
  );
}
