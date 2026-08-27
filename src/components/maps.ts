import type { StaticBlock, Checkpoint, TowerData } from './Tower';

export interface MapInfo {
  id: number;
  name: string;
  icon: string;
  difficulty: string;
  color: string;
  description: string;
}

export const MAP_LIST: MapInfo[] = [
  { id: 0, name: '초보자 타워', icon: '🌱', difficulty: '쉬움', color: '#4caf50', description: '기본 점프 연습' },
  { id: 1, name: '톱날 지옥', icon: '🪚', difficulty: '보통', color: '#ff9800', description: '회전 톱날을 피하라' },
  { id: 2, name: '하늘 계단', icon: '☁️', difficulty: '보통', color: '#42a5f5', description: '구름 위 나선 계단' },
  { id: 3, name: '용암 탈출', icon: '🌋', difficulty: '어려움', color: '#f44336', description: '올라가는 용암을 피해!' },
  { id: 4, name: '얼음 미끄럼', icon: '🧊', difficulty: '어려움', color: '#80deea', description: '미끄러운 얼음 발판' },
  { id: 5, name: '네온 시티', icon: '🌃', difficulty: '보통', color: '#e040fb', description: '형형색색 네온 도시' },
  { id: 6, name: '거인의 계단', icon: '🗿', difficulty: '어려움', color: '#8d6e63', description: '거대한 블록 점프' },
  { id: 7, name: '회전 미로', icon: '🌀', difficulty: '극악', color: '#ff1744', description: '모든 것이 돌아간다' },
  { id: 8, name: '무지개 폭포', icon: '🌈', difficulty: '보통', color: '#fdd835', description: '올라가는 무지개 길' },
  { id: 9, name: '최종 시련', icon: '👑', difficulty: '극악', color: '#ffd700', description: '모든 장애물 총출동' },
];

// 헬퍼: 체크포인트 발판 생성
function cpBlock(x: number, y: number, z: number, checkpoints: Checkpoint[], blocks: StaticBlock[]) {
  blocks.push({ x, y: y - 0.25, z, w: 7, h: 0.5, d: 7, color: '#fdd835', type: 'checkpoint' });
  checkpoints.push({ x, y: y + 0.5, z });
}

// 헬퍼: 로비 생성
function lobby(blocks: StaticBlock[], checkpoints: Checkpoint[]) {
  blocks.push({ x: 0, y: 0.5, z: 0, w: 14, h: 1, d: 14, color: '#e8eaf6', type: 'checkpoint' });
  blocks.push({ x: 0, y: 1.5, z: -7.2, w: 14, h: 1.6, d: 0.5, color: '#42a5f5' });
  blocks.push({ x: -7.2, y: 1.5, z: 0, w: 0.5, h: 1.6, d: 14, color: '#42a5f5' });
  blocks.push({ x: 7.2, y: 1.5, z: 0, w: 0.5, h: 1.6, d: 14, color: '#42a5f5' });
  checkpoints.push({ x: 0, y: 1.5, z: 0 });
}

function empty(): TowerData {
  return { staticBlocks: [], spinners: [], movingBlocks: [], jumpPads: [], checkpoints: [], spawnPoint: { x: 0, y: 1.5, z: 0 } };
}

// ═══════════════════════════════════════════
// 맵 0: 초보자 타워 (기존 맵)
// ═══════════════════════════════════════════
function buildMap0(): TowerData {
  const t = empty();
  const { staticBlocks: s, spinners: sp, movingBlocks: mv, jumpPads: _jp, checkpoints: c } = t;
  lobby(s, c);
  let y = 1.6;
  void _jp;
  // 지그재그 계단
  for (let i = 0; i < 7; i++) {
    s.push({ x: i % 2 === 0 ? -1.2 : 1.2, y: y + i * 0.6, z: 9 + i * 2.6, w: 3, h: 0.5, d: 3, color: '#43a047' });
  }
  y = y + 6 * 0.6 + 0.6;
  cpBlock(0, y, 30, c, s);
  // 톱날 다리
  y += 1;
  s.push({ x: 0, y, z: 44, w: 4.5, h: 0.5, d: 20, color: '#78909c' });
  for (let i = 0; i < 3; i++) sp.push({ x: 0, y: y + 1.3, z: 38 + i * 6, length: 4.5, height: 0.4, speed: 1.1 + i * 0.2, color: '#e53935', axis: 'y' });
  y += 1.5;
  cpBlock(0, y, 57, c, s);
  // 이동 벽
  y += 1.2;
  s.push({ x: 0, y, z: 71, w: 6, h: 0.5, d: 20, color: '#607d8b' });
  for (let i = 0; i < 3; i++) mv.push({ x: 0, y: y + 1.6, z: 66 + i * 6, w: 3, h: 2.6, d: 0.7, color: '#ff5722', axis: 'x', amp: 2.5, speed: 0.9, phase: i * 1.5 });
  y += 1.5;
  cpBlock(0, y, 84, c, s);
  // 엘리베이터
  y += 1.2;
  for (let i = 0; i < 4; i++) mv.push({ x: 0, y, z: 89 + i * 3.8, w: 4, h: 0.5, d: 4, color: '#8e24aa', axis: 'y', amp: 1.2, speed: 0.8, phase: i * 1.6 });
  y += 1.5;
  cpBlock(0, y, 106, c, s);
  // 골인
  s.push({ x: 0, y: y + 1, z: 115, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  c.push({ x: 0, y: y + 2, z: 115 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 1: 톱날 지옥
// ═══════════════════════════════════════════
function buildMap1(): TowerData {
  const t = empty();
  const { staticBlocks: s, spinners: sp, checkpoints: c } = t;
  lobby(s, c);
  let y = 2;
  for (let stage = 0; stage < 5; stage++) {
    const z0 = 12 + stage * 22;
    s.push({ x: 0, y, z: z0 + 8, w: 5, h: 0.5, d: 18, color: '#546e7a' });
    // 점점 빠르고 많아지는 톱날
    const count = 2 + stage;
    for (let i = 0; i < count; i++) {
      sp.push({
        x: 0, y: y + 1.3, z: z0 + 2 + i * (16 / count),
        length: 4 + stage * 0.3, height: 0.4,
        speed: 0.8 + stage * 0.3 + i * 0.15,
        color: stage >= 3 ? '#d50000' : '#e53935',
        axis: stage % 2 === 0 ? 'y' : 'x',
      });
    }
    y += 1.5;
    cpBlock(0, y, z0 + 20, c, s);
    y += 1;
  }
  s.push({ x: 0, y: y + 1, z: 130, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  c.push({ x: 0, y: y + 2, z: 130 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 2: 하늘 계단
// ═══════════════════════════════════════════
function buildMap2(): TowerData {
  const t = empty();
  const { staticBlocks: s, checkpoints: c, jumpPads: jp } = t;
  lobby(s, c);
  let y = 2;
  // 3개의 나선 계단 구간 (점점 높아짐)
  for (let seg = 0; seg < 3; seg++) {
    const zc = 20 + seg * 35;
    const steps = 12 + seg * 4;
    const r = 5 + seg;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2.5;
      s.push({
        x: Math.cos(angle) * r,
        y: y + i * 0.5,
        z: zc + Math.sin(angle) * r,
        w: 3, h: 0.4, d: 3,
        color: `hsl(${200 + i * 8 + seg * 60}, 70%, 60%)`,
      });
    }
    y += steps * 0.5 + 1;
    cpBlock(Math.cos(0) * r, y, zc, c, s);
    // 구간 사이 점프 패드
    if (seg < 2) {
      s.push({ x: 0, y, z: zc + r + 3, w: 5, h: 0.5, d: 5, color: '#546e7a' });
      jp.push({ x: 0, y: y + 0.3, z: zc + r + 3, power: 18 });
      y += 8;
    }
  }
  s.push({ x: 0, y: y + 1, z: 90, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  c.push({ x: 0, y: y + 2, z: 90 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 3: 용암 탈출 (좁은 다리 + 점프 패드 연속)
// ═══════════════════════════════════════════
function buildMap3(): TowerData {
  const t = empty();
  const { staticBlocks: s, spinners: sp, jumpPads: jp, checkpoints: c } = t;
  lobby(s, c);
  let y = 2;
  for (let i = 0; i < 6; i++) {
    const z0 = 10 + i * 18;
    // 좁은 다리 (점점 좁아짐)
    const w = Math.max(1.5, 3 - i * 0.3);
    s.push({ x: 0, y, z: z0 + 5, w, h: 0.5, d: 12, color: '#d84315' });
    // 용암색 바닥 (시각적)
    s.push({ x: 0, y: y - 2, z: z0 + 5, w: 12, h: 0.3, d: 14, color: '#ff3d00' });
    // 톱날 (다리 양옆)
    if (i > 0) {
      sp.push({ x: 0, y: y + 1.2, z: z0 + 5, length: 3 + i * 0.3, height: 0.4, speed: 1 + i * 0.2, color: '#ffab00', axis: 'y' });
    }
    y += 1;
    cpBlock(0, y, z0 + 14, c, s);
    // 점프 패드로 다음 구간
    jp.push({ x: 0, y: y + 0.3, z: z0 + 14, power: 16 + i });
    y += 5;
  }
  s.push({ x: 0, y: y + 1, z: 125, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  c.push({ x: 0, y: y + 2, z: 125 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 4: 얼음 미끄럼 (넓은 발판 + 움직이는 장애물 많음)
// ═══════════════════════════════════════════
function buildMap4(): TowerData {
  const t = empty();
  const { staticBlocks: s, movingBlocks: mv, spinners: sp, jumpPads: _jp2, checkpoints: c } = t;
  lobby(s, c);
  void _jp2;
  let y = 2;
  for (let i = 0; i < 5; i++) {
    const z0 = 12 + i * 20;
    // 넓은 얼음 바닥
    s.push({ x: 0, y, z: z0 + 7, w: 8, h: 0.5, d: 16, color: '#b3e5fc' });
    // 좌우로 흔들리는 빙벽 (2~3개)
    for (let j = 0; j < 2 + Math.floor(i / 2); j++) {
      mv.push({
        x: 0, y: y + 1.5, z: z0 + 3 + j * 5,
        w: 6, h: 2, d: 0.6, color: '#4fc3f7',
        axis: 'x', amp: 3, speed: 0.7 + i * 0.15, phase: j * 2,
      });
    }
    // 가운데 톱날 (후반부)
    if (i >= 3) {
      sp.push({ x: 0, y: y + 1, z: z0 + 8, length: 5, height: 0.4, speed: 1.2, color: '#0288d1', axis: 'y' });
    }
    y += 1.5;
    cpBlock(0, y, z0 + 17, c, s);
    y += 1;
  }
  s.push({ x: 0, y: y + 1, z: 120, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  c.push({ x: 0, y: y + 2, z: 120 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 5: 네온 시티 (형형색색 + 엘리베이터 도시)
// ═══════════════════════════════════════════
function buildMap5(): TowerData {
  const t = empty();
  const { staticBlocks: s, movingBlocks: mv, jumpPads: jp, checkpoints: c } = t;
  lobby(s, c);
  let y = 2;
  const neonColors = ['#e040fb', '#00e5ff', '#76ff03', '#ff6d00', '#ffea00', '#f50057'];
  for (let i = 0; i < 6; i++) {
    const z0 = 10 + i * 16;
    const col = neonColors[i % neonColors.length];
    // 네온 빌딩 블록들
    for (let j = 0; j < 3; j++) {
      const bx = -3 + j * 3;
      s.push({ x: bx, y: y + j * 0.4, z: z0 + j * 2.5, w: 2.5, h: 0.5, d: 2.5, color: col });
    }
    // 엘리베이터
    mv.push({ x: 3, y: y + 1, z: z0 + 8, w: 3, h: 0.5, d: 3, color: col, axis: 'y', amp: 2, speed: 0.7, phase: i });
    y += 2.5;
    cpBlock(0, y, z0 + 13, c, s);
    y += 0.5;
  }
  // 최종 점프패드 → 골인
  jp.push({ x: 0, y: y + 0.3, z: 108, power: 20 });
  s.push({ x: 0, y, z: 108, w: 5, h: 0.5, d: 5, color: '#e040fb' });
  s.push({ x: 0, y: y + 8, z: 116, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  c.push({ x: 0, y: y + 9, z: 116 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 6: 거인의 계단 (큰 블록 + 높은 점프)
// ═══════════════════════════════════════════
function buildMap6(): TowerData {
  const t = empty();
  const { staticBlocks: s, jumpPads: _jp3, spinners: sp, checkpoints: c } = t;
  lobby(s, c);
  void _jp3;
  let y = 2;
  for (let i = 0; i < 8; i++) {
    const z0 = 10 + i * 12;
    const size = 4 + (i % 3);
    const height = 2 + i * 0.5;
    // 거대 블록
    s.push({ x: (i % 2 === 0 ? -2 : 2), y: y + height / 2, z: z0, w: size, h: height, d: size, color: `hsl(${30 + i * 15}, 50%, 45%)` });
    // 블록 위에 올라서기
    y += height + 0.5;
    if (i % 3 === 0 && i > 0) {
      cpBlock(i % 2 === 0 ? -2 : 2, y, z0, c, s);
    }
    // 중간에 톱날
    if (i >= 4) {
      sp.push({ x: 0, y: y + 0.5, z: z0 + 4, length: 3, height: 0.4, speed: 1 + i * 0.1, color: '#795548', axis: 'y' });
    }
  }
  cpBlock(0, y + 1, 110, c, s);
  s.push({ x: 0, y: y + 2, z: 120, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  c.push({ x: 0, y: y + 3, z: 120 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 7: 회전 미로 (톱날 + 이동벽 동시)
// ═══════════════════════════════════════════
function buildMap7(): TowerData {
  const t = empty();
  const { staticBlocks: s, spinners: sp, movingBlocks: mv, checkpoints: c } = t;
  lobby(s, c);
  let y = 2;
  for (let i = 0; i < 5; i++) {
    const z0 = 12 + i * 22;
    // 넓은 바닥
    s.push({ x: 0, y, z: z0 + 8, w: 7, h: 0.5, d: 18, color: '#37474f' });
    // 톱날 2개 (반대 방향 회전)
    sp.push({ x: -1.5, y: y + 1.3, z: z0 + 5, length: 4, height: 0.4, speed: 1 + i * 0.25, color: '#ff1744', axis: 'y' });
    sp.push({ x: 1.5, y: y + 1.3, z: z0 + 12, length: 4, height: 0.4, speed: -(1 + i * 0.25), color: '#ff1744', axis: 'y' });
    // 이동 벽 (지그재그로 통과해야 함)
    mv.push({ x: 0, y: y + 1.5, z: z0 + 8, w: 5, h: 2.5, d: 0.6, color: '#d50000', axis: 'x', amp: 2, speed: 1 + i * 0.2, phase: i });
    y += 2;
    cpBlock(0, y, z0 + 19, c, s);
    y += 1;
  }
  s.push({ x: 0, y: y + 1, z: 130, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  c.push({ x: 0, y: y + 2, z: 130 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 8: 무지개 폭포 (계단 + 점프패드 연속)
// ═══════════════════════════════════════════
function buildMap8(): TowerData {
  const t = empty();
  const { staticBlocks: s, jumpPads: jp, movingBlocks: mv, checkpoints: c } = t;
  lobby(s, c);
  let y = 2;
  for (let i = 0; i < 7; i++) {
    const z0 = 8 + i * 14;
    const hue = i * 50;
    // 무지개 계단 3단
    for (let j = 0; j < 3; j++) {
      s.push({
        x: (j - 1) * 2.5,
        y: y + j * 0.6,
        z: z0 + j * 2.5,
        w: 2.8, h: 0.5, d: 2.8,
        color: `hsl(${hue + j * 15}, 80%, 55%)`,
      });
    }
    y += 2;
    // 점프패드로 다음 층
    s.push({ x: 0, y, z: z0 + 9, w: 4, h: 0.5, d: 4, color: `hsl(${hue + 45}, 70%, 50%)` });
    jp.push({ x: 0, y: y + 0.3, z: z0 + 9, power: 14 + i });
    y += 4;
    // 착지 플랫폼 (이동)
    mv.push({ x: 0, y, z: z0 + 12, w: 4, h: 0.5, d: 4, color: `hsl(${hue + 60}, 65%, 55%)`, axis: 'x', amp: 1.5, speed: 0.6 + i * 0.1, phase: i });
    y += 1;
    if (i % 2 === 0) cpBlock(0, y, z0 + 12, c, s);
    y += 0.5;
  }
  s.push({ x: 0, y: y + 1, z: 115, w: 10, h: 0.6, d: 10, color: '#ffd700', type: 'goal' });
  c.push({ x: 0, y: y + 2, z: 115 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 9: 최종 시련 (모든 장애물 총출동!)
// ═══════════════════════════════════════════
function buildMap9(): TowerData {
  const t = empty();
  const { staticBlocks: s, spinners: sp, movingBlocks: mv, jumpPads: jp, checkpoints: c } = t;
  lobby(s, c);
  let y = 2;
  // 1) 지그재그 + 톱날
  for (let i = 0; i < 5; i++) {
    s.push({ x: i % 2 === 0 ? -1.5 : 1.5, y: y + i * 0.6, z: 9 + i * 2.8, w: 2.5, h: 0.5, d: 2.5, color: '#ffd600' });
  }
  y += 4;
  sp.push({ x: 0, y: y + 0.8, z: 18, length: 5, height: 0.4, speed: 1.5, color: '#d50000', axis: 'y' });
  cpBlock(0, y + 1, 25, c, s);
  y += 2;
  // 2) 이동벽 + 좁은 다리
  s.push({ x: 0, y, z: 38, w: 2, h: 0.5, d: 14, color: '#ff6f00' });
  mv.push({ x: 0, y: y + 1.5, z: 33, w: 4, h: 2.5, d: 0.6, color: '#e65100', axis: 'x', amp: 2, speed: 1.2, phase: 0 });
  mv.push({ x: 0, y: y + 1.5, z: 40, w: 4, h: 2.5, d: 0.6, color: '#e65100', axis: 'x', amp: 2, speed: 1.2, phase: 2 });
  y += 1.5;
  cpBlock(0, y, 48, c, s);
  y += 1;
  // 3) 나선 + 톱날
  const z8c = 56;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2.5;
    s.push({ x: Math.cos(angle) * 5, y: y + i * 0.5, z: z8c + Math.sin(angle) * 5, w: 2.8, h: 0.4, d: 2.8, color: `hsl(${i * 30}, 75%, 55%)` });
  }
  y += 12 * 0.5;
  sp.push({ x: 0, y: y - 1, z: z8c, length: 6, height: 0.4, speed: 1.3, color: '#ff1744', axis: 'x' });
  cpBlock(5, y + 1, z8c, c, s);
  y += 2;
  // 4) 엘리베이터 연속
  for (let i = 0; i < 4; i++) {
    mv.push({ x: 5 + i * 3, y, z: z8c, w: 3, h: 0.5, d: 3, color: '#00bcd4', axis: 'y', amp: 1.5, speed: 1.1, phase: i * 0.8 });
  }
  y += 2;
  cpBlock(5 + 4 * 3, y, z8c, c, s);
  y += 1;
  // 5) 최종 점프패드 → 골인
  jp.push({ x: 5 + 4 * 3, y: y + 0.3, z: z8c, power: 22 });
  s.push({ x: 5 + 4 * 3, y, z: z8c, w: 5, h: 0.5, d: 5, color: '#546e7a' });
  s.push({ x: 5 + 4 * 3, y: y + 8, z: z8c + 8, w: 12, h: 0.6, d: 12, color: '#ffd700', type: 'goal' });
  c.push({ x: 5 + 4 * 3, y: y + 9, z: z8c + 8 });
  return t;
}

// ═══════════════════════════════════════════
// 맵 빌더 인덱스
// ═══════════════════════════════════════════
const BUILDERS = [buildMap0, buildMap1, buildMap2, buildMap3, buildMap4, buildMap5, buildMap6, buildMap7, buildMap8, buildMap9];

export function buildMap(id: number): TowerData {
  const builder = BUILDERS[id] ?? BUILDERS[0];
  return builder();
}
