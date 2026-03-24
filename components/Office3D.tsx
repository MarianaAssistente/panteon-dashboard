"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import AgentRoom from "./AgentRoom";

const SUPABASE_URL = "https://duogqvusxueetapcvsfp.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1b2dxdnVzeHVlZXRhcGN2c2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzEzMTgsImV4cCI6MjA4ODQwNzMxOH0.QVhn2X8oXZ88nxKD3snvDUxwmlfsK80IM1n-4iINg1o";

const AGENTS_ORDER = [
  "mariana",
  "atena",
  "hefesto",
  "apollo",
  "afrodite",
  "hera",
  "ares",
  "hestia",
];

interface AgentData {
  id: string;
  name: string;
  role: string;
  model: string;
  status: string;
  activeTask?: string;
}

async function fetchData(): Promise<AgentData[]> {
  const headers = {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
  };

  const [agentsRes, statusRes, tasksRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/agents?select=id,name,role,model`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/agent_status?select=agent_id,status`, { headers }),
    fetch(
      `${SUPABASE_URL}/rest/v1/tasks?select=agent_id,title&status=eq.in_progress&order=updated_at.desc`,
      { headers }
    ),
  ]);

  const agents = agentsRes.ok ? await agentsRes.json() : [];
  const statuses = statusRes.ok ? await statusRes.json() : [];
  const tasks = tasksRes.ok ? await tasksRes.json() : [];

  const statusMap: Record<string, string> = {};
  for (const s of statuses) statusMap[s.agent_id] = s.status;

  const taskMap: Record<string, string> = {};
  for (const t of tasks) {
    if (!taskMap[t.agent_id]) taskMap[t.agent_id] = t.title;
  }

  // Build from AGENTS_ORDER if no DB data
  if (!agents || agents.length === 0) {
    return AGENTS_ORDER.map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      role: "Agente",
      model: "",
      status: statusMap[id] || "standby",
      activeTask: taskMap[id],
    }));
  }

  return agents.map((a: { id: string; name: string; role: string; model: string }) => ({
    id: a.id,
    name: a.name || a.id,
    role: a.role || "Agente",
    model: a.model || "",
    status: statusMap[a.id] || "standby",
    activeTask: taskMap[a.id],
  }));
}

export default function Office3D() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    fetchData()
      .then(setAgents)
      .catch(() => {
        // Fallback com dados estáticos
        setAgents(
          AGENTS_ORDER.map((id) => ({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            role: "Agente",
            model: "",
            status: "standby",
          }))
        );
      });
  }, []);

  // Grid 4x2
  const getPosition = (index: number): [number, number, number] => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    return [col * 6, 0, row * 6];
  };

  return (
    <>
      <div style={{ width: "100%", height: "calc(100vh - 100px)", minHeight: 500, background: "#0A0A0A" }}>
        <Canvas
          camera={{ position: [9, 14, 18], fov: 45 }}
          style={{ width: "100%", height: "100%", background: "#0A0A0A" }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, 10, -10]} intensity={0.8} color="#ffffff" />
          <hemisphereLight args={["#ffffff", "#333333", 0.8]} />

          <Stars radius={100} depth={50} count={800} factor={2} saturation={0} fade />

          <OrbitControls
            enableRotate={false}
            enablePan={true}
            enableZoom={true}
            minDistance={8}
            maxDistance={35}
            panSpeed={0.6}
            zoomSpeed={0.8}
          />

          {agents.map((agent, i) => (
            <AgentRoom
              key={agent.id}
              agentId={agent.id}
              name={agent.name}
              role={agent.role}
              status={agent.status}
              activeTask={agent.activeTask}
              position={getPosition(i)}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}
        </Canvas>
      </div>

      {/* Painel lateral */}
      {selectedAgent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: 320,
            height: "100vh",
            background: "#111111",
            borderLeft: "1px solid #2a2a2a",
            padding: "24px 20px",
            zIndex: 100,
            overflowY: "auto",
            color: "#F5F5F5",
          }}
        >
          <button
            onClick={() => setSelectedAgent(null)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "transparent",
              border: "none",
              color: "#888",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F5F5F5", margin: 0 }}>
              {selectedAgent.name}
            </h2>
            <p style={{ fontSize: 13, color: "#D4AF37", margin: "4px 0 0" }}>
              {selectedAgent.role}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <InfoRow label="Status" value={selectedAgent.status} />
            {selectedAgent.model && <InfoRow label="Modelo" value={selectedAgent.model} />}
            {selectedAgent.activeTask && (
              <div
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: 8,
                  padding: "12px",
                  marginTop: 8,
                }}
              >
                <p style={{ fontSize: 11, color: "#888", margin: "0 0 6px" }}>
                  TASK ATIVA
                </p>
                <p style={{ fontSize: 13, color: "#F5F5F5", margin: 0 }}>
                  {selectedAgent.activeTask}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const statusColors: Record<string, string> = {
    working: "#22c55e",
    idle: "#f59e0b",
    standby: "#6b7280",
    blocked: "#ef4444",
  };
  const color = label === "Status" ? statusColors[value] || "#F5F5F5" : "#F5F5F5";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
      <span style={{ fontSize: 13, color, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
