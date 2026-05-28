import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at top left, rgba(0, 196, 255, 0.24), transparent 42%), radial-gradient(circle at bottom right, rgba(255, 79, 143, 0.22), transparent 38%), linear-gradient(180deg, #fffaf3 0%, #fff1d6 100%)",
          color: "#111827",
          display: "flex",
          fontFamily: "sans-serif",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "linear-gradient(135deg, #00c4ff 0%, #ff4f8f 60%, #f7c948 100%)",
            border: "18px solid rgba(255,255,255,0.78)",
            borderRadius: 96,
            boxShadow: "0 28px 60px rgba(17,24,39,0.16)",
            display: "flex",
            height: 280,
            justifyContent: "center",
            width: 280,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
            <div style={{ color: "#ffffff", fontSize: 92, fontWeight: 900, letterSpacing: -5 }}>FC</div>
            <div style={{ color: "#111827", fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>REGISTRO</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
