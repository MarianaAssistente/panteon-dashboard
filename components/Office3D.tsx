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

// ── Room positions for delegation animation ────────────────────────────────

const ROOM_POSITIONS: Record<string, [number, number, number]> = {
  mariana:  [0, 0, 0],
  atena:    [-12, 0, -12],
  hefesto:  [12, 0, -12],
  afrodite: [-12, 0, 0],
  apollo:   [12, 0, 0],
  hera:     [-12, 0, 12],
  ares:     [0, 0, 12],
  hestia:   [12, 0, 12],
};

function getWaypoints(targetId: string): [number, number, number][] {
  const target = ROOM_POSITIONS[targetId];
  if (!target) return [];
  const mid: [number, number, number] = [target[0] / 2, 0, target[2] / 2];
  return [
    [0, 0.45, 3],
    mid,
    [target[0], 0.45, target[2] + (target[2] >= 0 ? -3 : 3)],
    mid,
    [0, 0.45, 3],
  ];
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
  isWalking = false,
}: {
  skinColor: string;
  bodyColor: string;
  hairColor?: string;
  isFemale?: boolean;
  status: string;
  position: [number, number, number];
  scale?: number;
  isWalking?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;

    if (isWalking) {
      groupRef.current.rotation.z = Math.sin(t * 8) * 0.02;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 8) * 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * 8 + Math.PI) * 0.4;
      return;
    }

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
  hideCharacter?: boolean;
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
  hideCharacter = false,
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

      {/* ── Indicadores de status visíveis ── */}

      {/* Aura no piso — anel colorido ao redor da sala */}
      <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size / 2 - 0.3, size / 2 + 0.1, 32]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={status === "working" ? 1.5 : 0.4} transparent opacity={status === "standby" ? 0.15 : 0.6} side={2} />
      </mesh>

      {/* Luz colorida sobre a sala */}
      <pointLight
        position={[0, wallH + 1, 0]}
        color={statusColor}
        intensity={status === "working" ? 2.5 : status === "idle" ? 1.2 : 0.2}
        distance={size + 2}
      />

      {/* Badge de status flutuante acima do personagem */}
      <Html position={[0, wallH - 0.2, 0]} center>
        <div style={{
          background: statusColor,
          color: "#000",
          fontSize: 10,
          fontWeight: 800,
          padding: "2px 8px",
          borderRadius: 10,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: `0 0 8px ${statusColor}`,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {status === "working" ? "⚡ Ativo" : status === "idle" ? "⏸ Ocioso" : "💤 Standby"}
        </div>
      </Html>

      {/* Esfera de status (canto) — mantida mas maior */}
      <mesh position={[half - 0.5, wallH, -half + 0.5]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={3} />
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

      {/* Personagem Voxel — oculto durante delegação */}
      {!hideCharacter && (
        <VoxelCharacter
          skinColor="#F5CBA7"
          bodyColor={bodyColor}
          hairColor={hairColor}
          isFemale={isFemale}
          status={status}
          position={[0, 0.45, -half + 3.5]}
          scale={charScale * 2.5}
        />
      )}

      {/* Nome do agente */}
      <Html position={[0, wallH + 0.8, 0]} center>
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

// ── DelegationWalker ───────────────────────────────────────────────────────

function DelegationWalker({ waypoints, onComplete }: {
  waypoints: [number, number, number][];
  onComplete: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const segmentRef = useRef(0);
  const doneRef = useRef(false);
  const SPEED = 4;

  useFrame((_, delta) => {
    if (doneRef.current) return;
    if (!groupRef.current || segmentRef.current >= waypoints.length - 1) {
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete();
      }
      return;
    }

    const from = waypoints[segmentRef.current];
    const to = waypoints[segmentRef.current + 1];
    const dist = Math.sqrt((to[0] - from[0]) ** 2 + (to[2] - from[2]) ** 2) || 0.001;

    progressRef.current += (SPEED * delta) / dist;

    if (progressRef.current >= 1) {
      progressRef.current = 0;
      segmentRef.current += 1;
      if (segmentRef.current >= waypoints.length - 1) {
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete();
        }
        return;
      }
    }

    const p = progressRef.current;
    groupRef.current.position.set(
      from[0] + (to[0] - from[0]) * p,
      from[1],
      from[2] + (to[2] - from[2]) * p
    );

    const angle = Math.atan2(to[0] - from[0], to[2] - from[2]);
    groupRef.current.rotation.y = angle;
  });

  return (
    <group ref={groupRef} position={waypoints[0]}>
      <VoxelCharacter
        skinColor="#F5CBA7"
        bodyColor="#1a1a4a"
        hairColor="#5a2a10"
        isFemale
        status="working"
        position={[0, 0, 0]}
        scale={3.0}
        isWalking
      />
      {/* Envelope/documento que ela carrega */}
      <mesh position={[0.8, 2.5, 0.3]}>
        <boxGeometry args={[0.4, 0.3, 0.05]} />
        <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ── OfficeScene ────────────────────────────────────────────────────────────

function OfficeScene({ agents, onSelect, delegation, onDelegationComplete }: {
  agents: AgentData[];
  onSelect: (a: AgentData) => void;
  delegation: { active: boolean; waypoints: [number,number,number][]; targetName: string; } | null;
  onDelegationComplete: () => void;
}) {
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
            hideCharacter={delegation?.active === true}
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

      {/* Delegação ativa */}
      {delegation?.active && (
        <DelegationWalker
          waypoints={delegation.waypoints}
          onComplete={onDelegationComplete}
        />
      )}
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

const AGENT_DESCRIPTIONS: Record<string, string> = {
  mariana:  "CEO do Panteão. Coordena todos os agentes, decompõe demandas do Yuri, delega tarefas e acompanha entregas. Ponto central de todas as operações.",
  atena:    "CSO — Chief Strategy Officer. Responsável por pesquisas de mercado, análise de dados, benchmarks e inteligência estratégica para todas as verticais.",
  hefesto:  "CTO — Chief Technology Officer. Desenvolve código, landing pages, automações, APIs e infraestrutura técnica do Panteão.",
  apollo:   "CCO — Chief Content Officer. Produz textos, roteiros, e-books, posts e qualquer conteúdo escrito para o Yuri e as verticais.",
  afrodite: "CMO — Chief Marketing Officer. Cria campanhas, copies, briefings e estratégias de marketing para STM Capital e STM Digital.",
  hera:     "COO — Chief Operations Officer. Gerencia processos, prazos, coordenação operacional e fluxos de trabalho entre os agentes.",
  ares:     "CQO — Chief Quality Officer. Revisa entregas, faz QA de código e conteúdo, garante padrão de qualidade antes de ir para o Yuri.",
  hestia:   "CPA — Chief Personal Assistant. Cuida da agenda pessoal do Yuri, viagens, lembretes e tarefas do dia a dia.",
};

const AGENT_MODELS: Record<string, string> = {
  mariana:  "claude-sonnet-4-6",
  atena:    "claude-sonnet-4-6",
  hefesto:  "claude-sonnet-4-6",
  ares:     "claude-sonnet-4-6",
  hera:     "claude-haiku-4-5",
  afrodite: "claude-haiku-4-5",
  apollo:   "claude-haiku-4-5",
  hestia:   "claude-haiku-4-5",
};

interface ActiveTaskItem { code: string; title: string; status: string; updated_at: string; }

export default function Office3D() {
  const [agents, setAgents] = useState<AgentData[]>(
    AGENTS_STATIC.map((a) => ({ ...a, status: "standby" }))
  );
  const [selected, setSelected] = useState<AgentData | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<ActiveTaskItem[]>([]);
  const [showDispatch, setShowDispatch] = useState(false);
  const [dispatchTask, setDispatchTask] = useState("");
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [delegation, setDelegation] = useState<{
    active: boolean;
    waypoints: [number, number, number][];
    targetName: string;
  } | null>(null);

  const triggerDelegation = (agentId: string) => {
    const waypoints = getWaypoints(agentId);
    if (waypoints.length === 0) return;
    setDelegation({ active: true, waypoints, targetName: agentId });
  };

  // Poll for dispatch commands (only last 60 seconds)
  useEffect(() => {
    const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
    const interval = setInterval(async () => {
      try {
        const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/knowledge?code=like.DISPATCH-CMD-*&created_at=gte.${sixtySecondsAgo}&order=created_at.desc&limit=1`,
          { headers }
        );
        const data = await res.json();
        if (data[0]) {
          try {
            const content = JSON.parse(data[0].content || "{}");
            if (content.agent_id) triggerDelegation(content.agent_id);
          } catch {}
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch tasks for selected agent
  useEffect(() => {
    if (!selected) { setSelectedTasks([]); return; }
    const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
    fetch(
      `${SUPABASE_URL}/rest/v1/tasks?agent_id=eq.${selected.id}&status=in.(in_progress,review)&order=updated_at.desc&limit=10`,
      { headers }
    )
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSelectedTasks(data); })
      .catch(() => {});
  }, [selected?.id]);

  async function handleDispatch() {
    if (!selected || !dispatchTask.trim()) return;
    setDispatchLoading(true);
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selected.id, task: dispatchTask }),
      });
      const data = await res.json();
      setDispatchResult({ ok: !!data.ok, message: data.message || data.error || "Enviado" });
    } catch {
      setDispatchResult({ ok: false, message: "Erro de conexão." });
    } finally {
      setDispatchLoading(false);
    }
  }

  const [refreshing, setRefreshing] = useState(false);

  const fetchAgentStatus = async () => {
    setRefreshing(true);
    const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
    try {
      const [statuses, tasks] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/agent_status?select=agent_id,status`, { headers }).then((r) => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/tasks?select=agent_id,title&status=eq.in_progress&order=updated_at.desc`, { headers }).then((r) => r.json()),
      ]);
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
    } catch {}
    finally { setRefreshing(false); }
  };

  useEffect(() => { fetchAgentStatus(); }, []);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Botão atualizar status */}
      <button
        onClick={fetchAgentStatus}
        disabled={refreshing}
        style={{
          position: "absolute", top: 12, right: 12, zIndex: 100,
          background: refreshing ? "rgba(212,175,55,0.4)" : "rgba(212,175,55,0.15)",
          border: "1px solid rgba(212,175,55,0.5)",
          color: "#D4AF37", borderRadius: 8, padding: "6px 14px",
          fontSize: 12, fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
        }}
      >
        <span style={{ display: "inline-block", animation: refreshing ? "spin 1s linear infinite" : "none" }}>↻</span>
        {refreshing ? "Atualizando..." : "Atualizar Status"}
      </button>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Canvas
        shadows
        camera={{ position: [30, 35, 30], fov: 35 }}
        gl={{ antialias: true }}
        style={{ width: "100%", height: "100%", background: "#0A0A0A" }}
      >
        <color attach="background" args={["#0A0A0A"]} />
        <Suspense fallback={null}>
          <OfficeScene
            agents={agents}
            onSelect={setSelected}
            delegation={delegation}
            onDelegationComplete={() => setDelegation(null)}
          />
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

      {/* Banner de delegação */}
      {delegation?.active && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(212,175,55,0.15)",
            border: "1px solid #D4AF37",
            borderRadius: 8,
            padding: "8px 20px",
            color: "#D4AF37",
            fontSize: 13,
            fontWeight: 600,
            zIndex: 5,
            backdropFilter: "blur(4px)",
            pointerEvents: "none",
          }}
        >
          📨 Mariana delegando para {delegation.targetName}...
        </div>
      )}

      {/* Painel lateral */}
      {selected && (
        <div style={{
          position: "absolute", top: 0, right: 0, width: 300, height: "100%",
          background: "linear-gradient(180deg, #0f0f0f 0%, #111 100%)",
          borderLeft: `1px solid ${selected.color}33`,
          overflowY: "auto", color: "#F5F5F5", zIndex: 10,
          display: "flex", flexDirection: "column",
        }}>
          {/* Header com cor do agente */}
          <div style={{
            background: `linear-gradient(135deg, ${selected.color}22 0%, #0f0f0f 100%)`,
            borderBottom: `1px solid ${selected.color}33`,
            padding: "20px 18px 16px",
            position: "relative",
          }}>
            <button onClick={() => { setSelected(null); setShowDispatch(false); setDispatchResult(null); setDispatchTask(""); }}
              style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.05)", border: "1px solid #333", borderRadius: "50%", width: 28, height: 28, color: "#888", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

            {/* Avatar — foto real */}
            <div style={{
              width: 64, height: 64, borderRadius: 16, marginBottom: 12,
              border: `2px solid ${selected.color}66`,
              boxShadow: `0 4px 20px ${selected.color}44`,
              overflow: "hidden", flexShrink: 0,
            }}>
              <img
                src={`/avatars/avatar-${selected.id}.png`}
                alt={selected.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.style.background = selected.color;
                  (e.target as HTMLImageElement).parentElement!.style.display = "flex";
                  (e.target as HTMLImageElement).parentElement!.style.alignItems = "center";
                  (e.target as HTMLImageElement).parentElement!.style.justifyContent = "center";
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="font-size:24px">${selected.name[0]}</span>`;
                }}
              />
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px", color: "#fff" }}>{selected.name}</h2>
            <p style={{ fontSize: 12, color: selected.color, margin: "0 0 6px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{selected.role}</p>
            <p style={{ fontSize: 10, color: "#555", margin: "0 0 10px", fontFamily: "monospace" }}>{AGENT_MODELS[selected.id] || "—"}</p>
            <p style={{ fontSize: 12, color: "#999", margin: 0, lineHeight: 1.5 }}>{AGENT_DESCRIPTIONS[selected.id] || ""}</p>
          </div>

          {/* Corpo */}
          <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Status badge */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#1a1a1a", border: `1px solid ${STATUS_COLORS[selected.status]}33`,
              borderRadius: 10, padding: "10px 14px",
            }}>
              <span style={{ fontSize: 12, color: "#666" }}>Status atual</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: STATUS_COLORS[selected.status] || "#9ca3af",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[selected.status], display: "inline-block", boxShadow: `0 0 6px ${STATUS_COLORS[selected.status]}` }} />
                {selected.status === "working" ? "Ativo" : selected.status === "idle" ? "Ocioso" : "Standby"}
              </span>
            </div>

            {/* Tasks */}
            <div>
              <p style={{ fontSize: 10, color: "#555", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Tasks em andamento
                {selectedTasks.length > 0 && <span style={{ marginLeft: 6, background: selected.color, color: "#000", borderRadius: 10, padding: "1px 7px", fontSize: 10 }}>{selectedTasks.length}</span>}
              </p>
              {selectedTasks.length === 0 ? (
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Nenhuma task ativa</p>
                  {selected.activeTask && <p style={{ fontSize: 11, color: "#555", margin: "4px 0 0", fontStyle: "italic" }}>{selected.activeTask.slice(0, 50)}</p>}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedTasks.map((t) => (
                    <div key={t.code} style={{
                      background: "#1a1a1a", border: "1px solid #252525",
                      borderRadius: 8, padding: "10px 12px",
                      borderLeft: `3px solid ${t.status === "review" ? "#f59e0b" : "#3b82f6"}`,
                    }}>
                      <p style={{ fontSize: 10, color: "#555", margin: "0 0 3px", fontFamily: "monospace" }}>{t.code}</p>
                      <p style={{ fontSize: 12, margin: "0 0 4px", color: "#e5e5e5", lineHeight: 1.4 }}>{t.title}</p>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: t.status === "review" ? "#f59e0b" : "#3b82f6",
                      }}>{t.status === "review" ? "⏳ em revisão" : "🔄 em andamento"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disparar tarefa */}
            <div style={{ marginTop: "auto" }}>
              {!showDispatch ? (
                <button onClick={() => { setShowDispatch(true); setDispatchResult(null); }}
                  style={{
                    width: "100%", padding: "11px 0", borderRadius: 10,
                    background: `linear-gradient(135deg, ${selected.color} 0%, ${selected.color}cc 100%)`,
                    color: "#000", border: "none", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", letterSpacing: "0.03em",
                    boxShadow: `0 4px 15px ${selected.color}44`,
                  }}>
                  ▶ Disparar tarefa
                </button>
              ) : dispatchResult ? (
                <div style={{ textAlign: "center", background: "#1a1a1a", borderRadius: 10, padding: "16px" }}>
                  <p style={{ fontSize: 20, margin: "0 0 6px" }}>{dispatchResult.ok ? "✅" : "❌"}</p>
                  <p style={{ fontSize: 12, color: dispatchResult.ok ? "#22c55e" : "#ef4444", margin: "0 0 12px" }}>{dispatchResult.message}</p>
                  <button onClick={() => { setShowDispatch(false); setDispatchResult(null); setDispatchTask(""); }}
                    style={{ padding: "7px 20px", borderRadius: 8, background: "#2a2a2a", border: "1px solid #333", color: "#aaa", fontSize: 12, cursor: "pointer" }}>Fechar</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea value={dispatchTask} onChange={(e) => setDispatchTask(e.target.value)} rows={3}
                    placeholder="Descreva a tarefa para o agente..."
                    style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#e5e5e5", resize: "none", boxSizing: "border-box", outline: "none" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setShowDispatch(false); setDispatchTask(""); }}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#888", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
                    <button onClick={handleDispatch} disabled={dispatchLoading || !dispatchTask.trim()}
                      style={{ flex: 2, padding: "9px 0", borderRadius: 8, background: selected.color, border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: (dispatchLoading || !dispatchTask.trim()) ? 0.5 : 1 }}>
                      {dispatchLoading ? "Enviando…" : "▶ Enviar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
