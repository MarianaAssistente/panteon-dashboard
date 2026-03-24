"use client";
import dynamic from "next/dynamic";

const Office3D = dynamic(() => import("@/components/Office3D"), { ssr: false });

export default function OfficePage() {
  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="px-6 pt-6 pb-3">
        <h1 className="text-xl font-semibold text-[#F5F5F5]">Escritório Virtual</h1>
        <p className="text-[#F5F5F5]/40 text-sm">Panteão do Olimpo — visão 3D</p>
      </div>
      <div className="flex-1 relative">
        <Office3D />
      </div>
    </div>
  );
}
