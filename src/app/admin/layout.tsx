import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0a0906",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

// All head tags go through the metadata API. This layout used to render its own
// <head> element inside <body>, which is invalid HTML and made React throw a
// hydration error and re-render the whole admin on every load.
export const metadata: Metadata = {
  title: "Palm Art Studio — Admin",
  description: "Palm Art Studio admin dashboard",
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  formatDetection: { telephone: false },
  icons: { apple: [{ url: "/icons/icon-180x180.png", sizes: "180x180" }] },
  appleWebApp: {
    capable: true,
    title: "PAS Admin",
    statusBarStyle: "black-translucent",
    startupImage: [{ url: "/icons/icon-512x512.png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
