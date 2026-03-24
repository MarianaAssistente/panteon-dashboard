"use client";

import { useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SUPABASE_URL = "https://duogqvusxueetapcvsfp.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1b2dxdnVzeHVlZXRhcGN2c2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzEzMTgsImV4cCI6MjA4ODQwNzMxOH0.QVhn2X8oXZ88nxKD3snvDUxwmlfsK80IM1n-4iINg1o";

const AGENTS_STATIC = [
  { id: "mariana",  name: "Mariana",  role: "CEO",  color: "#D4AF37" },
  { id: "atena",    name: "Atena",    role: "CSO",  color: "#6366f1" },
  { id: "hefesto",  name: "Hefesto",  role: "CTO",  color: "#f97316" },
  { id: "apollo",   name: "Apollo",   role: "CCO",  color: "#22c55e" },
  { id: "afrodite", name: "Afrodite", role: "CMO",  color: "#ec4899" },
  { id: "hera",     name: "Hera",     role: "COO",  color: "#06b6d4" },
  { id: "ares",     name: "Ares",     role: "CQO",  color: "#ef4444" },
  { id: "hestia",   name: "Héstia",   role: "CPA",  color: "#8b5cf6" },
];

const STATUS_COLORS: Record<string, string> = {
  working: "#22c55e",
  idle: "#f59e0b",
  standby: "#9ca3af",
  blocked: "#ef4444",
};

interface AgentData {
  id: string;
  name: string;
  role: string;
  color: string;
  status: string;
  activeTask?: string;
}

function AgentRoom({ agent, position, onClick }: {
  agent: AgentData;
  position: [number, number, number];
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const statusColor = STATUS_COLORS[agent.status] || "#9ca3af";

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = hovered ? 1.06 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(target, target, target), delta * 8);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* Piso */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[5.2, 0.1, 5.2]} />
        <meshStandardMaterial color={agent.color} opacity={0.25} transparent roughness={0.8} />
      </mesh>

      {/* Borda do piso */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[5.4, 0.04, 5.4]} />
        <meshStandardMaterial color={agent.color} opacity={0.5} transparent />
      </mesh>

      {/* Avatar esfera */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Luz pontual sobre o avatar */}
      <pointLight position={[0, 3, 0]} color={agent.color} intensity={1.2} distance={5} />

      {/* Indicador de status */}
      <mesh position={[0.9, 1.9, 0.9]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={2} />
      </mesh>

      {/* Nome */}
      <Text position={[0, 2.4, 0]} fontSize={0.38} color="#FFFFFF" anchorX="center" anchorY="middle" renderOrder={1}>
        {agent.name}
      </Text>

      {/* Cargo */}
      <Text position={[0, 1.9, 0]} fontSize={0.24} color={agent.color} anchorX="center" anchorY="middle" renderOrder={1}>
        {agent.role}
      </Text>

      {/* Task ativa */}
      {agent.activeTask && (
        <Text
          position={[0, 0.25, 2.5]}
          fontSize={0.17}
          color="rgba(255,255,255,0.6)"
          maxWidth={4.5}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          renderOrder={1}
        >
          {agent.activeTask.slice(0, 45)}
        </Text>
      )}
    </group>
  );
}

export default function Office3D() {
  const [agents, setAgents] = useState<AgentData[]>(
    AGENTS_STATIC.map((a) => ({ ...a, status: "standby" }))
  );
  const [selected, setSelected] = useState<AgentData | null>(null);

  useEffect(() => {
    const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/agent_status?select=agent_id,status`, { headers }).then((r) => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/tasks?select=agent_id,title&status=eq.in_progress&order=updated_at.desc`, { headers }).then((r) => r.json()),
    ]).then(([statuses, tasks]) => {
      const statusMap: Record<string, string> = {};
      if (Array.isArray(statuses)) statuses.forEach((s: { agent_id: string; status: string }) => { statusMap[s.agent_id] = s.status; });

      const taskMap: Record<string, string> = {};
      if (Array.isArray(tasks)) tasks.forEach((t: { agent_id: string; title: string }) => { if (!taskMap[t.agent_id]) taskMap[t.agent_id] = t.title; });

      setAgents(AGENTS_STATIC.map((a) => ({
        ...a,
        status: statusMap[a.id] || "standby",
        activeTask: taskMap[a.id],
      })));
    }).catch(() => {});
  }, []);

  const getPos = (i: number): [number, number, number] => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return [col * 7, 0, row * 7];
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0A0A0A" }}>
      <Canvas
        camera={{ position: [10.5, 16, 22], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        {/* Iluminação */}
        <color attach="background" args={["#0A0A0A"]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[15, 25, 15]} intensity={2} castShadow />
        <directionalLight position={[-10, 15, -10]} intensity={1} />
        <hemisphereLight args={["#ffffff", "#1a1a2e", 0.6]} />

        <Stars radius={120} depth={60} count={1000} factor={2} saturation={0} fade />

        <OrbitControls
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          minDistance={6}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
        />

        {agents.map((agent, i) => (
          <AgentRoom
            key={agent.id}
            agent={agent}
            position={getPos(i)}
            onClick={() => setSelected(agent)}
          />
        ))}
      </Canvas>

      {/* Painel lateral */}
      {selected && (
        <div style={{
          position: "absolute", top: 0, right: 0, width: 300, height: "100%",
          background: "#111", borderLeft: "1px solid #2a2a2a",
          padding: "24px 20px", overflowY: "auto", color: "#F5F5F5", zIndex: 10,
        }}>
          <button onClick={() => setSelected(null)} style={{
            position: "absolute", top: 16, right: 16, background: "transparent",
            border: "none", color: "#888", fontSize: 20, cursor: "pointer",
          }}>✕</button>

          <div style={{ width: 48, height: 48, borderRadius: "50%", background: selected.color, marginBottom: 16, opacity: 0.9 }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{selected.name}</h2>
          <p style={{ fontSize: 13, color: "#D4AF37", margin: "0 0 20px" }}>{selected.role}</p>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#888" }}>Status</span>
            <span style={{ fontSize: 13, color: STATUS_COLORS[selected.status] || "#9ca3af", fontWeight: 500 }}>
              {selected.status}
            </span>
          </div>

          {selected.activeTask && (
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 12, marginTop: 8 }}>
              <p style={{ fontSize: 11, color: "#888", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Task Ativa</p>
              <p style={{ fontSize: 13, margin: 0 }}>{selected.activeTask}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
