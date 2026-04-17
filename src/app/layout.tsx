import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0906",
};

const SITE_URL = "https://palmartstudio.com";
const DEFAULT_TITLE = "Palm Art Studio | Carolyn Jenkins — Florida Paintings, Prints & Commissions";
const DEFAULT_DESC = "Original watercolor, acrylic, and mixed-media paintings by Carolyn Jenkins, a Florida artist based in Deltona. Prints and commissions available.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Palm Art Studio",
  },
  description: DEFAULT_DESC,
  applicationName: "Palm Art Studio",
  authors: [{ name: "Carolyn Jenkins" }],
  creator: "Carolyn Jenkins",
  publisher: "Palm Art Studio",
  keywords: [
    "Carolyn Jenkins artist",
    "Palm Art Studio",
    "Florida watercolor artist",
    "Deltona Florida artist",
    "original watercolor paintings",
    "acrylic paintings Florida",
    "mixed media art Florida",
    "fine art commissions Florida",
    "Florida art prints",
    "Victorian watercolor paintings",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Palm Art Studio",
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    siteName: "Palm Art Studio",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="view-transition" content="same-origin" />
      </head>
      <body>
        {children}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function(reg) {
              console.log('SW registered:', reg.scope);
            }).catch(function(err) {
              console.log('SW registration failed:', err);
            });
          }
        `}</Script>
      </body>
    </html>
  );
}
