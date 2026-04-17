import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Palm Art Studio — Carolyn Jenkins, Florida Artist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #1E1B17 0%, #2A2520 45%, #3E302A 100%)",
          padding: "64px",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(196,125,90,0.35) 0%, rgba(196,125,90,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -80,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,154,126,0.25) 0%, rgba(139,154,126,0) 70%)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#C4A86E",
            fontFamily: "sans-serif",
            fontWeight: 500,
          }}
        >
          <div style={{ width: 42, height: 2, background: "#C4A86E" }} />
          Palm Art Studio
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            color: "#F5F0E8",
          }}
        >
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              maxWidth: 900,
            }}
          >
            Carolyn Jenkins
          </div>
          <div
            style={{
              fontSize: 54,
              fontStyle: "italic",
              color: "#D4C9B8",
              marginTop: 6,
              maxWidth: 1000,
              display: "flex",
            }}
          >
            Florida paintings, prints &amp; commissions
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 32,
              fontFamily: "sans-serif",
              fontSize: 22,
              color: "#B8AFA3",
              letterSpacing: "0.05em",
            }}
          >
            <span>Watercolor</span>
            <span style={{ color: "#C47D5A" }}>·</span>
            <span>Acrylic</span>
            <span style={{ color: "#C47D5A" }}>·</span>
            <span>Mixed Media</span>
            <span style={{ color: "#C47D5A" }}>·</span>
            <span>palmartstudio.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
