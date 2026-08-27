import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════
export interface StaticBlock {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  color: string;
  type?: 'normal' | 'goal' | 'checkpoint';
}

export interface SpinnerBlock {
  x: number; y: number; z: number;
  length: number;
  height: number;
  speed: number;
  color: string;
  axis: 'y' | 'x';
}

export interface MovingBlock {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  color: string;
  axis: 'x' | 'y' | 'z';
  amp: number;
  speed: number;
  phase: number;
}

export interface JumpPadBlock {
  x: number; y: number; z: number;
  power: number;
}

export interface Checkpoint {
  x: number; y: number; z: number;
}

export interface TowerData {
  staticBlocks: StaticBlock[];
  spinners: SpinnerBlock[];
  movingBlocks: MovingBlock[];
  jumpPads: JumpPadBlock[];
  checkpoints: Checkpoint[];
  spawnPoint: { x: number; y: number; z: number };
}

// ═══════════════════════════════════════════
//  타워 생성 (9 스테이지)
// ═══════════════════════════════════════════
export function buildTower(): TowerData {
  const staticBlocks: StaticBlock[] = [];
  const spinners: SpinnerBlock[] = [];
  const movingBlocks: MovingBlock[] = [];
  const jumpPads: JumpPadBlock[] = [];
  const checkpoints: Checkpoint[] = [];

  // ── [0] 시작 로비 ──
  staticBlocks.push({ x: 0, y: 0.5, z: 0, w: 14, h: 1, d: 14, color: '#e8eaf6', type: 'checkpoint' });
  staticBlocks.push({ x: 0, y: 1.5, z: -7.2, w: 14, h: 1.6, d: 0.5, color: '#42a5f5' });
  staticBlocks.push({ x: -7.2, y: 1.5, z: 0, w: 0.5, h: 1.6, d: 14, color: '#42a5f5' });
  staticBlocks.push({ x: 7.2, y: 1.5, z: 0, w: 0.5, h: 1.6, d: 14, color: '#42a5f5' });
  checkpoints.push({ x: 0, y: 1, z: 0 });

  // ── [1] 완만한 계단 발판 (초보자 친화) ──
  // 로비 바닥은 y=1 (블록 y=0.5, 높이 1)
  // 각 발판: 세로 +0.6m, 앞으로 2.6m → 아주 쉬운 점프
  let y = 1.6;
  for (let i = 0; i < 7; i++) {
    staticBlocks.push({
      x: i % 2 === 0 ? -1.2 : 1.2,   // 지그재그 폭 축소 (1.8 → 1.2)
      y: y + i * 0.6,                 // 높이 간격 축소 (0.9 → 0.6)
      z: 9 + i * 2.6,                 // 앞뒤 간격 축소 (3.5 → 2.6)
      w: 3, h: 0.5, d: 3,             // 발판 크기 확대 (2.2 → 3)
      color: '#43a047',
    });
  }
  y = y + 6 * 0.6 + 0.6;
  staticBlocks.push({ x: 0, y: y, z: 30, w: 7, h: 0.5, d: 7, color: '#fdd835', type: 'checkpoint' });
  checkpoints.push({ x: 0, y: y + 0.75, z: 30 });

  // ── [2] 회전 톱날 다리 ──
  // ── [2] 회전 톱날 다리 (다리 넓힘, 톱날 느려짐) ──
  y += 1;
  const bridge2Z = 35;
  staticBlocks.push({ x: 0, y: y, z: bridge2Z + 9, w: 4.5, h: 0.5, d: 20, color: '#78909c' });
  for (let i = 0; i < 3; i++) {
    spinners.push({
      x: 0, y: y + 1.3, z: bridge2Z + 4 + i * 6,
      length: 4.5, height: 0.4,      // 톱날 짧게 (5.5 → 4.5)
      speed: 1.1 + i * 0.2,          // 속도 감소 (1.8 → 1.1)
      color: '#e53935',
      axis: 'y',
    });
  }
  y += 1.5;
  staticBlocks.push({ x: 0, y: y, z: bridge2Z + 22, w: 7, h: 0.5, d: 7, color: '#fdd835', type: 'checkpoint' });
  checkpoints.push({ x: 0, y: y + 0.75, z: bridge2Z + 22 });

  // ── [3] 좌우 스윙 벽 ──
  // ── [3] 좌우 스윙 벽 (더 넓은 다리, 느린 벽) ──
  y += 1.2;
  const z3 = bridge2Z + 27;
  staticBlocks.push({ x: 0, y: y, z: z3 + 9, w: 6, h: 0.5, d: 20, color: '#607d8b' });
  for (let i = 0; i < 3; i++) {
    movingBlocks.push({
      x: 0, y: y + 1.6, z: z3 + 4 + i * 6,
      w: 3, h: 2.6, d: 0.7,           // 벽 폭 축소 (4 → 3, 빈틈 넓어짐)
      color: '#ff5722',
      axis: 'x', amp: 2.5, speed: 0.9, phase: i * 1.5,  // 속도 감소
    });
  }
  y += 1.5;
  staticBlocks.push({ x: 0, y: y, z: z3 + 22, w: 7, h: 0.5, d: 7, color: '#fdd835', type: 'checkpoint' });
  checkpoints.push({ x: 0, y: y + 0.75, z: z3 + 22 });

  // ── [4] 위아래 엘리베이터 발판 ──
  // ── [4] 위아래 엘리베이터 발판 (더 크고 느리게) ──
  y += 1.2;
  const z4 = z3 + 27;
  for (let i = 0; i < 4; i++) {
    movingBlocks.push({
      x: 0, y: y, z: z4 + i * 3.8,     // 간격 축소 (4.5 → 3.8)
      w: 4, h: 0.5, d: 4,               // 발판 확대 (3 → 4)
      color: '#8e24aa',
      axis: 'y', amp: 1.2, speed: 0.8, phase: i * 1.6,  // 진폭·속도 감소
    });
  }
  y += 1.5;
  staticBlocks.push({ x: 0, y: y, z: z4 + 18, w: 7, h: 0.5, d: 7, color: '#fdd835', type: 'checkpoint' });
  checkpoints.push({ x: 0, y: y + 0.75, z: z4 + 18 });

  // ── [5] 점프 패드 부스터 ──
  // ── [5] 점프 패드 부스터 (착지 발판 크게) ──
  y += 1;
  const z5 = z4 + 24;
  staticBlocks.push({ x: 0, y: y, z: z5, w: 6, h: 0.5, d: 6, color: '#546e7a' });
  jumpPads.push({ x: 0, y: y + 0.3, z: z5, power: 22 });

  staticBlocks.push({ x: 0, y: y + 6, z: z5 + 7, w: 7, h: 0.5, d: 7, color: '#546e7a' });
  jumpPads.push({ x: 0, y: y + 6.3, z: z5 + 7, power: 20 });

  y += 11;
  staticBlocks.push({ x: 0, y: y, z: z5 + 14, w: 7, h: 0.5, d: 7, color: '#fdd835', type: 'checkpoint' });
  checkpoints.push({ x: 0, y: y + 0.75, z: z5 + 14 });

  // ── [6] 좁은 외나무 다리 ──
  // ── [6] 외나무 다리 (조금 넓힘) ──
  y += 1;
  const z6 = z5 + 19;
  staticBlocks.push({ x: 0, y: y, z: z6 + 7, w: 2.2, h: 0.5, d: 14, color: '#8d6e63' }); // 1.4 → 2.2
  y += 0.8;
  staticBlocks.push({ x: 0, y: y, z: z6 + 17, w: 7, h: 0.5, d: 7, color: '#fdd835', type: 'checkpoint' });
  checkpoints.push({ x: 0, y: y + 0.75, z: z6 + 17 });

  // ── [7] 수평 회전 롤러 톱날 ──
  // ── [7] 수평 회전 톱날 (느리고 짧게) ──
  y += 1.5;
  const z7 = z6 + 22;
  staticBlocks.push({ x: 0, y: y, z: z7 + 8, w: 6, h: 0.5, d: 18, color: '#607d8b' });
  for (let i = 0; i < 3; i++) {
    spinners.push({
      x: 0, y: y + 2.2, z: z7 + 4 + i * 5.5,
      length: 3.5, height: 0.4,     // 짧게 (4.5 → 3.5)
      speed: 0.9 + i * 0.2,          // 느리게 (1.3 → 0.9)
      color: '#c62828',
      axis: 'x',
    });
  }
  y += 1.5;
  staticBlocks.push({ x: 0, y: y, z: z7 + 20, w: 7, h: 0.5, d: 7, color: '#fdd835', type: 'checkpoint' });
  checkpoints.push({ x: 0, y: y + 0.75, z: z7 + 20 });

  // ── [8] 무지개 나선 계단 ──
  // ── [8] 무지개 나선 계단 (촘촘하고 완만하게) ──
  y += 1;
  const z8 = z7 + 26;
  const steps = 20;                  // 계단 수 증가 (16 → 20)
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 3;
    const r = 5.5;
    staticBlocks.push({
      x: Math.cos(angle) * r,
      y: y + i * 0.5,                // 계단 높이 축소 (0.75 → 0.5)
      z: z8 + Math.sin(angle) * r,
      w: 3.2, h: 0.4, d: 3.2,        // 계단 확대 (2.6 → 3.2)
      color: `hsl(${Math.round(i * 18)}, 75%, 55%)`,
    });
  }
  y += steps * 0.5 + 0.8;
  staticBlocks.push({ x: 5.5, y: y, z: z8, w: 7, h: 0.5, d: 7, color: '#fdd835', type: 'checkpoint' });
  checkpoints.push({ x: 5.5, y: y + 0.75, z: z8 });

  // ── [9] 마지막 이동 발판 → 🏆 골인 ──
  // ── [9] 마지막 이동 발판 (크고 느리게) ──
  y += 1.2;
  for (let i = 0; i < 5; i++) {
    movingBlocks.push({
      x: 5.5 + (i + 1) * 2.8, y: y, z: z8,   // 간격 축소 (3.2 → 2.8)
      w: 3, h: 0.5, d: 3.2,                   // 발판 확대
      color: '#00acc1',
      axis: 'y', amp: 0.9, speed: 1.1, phase: i * 1.0,  // 진폭·속도 감소
    });
  }

  const goalX = 5.5 + 6 * 2.8 + 2;
  const goalY = y + 0.8;
  staticBlocks.push({ x: goalX, y: goalY, z: z8, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  staticBlocks.push({ x: goalX, y: goalY + 3.5, z: z8, w: 0.7, h: 7, d: 0.7, color: '#ffab00' });
  checkpoints.push({ x: goalX, y: goalY + 0.8, z: z8 });

  return {
    staticBlocks,
    spinners,
    movingBlocks,
    jumpPads,
    checkpoints,
    spawnPoint: { x: 0, y: 1, z: 0 },
  };
}

// ═══════════════════════════════════════════
//  렌더링 컴포넌트
// ═══════════════════════════════════════════

export function StaticBlockMesh({ block }: { block: StaticBlock }) {
  const isGoal = block.type === 'goal';
  const isCp = block.type === 'checkpoint';
  // 성능: 정적 블록은 그림자를 "받기만" 함 (castShadow 제거 → 모바일 부하 대폭 감소)
  return (
    <mesh position={[block.x, block.y, block.z]} receiveShadow>
      <boxGeometry args={[block.w, block.h, block.d]} />
      <meshStandardMaterial
        color={block.color}
        emissive={isGoal ? '#ffab00' : isCp ? '#ffc107' : '#000000'}
        emissiveIntensity={isGoal ? 0.45 : isCp ? 0.25 : 0}
      />
    </mesh>
  );
}

export function SpinnerMesh({ spinner }: { spinner: SpinnerBlock }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * spinner.speed;
    if (spinner.axis === 'x') ref.current.rotation.x = t;
    else ref.current.rotation.y = t;
  });
  return (
    <group ref={ref} position={[spinner.x, spinner.y, spinner.z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.28, 1.6, 8]} />
        <meshStandardMaterial color="#37474f" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[spinner.length, spinner.height, 0.45]} />
        <meshStandardMaterial color={spinner.color} emissive={spinner.color} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[spinner.length / 2 - 0.25, 0, 0]}>
        <boxGeometry args={[0.5, spinner.height + 0.25, 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-spinner.length / 2 + 0.25, 0, 0]}>
        <boxGeometry args={[0.5, spinner.height + 0.25, 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export function MovingBlockMesh({
  block,
  meshRef,
}: {
  block: MovingBlock;
  meshRef: { current: THREE.Mesh | null };
}) {
  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const off = Math.sin(state.clock.elapsedTime * block.speed + block.phase) * block.amp;
    m.position.set(
      block.x + (block.axis === 'x' ? off : 0),
      block.y + (block.axis === 'y' ? off : 0),
      block.z + (block.axis === 'z' ? off : 0),
    );
  });
  return (
    <mesh
      ref={(el) => { meshRef.current = el; }}
      position={[block.x, block.y, block.z]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[block.w, block.h, block.d]} />
      <meshStandardMaterial color={block.color} />
    </mesh>
  );
}

export function JumpPadMesh({ pad }: { pad: JumpPadBlock }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.18;
    }
  });
  return (
    <group position={[pad.x, pad.y, pad.z]}>
      <mesh ref={ref}>
        <cylinderGeometry args={[1.5, 1.7, 0.3, 16]} />
        <meshStandardMaterial color="#ffd54a" emissive="#ffb300" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.06, 16]} />
        <meshStandardMaterial color="#ff6d00" emissive="#ff9800" emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
}
