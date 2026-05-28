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
            "radial-gradient(circle at top left, rgba(79,209,197,0.22), transparent 40%), linear-gradient(180deg, #0a1628 0%, #07111f 100%)",
          color: "white",
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
            background: "rgba(79,209,197,0.12)",
            border: "1px solid rgba(79,209,197,0.28)",
            borderRadius: 80,
            display: "flex",
            height: 280,
            justifyContent: "center",
            width: 280,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "center" }}>
            <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -4 }}>FC</div>
            <div style={{ fontSize: 34, opacity: 0.88 }}>PONTO</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
