"use client";
import dynamic from "next/dynamic";

const Office3D = dynamic(() => import("@/components/Office3D"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37", fontSize: 14 }}>
      Carregando ambiente 3D...
    </div>
  ),
});

export default function OfficePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div style={{ padding: "24px 24px 12px", flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#F5F5F5", margin: 0 }}>Escritório Virtual</h1>
        <p style={{ fontSize: 13, color: "rgba(245,245,245,0.4)", margin: "4px 0 0" }}>Panteão do Olimpo — visão 3D</p>
      </div>
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <Office3D />
      </div>
    </div>
  );
}
