/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },

  // Addresses people type or that old links point to. Temporary (307) on
  // purpose: /shop becomes a real page when the store ships.
  async redirects() {
    return [
      { source: "/shop", destination: "/gallery", permanent: false },
      { source: "/store", destination: "/gallery", permanent: false },
      { source: "/events", destination: "/#community", permanent: false },
      { source: "/contact", destination: "/#contact", permanent: false },
      { source: "/commissions", destination: "/#contact", permanent: false },
    ];
  },

  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(self), xr-spatial-tracking=(self), microphone=(), geolocation=(), payment=(self)" },
    ];
    return [
      { source: "/:path*", headers: security },
      // Never let a browser or CDN cache admin/API responses
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

module.exports = nextConfig;
