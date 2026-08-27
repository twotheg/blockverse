import { useMemo } from 'react';
import * as THREE from 'three';

interface BuildingProps {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  windowColor?: string;
  seed: number;
}

// 성능 최적화: 창문은 InstancedMesh 대신 텍스처로 표현
function Building({ x, z, w, d, h, color, windowColor = '#ffe58a', seed }: BuildingProps) {
  // 창문 텍스처 생성 (그리기 한번, 반복 사용)
  const windowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);

    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    // 4x4 창문 그리드
    const gap = 8;
    const size = 20;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const lit = rand() > 0.35;
        ctx.fillStyle = lit ? windowColor : '#1a2030';
        ctx.fillRect(gap + col * (size + gap), gap + row * (size + gap), size, size);
        if (lit) {
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(gap + col * (size + gap) + 2, gap + row * (size + gap) + 2, size / 2, size / 2);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    // 벽 크기에 따라 반복
    const repeatY = Math.max(1, Math.floor(h / 4));
    tex.repeat.set(1, repeatY);
    tex.needsUpdate = true;
    return tex;
  }, [color, windowColor, seed, h]);

  return (
    <group position={[x, h / 2, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={windowTexture} />
      </mesh>
      {/* Roof accent */}
      <mesh position={[0, h / 2 + 0.15, 0]}>
        <boxGeometry args={[w + 0.3, 0.3, d + 0.3]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
    </group>
  );
}

function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 1.6, 6]} />
        <meshStandardMaterial color="#5b3a1e" />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[1.1, 8, 8]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
      <mesh position={[0.6, 2.0, 0.3]}>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshStandardMaterial color="#388e3c" />
      </mesh>
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 3, 6]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#fff5b0" emissive="#ffe066" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

interface PlatformProps {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  color: string;
}

function Platform({ x, y, z, w, d, color }: PlatformProps) {
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={[w, 0.6, d]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// ─── World data ───────────────────────────────
interface CityData {
  buildings: BuildingProps[];
  trees: { x: number; z: number }[];
  lamps: { x: number; z: number }[];
  platforms: PlatformProps[];
  jumpPads: { x: number; z: number }[];
}

function buildCity(): CityData {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const buildings: BuildingProps[] = [];
  const colors = [
    '#546e7a', '#37474f', '#455a64', '#607d8b',
    '#5c6bc0', '#3949ab', '#3f51b5', '#5d4037',
    '#6d4c41', '#78909c', '#4a5568', '#2d3748',
  ];

  // 큰 도시 블록 (더 넓게, 창문은 텍스처라 성능 문제 없음)
  const GRID = 6;
  const SPACING = 20;
  for (let gx = -GRID; gx <= GRID; gx++) {
    for (let gz = -GRID; gz <= GRID; gz++) {
      const bx = gx * SPACING;
      const bz = gz * SPACING;
      // 중앙 광장 스킵 (플레이 공간)
      if (Math.abs(gx) <= 1 && Math.abs(gz) <= 1) continue;
      if (rand() < 0.12) continue; // 공원 자리
      const w = 6 + rand() * 6;
      const d = 6 + rand() * 6;
      const h = 8 + rand() * 40; // 최대 48
      const color = colors[Math.floor(rand() * colors.length)];
      buildings.push({ x: bx, z: bz, w, d, h, color, seed: Math.floor(rand() * 10000) });
    }
  }

  const trees: { x: number; z: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const r = 6 + rand() * 12;
    const a = rand() * Math.PI * 2;
    trees.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
  }

  const lamps: { x: number; z: number }[] = [];
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    lamps.push({ x: i * 7, z: 0 });
    lamps.push({ x: 0, z: i * 7 });
  }

  // 점프 스타일 플랫폼 계단 (Roblox obby 느낌)
  const platforms: PlatformProps[] = [
    { x: -8, y: 2, z: 0, w: 3, d: 3, color: '#ff6d00' },
    { x: -12, y: 4, z: 0, w: 3, d: 3, color: '#f4511e' },
    { x: -16, y: 6, z: 3, w: 3, d: 3, color: '#e64a19' },
    { x: -16, y: 8, z: 8, w: 3, d: 3, color: '#d84315' },

    { x: 8, y: 2, z: 0, w: 3, d: 3, color: '#7b1fa2' },
    { x: 12, y: 4, z: -3, w: 3, d: 3, color: '#8e24aa' },
    { x: 16, y: 6, z: -6, w: 3, d: 3, color: '#9c27b0' },

    { x: 0, y: 3, z: 10, w: 4, d: 4, color: '#00897b' },
    { x: 0, y: 5, z: 15, w: 4, d: 4, color: '#00acc1' },
    { x: 0, y: 8, z: 20, w: 5, d: 5, color: '#0097a7' },
  ];

  // 점프 패드 (밟으면 튀어오름)
  const jumpPads = [
    { x: 4, z: 4 },
    { x: -4, z: -4 },
    { x: 4, z: -4 },
    { x: -4, z: 4 },
  ];

  return { buildings, trees, lamps, platforms, jumpPads };
}

// 점프 패드
function JumpPad({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.15, z]}>
      <mesh>
        <cylinderGeometry args={[1.2, 1.4, 0.3, 12]} />
        <meshStandardMaterial color="#ffd54a" emissive="#ffb300" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.05, 12]} />
        <meshStandardMaterial color="#ff6d00" emissive="#ff9800" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export { buildCity, Building, Tree, Lamp, Platform, JumpPad };
export type { CityData, PlatformProps };
