import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0a0906",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Palm Art Studio — Admin",
  description: "Palm Art Studio admin dashboard",
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PAS Admin",
    statusBarStyle: "black-translucent",
    startupImage: [{ url: "/icons/icon-512.png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      {children}
    </>
  );
}
