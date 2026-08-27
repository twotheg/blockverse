import { create } from 'zustand';

export type HatType = 'none' | 'cap' | 'beanie' | 'top' | 'helmet';
export type GlassesType = 'none' | 'round' | 'square' | 'sun';
export type MustacheType = 'none' | 'goatee' | 'full' | 'stubble';

export interface CharacterStyle {
  skin: string;
  hat: HatType;
  hatColor: string;
  glasses: GlassesType;
  glassesColor: string;
  mustache: MustacheType;
  mustacheColor: string;
  shirt: string;
  pants: string;
  shoes: string;
}

export interface OtherPlayer {
  id: string;
  name: string;
  style: CharacterStyle;
  x: number;
  y: number;
  z: number;
  rotation: number;
  isJumping: boolean;
}

export type Screen = 'lobby' | 'customize' | 'game';

export type DifficultyMode = 'easy' | 'normal' | 'hard' | 'hardcore' | 'custom';

export interface DifficultyConfig {
  mode: DifficultyMode;
  name: string;
  label: string;
  maxLives: number; // -1 for unlimited (Easy)
  description: string;
  color: string;
  icon: string;
}

export const DIFFICULTY_PRESETS: Record<DifficultyMode, DifficultyConfig> = {
  easy: {
    mode: 'easy',
    name: '이지 모드',
    label: '무한 부활',
    maxLives: -1,
    description: '체크포인트에서 무제한 부활! 편안하게 타워를 즐기세요.',
    color: '#4caf50',
    icon: '🌱',
  },
  normal: {
    mode: 'normal',
    name: '노말 모드',
    label: '하트 5개',
    maxLives: 5,
    description: '체크포인트 5회 부활 가능. 적당한 긴장감!',
    color: '#2196f3',
    icon: '⚡',
  },
  hard: {
    mode: 'hard',
    name: '하드 모드',
    label: '하트 3개',
    maxLives: 3,
    description: '단 3번의 기회! 실수 없이 올라가야 합니다.',
    color: '#ff9800',
    icon: '🔥',
  },
  hardcore: {
    mode: 'hardcore',
    name: '하드코어',
    label: '원 라이프',
    maxLives: 1,
    description: '죽으면 즉시 처음부터! 진정한 고수 전용.',
    color: '#f44336',
    icon: '💀',
  },
  custom: {
    mode: 'custom',
    name: '커스텀',
    label: '직접 설정',
    maxLives: 10,
    description: '원하는 기회 횟수를 직접 지정하세요.',
    color: '#9c27b0',
    icon: '⚙️',
  },
};

interface GameState {
  screen: Screen;
  playerName: string;
  roomCode: string;
  character: CharacterStyle;

  // Difficulty & Lives
  difficulty: DifficultyMode;
  customLives: number;
  livesRemaining: number; // -1 for infinite, or >= 0

  // player world state
  playerX: number;
  playerY: number;
  playerZ: number;
  playerRotY: number;
  isJumping: boolean;

  // camera yaw & pitch
  cameraYaw: number;
  cameraPitch: number;

  // simulated other players
  otherPlayers: OtherPlayer[];

  setScreen: (s: Screen) => void;
  setPlayerName: (n: string) => void;
  regenerateRoomCode: () => void;
  setCharacter: (patch: Partial<CharacterStyle>) => void;
  setPlayerPos: (x: number, y: number, z: number) => void;
  setPlayerRotY: (r: number) => void;
  setJumping: (v: boolean) => void;
  setCameraYaw: (r: number) => void;
  setCameraPitch: (r: number) => void;

  // Difficulty actions
  setDifficulty: (d: DifficultyMode) => void;
  setCustomLives: (n: number) => void;
  resetLives: () => void;
  loseLife: () => boolean; // returns true if player still alive, false if game over
}

const randomCode = () =>
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  Math.random().toString(36).slice(2, 6).toUpperCase();

const DEFAULT_CHARACTER: CharacterStyle = {
  skin: '#ffcf9e',
  hat: 'none',
  hatColor: '#e53935',
  glasses: 'none',
  glassesColor: '#1a1a1a',
  mustache: 'none',
  mustacheColor: '#3a2414',
  shirt: '#2962ff',
  pants: '#1e2a4a',
  shoes: '#1a1a1a',
};

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'lobby',
  playerName: 'Blocky' + Math.floor(Math.random() * 999),
  roomCode: randomCode(),
  character: { ...DEFAULT_CHARACTER },

  difficulty: 'easy',
  customLives: 10,
  livesRemaining: -1, // Easy default is infinite

  playerX: 0,
  playerY: 2,
  playerZ: 0,
  playerRotY: 0,
  isJumping: false,
  cameraYaw: 0,
  cameraPitch: 0.35,

  otherPlayers: [
    {
      id: 'bot-1',
      name: 'Luna_88',
      style: { ...DEFAULT_CHARACTER, shirt: '#ff4081', pants: '#311b92', hat: 'beanie', hatColor: '#ffd54f', shoes: '#ffd54f' },
      x: 10, y: 1, z: 8, rotation: 0, isJumping: false,
    },
    {
      id: 'bot-2',
      name: 'PixelKing',
      style: { ...DEFAULT_CHARACTER, shirt: '#00c853', pants: '#263238', hat: 'helmet', hatColor: '#b0bec5', glasses: 'square', glassesColor: '#000' },
      x: -12, y: 1, z: -5, rotation: Math.PI, isJumping: false,
    },
    {
      id: 'bot-3',
      name: 'NeonKid',
      style: { ...DEFAULT_CHARACTER, skin: '#8d5524', shirt: '#ff6d00', pants: '#4a148c', hat: 'top', hatColor: '#000', mustache: 'goatee', mustacheColor: '#000' },
      x: 18, y: 1, z: -14, rotation: Math.PI / 2, isJumping: false,
    },
  ],

  setScreen: (s) => set({ screen: s }),
  setPlayerName: (n) => set({ playerName: n }),
  regenerateRoomCode: () => set({ roomCode: randomCode() }),
  setCharacter: (patch) =>
    set((s) => ({ character: { ...s.character, ...patch } })),
  setPlayerPos: (x, y, z) => set({ playerX: x, playerY: y, playerZ: z }),
  setPlayerRotY: (r) => set({ playerRotY: r }),
  setJumping: (v) => set({ isJumping: v }),
  setCameraYaw: (r) => set({ cameraYaw: r }),
  setCameraPitch: (r) => set({ cameraPitch: r }),

  setDifficulty: (mode) => {
    const config = DIFFICULTY_PRESETS[mode];
    const lives = mode === 'custom' ? get().customLives : config.maxLives;
    set({ difficulty: mode, livesRemaining: lives });
  },

  setCustomLives: (n) => {
    const clamped = Math.max(1, Math.min(50, n));
    set({ customLives: clamped, livesRemaining: clamped });
  },

  resetLives: () => {
    const { difficulty, customLives } = get();
    const config = DIFFICULTY_PRESETS[difficulty];
    const lives = difficulty === 'custom' ? customLives : config.maxLives;
    set({ livesRemaining: lives });
  },

  loseLife: () => {
    const current = get().livesRemaining;
    if (current === -1) return true; // Infinite lives
    if (current <= 1) {
      set({ livesRemaining: 0 });
      return false; // Game over!
    }
    set({ livesRemaining: current - 1 });
    return true; // Still has lives
  },
}));
