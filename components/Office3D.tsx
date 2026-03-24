"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

const SUPABASE_URL = "https://duogqvusxueetapcvsfp.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1b2dxdnVzeHVlZXRhcGN2c2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzEzMTgsImV4cCI6MjA4ODQwNzMxOH0.QVhn2X8oXZ88nxKD3snvDUxwmlfsK80IM1n-4iINg1o";

const AGENTS_STATIC = [
  { id: "mariana",  name: "Mariana",  role: "CEO", color: "#D4AF37" },
  { id: "atena",    name: "Atena",    role: "CSO", color: "#6366f1" },
  { id: "hefesto",  name: "Hefesto",  role: "CTO", color: "#f97316" },
  { id: "apollo",   name: "Apollo",   role: "CCO", color: "#22c55e" },
  { id: "afrodite", name: "Afrodite", role: "CMO", color: "#ec4899" },
  { id: "hera",     name: "Hera",     role: "COO", color: "#06b6d4" },
  { id: "ares",     name: "Ares",     role: "CQO", color: "#ef4444" },
  { id: "hestia",   name: "Héstia",   role: "CPA", color: "#8b5cf6" },
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

// ── Decorative components ──────────────────────────────────────────────────

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Vaso */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      {/* Terra */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.28, 0.06, 0.28]} />
        <meshStandardMaterial color="#3a2a10" />
      </mesh>
      {/* Planta — boxes verdes empilhados */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.4, 0.35, 0.4]} />
        <meshStandardMaterial color="#2d6a2d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#3a8a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#4aaa4a" roughness={0.8} />
      </mesh>
    </group>
  );
}

function WallPicture({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Moldura */}
      <mesh>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshStandardMaterial color="#5a3a10" roughness={0.8} />
      </mesh>
      {/* Imagem */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.65, 0.45, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ── VoxelCharacter ─────────────────────────────────────────────────────────

function VoxelCharacter({
  skinColor,
  bodyColor,
  hairColor = "#3a2a1a",
  isFemale = false,
  status,
  position,
  scale = 1.0,
}: {
  skinColor: string;
  bodyColor: string;
  hairColor?: string;
  isFemale?: boolean;
  status: string;
  position: [number, number, number];
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;

    if (status === "working") {
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 4 * (scale > 1 ? 1.4 : 1)) * (0.3 * (scale > 1 ? 1.3 : 1));
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * 4 * (scale > 1 ? 1.4 : 1) + Math.PI) * (0.3 * (scale > 1 ? 1.3 : 1));
      if (headRef.current) headRef.current.rotation.x = 0.2;
      if (lightRef.current) lightRef.current.intensity = (scale > 1 ? 0.5 : 0.4) + Math.sin(t * 3) * 0.3;
      groupRef.current.position.set(position[0], position[1], position[2]);
    } else if (status === "idle") {
      groupRef.current.position.set(position[0], position[1] + Math.sin(t * 1.5) * 0.05, position[2]);
      if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.8) * 0.3;
      if (lightRef.current) lightRef.current.intensity = 0.3;
    } else {
      groupRef.current.position.set(position[0], position[1] + Math.sin(t * 0.5) * 0.02, position[2]);
      if (lightRef.current) lightRef.current.intensity = 0;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Luz de status */}
      {status === "working" && (
        <pointLight ref={lightRef} color="#22c55e" intensity={0.5} distance={3} position={[0, 1.8, 0]} />
      )}
      {status === "idle" && (
        <pointLight ref={lightRef} color="#f59e0b" intensity={0.3} distance={2.5} position={[0, 1.8, 0]} />
      )}

      {/* Cabeça */}
      <mesh ref={headRef} position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Cabelo — feminino longo ou masculino curto */}
      {isFemale ? (
        <>
          {/* Topo */}
          <mesh position={[0, 1.78, 0]}>
            <boxGeometry args={[0.54, 0.14, 0.54]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {/* Lateral esquerda descendo */}
          <mesh position={[-0.27, 1.45, 0]}>
            <boxGeometry args={[0.08, 0.5, 0.48]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {/* Lateral direita descendo */}
          <mesh position={[0.27, 1.45, 0]}>
            <boxGeometry args={[0.08, 0.5, 0.48]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {/* Trás descendo */}
          <mesh position={[0, 1.35, -0.27]}>
            <boxGeometry args={[0.52, 0.6, 0.1]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 1.78, 0]}>
          <boxGeometry args={[0.52, 0.12, 0.52]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}

      {/* Olho esquerdo */}
      <mesh position={[-0.12, 1.52, 0.26]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Olho direito */}
      <mesh position={[0.12, 1.52, 0.26]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Corpo */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      {/* Braço esquerdo */}
      <mesh ref={leftArmRef} position={[-0.38, 0.95, 0]}>
        <boxGeometry args={[0.2, 0.65, 0.25]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {/* Braço direito */}
      <mesh ref={rightArmRef} position={[0.38, 0.95, 0]}>
        <boxGeometry args={[0.2, 0.65, 0.25]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {/* Perna esquerda */}
      <mesh position={[-0.15, 0.3, 0]} castShadow>
        <boxGeometry args={[0.22, 0.6, 0.25]} />
        <meshStandardMaterial color="#0f1f2f" />
      </mesh>
      {/* Perna direita */}
      <mesh position={[0.15, 0.3, 0]} castShadow>
        <boxGeometry args={[0.22, 0.6, 0.25]} />
        <meshStandardMaterial color="#0f1f2f" />
      </mesh>
    </group>
  );
}

// ── Room ───────────────────────────────────────────────────────────────────

interface RoomProps {
  position: [number, number, number];
  size?: number;
  floorColor?: string;
  label: string;
  role: string;
  isCEO?: boolean;
  onClick: () => void;
  status: string;
  agentColor: string;
  bodyColor: string;
  hairColor?: string;
  isFemale?: boolean;
  charScale?: number;
  bookshelf?: boolean;
}

function Room({
  position,
  size = 10,
  floorColor = "#C8A97A",
  label,
  role,
  isCEO = false,
  onClick,
  status,
  agentColor,
  bodyColor,
  hairColor,
  isFemale = false,
  charScale = 1.0,
  bookshelf = false,
}: RoomProps) {
  const statusColor = STATUS_COLORS[status] || "#9ca3af";
  const half = size / 2;

  // Wall heights — reduced to 2.8 so characters are visible isometrically
  const wallH = 2.8;
  const wallY = 1.4;

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Borda do piso */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[size + 0.4, 0.28, size + 0.4]} />
        <meshStandardMaterial color="#9A7A5A" roughness={0.9} />
      </mesh>
      {/* Piso */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[size, 0.3, size]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      {/* ── Paredes de pedra ── */}

      {/* Parede fundo (Z negativo) — #707070 */}
      <mesh position={[0, wallY, -half]}>
        <boxGeometry args={[size, wallH, 0.4]} />
        <meshStandardMaterial color="#707070" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Blocos de pedra — linhas horizontais na parede fundo */}
      {[0.7, 1.4, 2.1].map((y, i) => (
        <mesh key={`hb-${i}`} position={[0, y, -half + 0.21]}>
          <boxGeometry args={[size - 0.1, 0.04, 0.02]} />
          <meshStandardMaterial color="#555555" />
        </mesh>
      ))}
      {/* Linhas verticais na parede fundo */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={`vb-${i}`} position={[x, 1.0, -half + 0.21]}>
          <boxGeometry args={[0.04, 1.3, 0.02]} />
          <meshStandardMaterial color="#555555" />
        </mesh>
      ))}

      {/* Parede frente (Z positivo) com gap de porta — #6A6A6A */}
      <mesh position={[-half * 0.4, wallY, half]}>
        <boxGeometry args={[size * 0.3, wallH, 0.4]} />
        <meshStandardMaterial color="#6A6A6A" roughness={0.95} metalness={0.0} />
      </mesh>
      <mesh position={[half * 0.4, wallY, half]}>
        <boxGeometry args={[size * 0.3, wallH, 0.4]} />
        <meshStandardMaterial color="#6A6A6A" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Parede esquerda (X negativo) com gap de porta — #686868 */}
      <mesh position={[-half, wallY, -half * 0.4]}>
        <boxGeometry args={[0.4, wallH, size * 0.3]} />
        <meshStandardMaterial color="#686868" roughness={0.95} metalness={0.0} />
      </mesh>
      <mesh position={[-half, wallY, half * 0.4]}>
        <boxGeometry args={[0.4, wallH, size * 0.3]} />
        <meshStandardMaterial color="#686868" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Parede direita (X positivo) com gap de porta — #646464 */}
      <mesh position={[half, wallY, -half * 0.4]}>
        <boxGeometry args={[0.4, wallH, size * 0.3]} />
        <meshStandardMaterial color="#646464" roughness={0.95} metalness={0.0} />
      </mesh>
      <mesh position={[half, wallY, half * 0.4]}>
        <boxGeometry args={[0.4, wallH, size * 0.3]} />
        <meshStandardMaterial color="#646464" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Mesa */}
      <mesh position={[0, 1.15, -half + 2]} castShadow>
        <boxGeometry args={[3, 0.3, 2]} />
        <meshStandardMaterial color="#8B6914" roughness={0.7} />
      </mesh>
      {/* Pernas da mesa */}
      <mesh position={[-1.2, 0.6, -half + 1.2]}>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#6B4F10" roughness={0.8} />
      </mesh>
      <mesh position={[1.2, 0.6, -half + 1.2]}>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#6B4F10" roughness={0.8} />
      </mesh>
      <mesh position={[-1.2, 0.6, -half + 2.8]}>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#6B4F10" roughness={0.8} />
      </mesh>
      <mesh position={[1.2, 0.6, -half + 2.8]}>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#6B4F10" roughness={0.8} />
      </mesh>
      {/* Monitor */}
      <mesh position={[0, 1.85, -half + 1.5]}>
        <boxGeometry args={[1.5, 1, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Tela do monitor */}
      <mesh position={[0, 1.85, -half + 1.44]}>
        <boxGeometry args={[1.3, 0.82, 0.05]} />
        <meshStandardMaterial color={agentColor} emissive={agentColor} emissiveIntensity={0.3} />
      </mesh>

      {/* Indicador de status */}
      <mesh position={[half - 0.5, wallH, -half + 0.5]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={2} />
      </mesh>

      {/* ── Ornamentações ── */}
      {/* Planta — canto direito */}
      <Plant position={[half - 1, 0.15, half - 1]} />
      {/* Sala CEO: segunda planta no canto esquerdo */}
      {isCEO && <Plant position={[-half + 1, 0.15, half - 1]} />}

      {/* Quadro na parede fundo */}
      <WallPicture
        position={[1.5, 1.8, -half + 0.3]}
        color={isCEO ? "#D4AF37" : agentColor}
      />

      {/* Prateleira com livros (salas laterais) */}
      {bookshelf && (
        <>
          <mesh position={[-half + 0.8, 1.5, 1]}>
            <boxGeometry args={[0.15, 1.2, 1.2]} />
            <meshStandardMaterial color="#8B6914" roughness={0.8} />
          </mesh>
          {["#cc2222", "#2255cc", "#22aa44", "#ccaa22", "#8822cc"].map((c, i) => (
            <mesh key={i} position={[-half + 0.73, 0.95 + i * 0.22, 0.7 + (i % 2) * 0.3]}>
              <boxGeometry args={[0.12, 0.2, 0.12]} />
              <meshStandardMaterial color={c} roughness={0.7} />
            </mesh>
          ))}
        </>
      )}

      {/* Plaquinha do cargo */}
      <Html position={[0, 0.9, -half + 3.8]} center>
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #D4AF37",
            borderRadius: 4,
            padding: "2px 8px",
            color: "#D4AF37",
            fontSize: isCEO ? 13 : 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          {role}
        </div>
      </Html>

      {/* Personagem Voxel */}
      <VoxelCharacter
        skinColor="#F5CBA7"
        bodyColor={bodyColor}
        hairColor={hairColor}
        isFemale={isFemale}
        status={status}
        position={[0, 0.45, -half + 3.5]}
        scale={charScale * 2.5}
      />

      {/* Nome do agente */}
      <Html position={[0, wallH + 2.5, 0]} center>
        <div
          style={{
            color: "#fff",
            fontSize: isCEO ? 14 : 12,
            fontWeight: 700,
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

// ── Corridor ───────────────────────────────────────────────────────────────

function Corridor({ position, rotation = [0, 0, 0], length = 10 }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  length?: number;
}) {
  return (
    <group position={position} rotation={rotation as [number, number, number]}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[3, 0.25, length]} />
        <meshStandardMaterial color="#B8956A" roughness={0.85} />
      </mesh>
      <mesh position={[-1.7, 0, 0]}>
        <boxGeometry args={[0.2, 0.3, length]} />
        <meshStandardMaterial color="#8A6A46" roughness={0.9} />
      </mesh>
      <mesh position={[1.7, 0, 0]}>
        <boxGeometry args={[0.2, 0.3, length]} />
        <meshStandardMaterial color="#8A6A46" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── OfficeScene ────────────────────────────────────────────────────────────

function OfficeScene({ agents, onSelect }: { agents: AgentData[]; onSelect: (a: AgentData) => void }) {
  const getAgent = (id: string) => agents.find((a) => a.id === id) || agents[0];

  return (
    <>
      <ambientLight intensity={2} />
      <directionalLight position={[20, 40, 20]} intensity={2} castShadow />
      <directionalLight position={[-15, 20, -15]} intensity={0.8} />

      {/* Chão geral */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[60, 0.1, 60]} />
        <meshStandardMaterial color="#2a2a2a" roughness={1} />
      </mesh>

      {/* ── SALA CEO — Mariana ── */}
      {(() => {
        const a = getAgent("mariana");
        return (
          <Room
            position={[0, 0, 0]}
            size={12}
            floorColor="#D4B896"
            label={a.name}
            role={a.role}
            isCEO
            onClick={() => onSelect(a)}
            status={a.status}
            agentColor={a.color}
            bodyColor="#1a1a4a"
            hairColor="#5a2a10"
            isFemale
            charScale={1.2}
          />
        );
      })()}

      {/* ── SALA Atena — [-12, 0, -12] ── */}
      {(() => {
        const a = getAgent("atena");
        return (
          <Room
            position={[-12, 0, -12]}
            label={a.name}
            role={a.role}
            onClick={() => onSelect(a)}
            status={a.status}
            agentColor={a.color}
            bodyColor="#4a2a6a"
            hairColor="#1a1a1a"
            isFemale
            bookshelf
          />
        );
      })()}

      {/* ── SALA Hefesto — [12, 0, -12] ── */}
      {(() => {
        const a = getAgent("hefesto");
        return (
          <Room
            position={[12, 0, -12]}
            label={a.name}
            role={a.role}
            onClick={() => onSelect(a)}
            status={a.status}
            agentColor={a.color}
            bodyColor="#6a2a0a"
            hairColor="#2a1a0a"
            bookshelf
          />
        );
      })()}

      {/* ── SALA Afrodite — [-12, 0, 0] ── */}
      {(() => {
        const a = getAgent("afrodite");
        return (
          <Room
            position={[-12, 0, 0]}
            label={a.name}
            role={a.role}
            onClick={() => onSelect(a)}
            status={a.status}
            agentColor={a.color}
            bodyColor="#6a1a3a"
            hairColor="#D4AF37"
            isFemale
          />
        );
      })()}

      {/* ── SALA Apollo — [12, 0, 0] ── */}
      {(() => {
        const a = getAgent("apollo");
        return (
          <Room
            position={[12, 0, 0]}
            label={a.name}
            role={a.role}
            onClick={() => onSelect(a)}
            status={a.status}
            agentColor={a.color}
            bodyColor="#1a4a2a"
            hairColor="#C8A96A"
          />
        );
      })()}

      {/* ── SALA Hera — [-12, 0, 12] ── */}
      {(() => {
        const a = getAgent("hera");
        return (
          <Room
            position={[-12, 0, 12]}
            label={a.name}
            role={a.role}
            onClick={() => onSelect(a)}
            status={a.status}
            agentColor={a.color}
            bodyColor="#0a3a4a"
            hairColor="#4a1a1a"
            isFemale
          />
        );
      })()}

      {/* ── SALA Ares — [0, 0, 12] ── */}
      {(() => {
        const a = getAgent("ares");
        return (
          <Room
            position={[0, 0, 12]}
            label={a.name}
            role={a.role}
            onClick={() => onSelect(a)}
            status={a.status}
            agentColor={a.color}
            bodyColor="#4a1a1a"
            hairColor="#1a1a1a"
          />
        );
      })()}

      {/* ── SALA Héstia — [12, 0, 12] ── */}
      {(() => {
        const a = getAgent("hestia");
        return (
          <Room
            position={[12, 0, 12]}
            label={a.name}
            role={a.role}
            onClick={() => onSelect(a)}
            status={a.status}
            agentColor={a.color}
            bodyColor="#3a1a6a"
            hairColor="#8B4513"
            isFemale
            bookshelf
          />
        );
      })()}

      {/* ── CORREDORES ── */}
      <Corridor position={[-6, 0, -12]} rotation={[0, Math.PI / 2, 0]} length={10} />
      <Corridor position={[-12, 0, -6]} length={10} />
      <Corridor position={[6, 0, -12]} rotation={[0, Math.PI / 2, 0]} length={10} />
      <Corridor position={[12, 0, -6]} length={10} />
      <Corridor position={[-6, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={10} />
      <Corridor position={[6, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={10} />
      <Corridor position={[-12, 0, 6]} length={10} />
      <Corridor position={[-6, 0, 12]} rotation={[0, Math.PI / 2, 0]} length={10} />
      <Corridor position={[0, 0, 6]} length={10} />
      <Corridor position={[12, 0, 6]} length={10} />
      <Corridor position={[6, 0, 12]} rotation={[0, Math.PI / 2, 0]} length={10} />
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

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
    ])
      .then(([statuses, tasks]) => {
        const statusMap: Record<string, string> = {};
        if (Array.isArray(statuses))
          statuses.forEach((s: { agent_id: string; status: string }) => {
            statusMap[s.agent_id] = s.status;
          });
        const taskMap: Record<string, string> = {};
        if (Array.isArray(tasks))
          tasks.forEach((t: { agent_id: string; title: string }) => {
            if (!taskMap[t.agent_id]) taskMap[t.agent_id] = t.title;
          });
        setAgents(
          AGENTS_STATIC.map((a) => ({
            ...a,
            status: statusMap[a.id] || "standby",
            activeTask: taskMap[a.id],
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas
        shadows
        camera={{ position: [30, 35, 30], fov: 35 }}
        gl={{ antialias: true }}
        style={{ width: "100%", height: "100%", background: "#0A0A0A" }}
      >
        <color attach="background" args={["#0A0A0A"]} />
        <Suspense fallback={null}>
          <OfficeScene agents={agents} onSelect={setSelected} />
        </Suspense>
        <OrbitControls
          enableRotate={false}
          enablePan
          enableZoom
          minDistance={10}
          maxDistance={80}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Painel lateral */}
      {selected && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 300,
            height: "100%",
            background: "#111",
            borderLeft: "1px solid #2a2a2a",
            padding: "24px 20px",
            overflowY: "auto",
            color: "#F5F5F5",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setSelected(null)}
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
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: selected.color,
              marginBottom: 16,
            }}
          />
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{selected.name}</h2>
          <p style={{ fontSize: 13, color: "#D4AF37", margin: "0 0 20px" }}>{selected.role}</p>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#888" }}>Status</span>
            <span
              style={{
                fontSize: 13,
                color: STATUS_COLORS[selected.status] || "#9ca3af",
                fontWeight: 500,
              }}
            >
              {selected.status}
            </span>
          </div>
          {selected.activeTask && (
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                padding: 12,
                marginTop: 8,
              }}
            >
              <p style={{ fontSize: 11, color: "#888", margin: "0 0 6px", textTransform: "uppercase" }}>
                Task Ativa
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>{selected.activeTask}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
