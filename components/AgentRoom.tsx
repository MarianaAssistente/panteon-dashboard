"use client";

import { useRef, useState } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const AGENT_COLORS: Record<string, string> = {
  mariana: "#D4AF37",
  atena: "#6366f1",
  hefesto: "#f97316",
  apollo: "#22c55e",
  afrodite: "#ec4899",
  hera: "#06b6d4",
  ares: "#ef4444",
  hestia: "#8b5cf6",
};

const STATUS_COLORS: Record<string, string> = {
  working: "#22c55e",
  idle: "#f59e0b",
  standby: "#6b7280",
  blocked: "#ef4444",
};

interface AgentRoomProps {
  agentId: string;
  name: string;
  role: string;
  status: string;
  activeTask?: string;
  position: [number, number, number];
  onClick: () => void;
}

export default function AgentRoom({
  agentId,
  name,
  role,
  status,
  activeTask,
  position,
  onClick,
}: AgentRoomProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const agentColor = AGENT_COLORS[agentId] || "#888888";
  const statusColor = STATUS_COLORS[status] || "#6b7280";

  useFrame((_, delta) => {
    if (groupRef.current) {
      const targetScale = hovered ? 1.05 : 1.0;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 5
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Piso */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[5, 0.1, 5]} />
        <meshStandardMaterial color={agentColor} opacity={0.3} transparent />
      </mesh>

      {/* Paredes laterais sutis */}
      <mesh position={[0, 1.5, -2.5]}>
        <boxGeometry args={[5, 3, 0.05]} />
        <meshStandardMaterial color={agentColor} opacity={0.08} transparent />
      </mesh>
      <mesh position={[-2.5, 1.5, 0]}>
        <boxGeometry args={[0.05, 3, 5]} />
        <meshStandardMaterial color={agentColor} opacity={0.08} transparent />
      </mesh>

      {/* Avatar — esfera com cor do agente */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={agentColor}
          emissive={agentColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Luz de status */}
      <pointLight
        position={[0, 2.5, 0]}
        color={statusColor}
        intensity={status === "working" ? 1.5 : 0.3}
        distance={4}
      />

      {/* Indicador de status — pequena esfera */}
      <mesh position={[0.8, 1.7, 0.8]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={1}
        />
      </mesh>

      {/* Nome */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.35}
        color="#F5F5F5"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

      {/* Cargo */}
      <Text
        position={[0, 1.75, 0]}
        fontSize={0.22}
        color="#D4AF37"
        anchorX="center"
        anchorY="middle"
      >
        {role}
      </Text>

      {/* Task ativa */}
      {activeTask && (
        <Text
          position={[0, 0.3, 2.4]}
          fontSize={0.18}
          color="#F5F5F5"
          maxWidth={4}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
        >
          {activeTask.slice(0, 40)}
        </Text>
      )}
    </group>
  );
}
