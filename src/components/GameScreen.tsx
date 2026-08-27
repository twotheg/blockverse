import { Canvas } from '@react-three/fiber';
import { useEffect, useState, useRef, Suspense } from 'react';
import Scene from './game/Scene';
import TouchControls from './game/TouchControls';
import { gameState, gameEvents, resetInput } from './game/input';
import { useLandscape } from './game/useLandscape';
import { useGameStore } from '../store/useGameStore';
import ErrorBoundary from './ErrorBoundary';

const PRESET_INFO: Record<string, { icon: string; name: string }> = {
  easy: { icon: '🌱', name: '이지 모드' },
  normal: { icon: '⚡', name: '노말 모드' },
  hard: { icon: '🔥', name: '하드 모드' },
  hardcore: { icon: '💀', name: '하드코어' },
  custom: { icon: '⚙️', name: '커스텀' },
};

export default function GameScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const roomCode = useGameStore((s) => s.roomCode);

  const difficulty = useGameStore((s: any) => s.difficulty) ?? 'easy';
  const storeLives = useGameStore((s: any) => s.livesRemaining);
  const lives = typeof storeLives === 'number' ? storeLives : -1;
  const loseLifeFn = useGameStore((s: any) => s.loseLife);
  const resetLivesFn = useGameStore((s: any) => s.resetLives);

  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState(true);
  const [stage, setStage] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [height, setHeight] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const [flash, setFlash] = useState<'death' | 'cp' | null>(null);

  const livesRef = useRef(lives);
  livesRef.current = lives;

  const { shouldRotate } = useLandscape(true);

  // 화면 진입/이탈 시 입력 초기화 (끼임 방지)
  useEffect(() => {
    resetInput();
    return () => resetInput();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // 게임 이벤트 등록 (Scene은 props가 없어 절대 리렌더되지 않음)
  useEffect(() => {
    gameEvents.onDeath = () => {
      setDeaths((d) => d + 1);
      const alive = typeof loseLifeFn === 'function' ? loseLifeFn() : true;
      if (alive) {
        // 플래시가 이미 표시 중이면 중복 방지
        setFlash((prev) => {
          if (prev === 'death') return prev;
          setTimeout(() => setFlash(null), 1200);
          return 'death';
        });
        // 리스폰은 Scene.tsx의 die()에서 이미 처리됨
      } else {
        setOver(true);
      }
    };
    gameEvents.onStage = (s: number) => {
      setStage(s);
      setFlash('cp');
      setTimeout(() => setFlash(null), 900);
    };
    gameEvents.onGoal = () => setWon(true);
    return () => {
      delete gameEvents.onDeath;
      delete gameEvents.onStage;
      delete gameEvents.onGoal;
    };
  }, [loseLifeFn]);

  // HUD 높이 표시: 폴링 (3D 씬 리렌더 안 함)
  useEffect(() => {
    const id = setInterval(() => {
      setHeight(gameState.height);
    }, 300);
    return () => clearInterval(id);
  }, []);

  const preset = PRESET_INFO[difficulty] ?? PRESET_INFO.easy;

  const restart = () => {
    setOver(false);
    setWon(false);
    setFlash(null);
    setDeaths(0);
    setStage(0);
    resetInput();
    if (typeof resetLivesFn === 'function') resetLivesFn();
    (window as any).__resetToBeginning?.();
  };

  return (
    <ErrorBoundary onReset={() => setScreen('lobby')}>
      <div className="fixed inset-0 bg-sky-300 select-none overflow-hidden">
        <Canvas
          shadows
          camera={{ position: [0, 8, 14], fov: 68, near: 0.1, far: 500 }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 1.25]}
          performance={{ min: 0.4 }}
          frameloop="always"
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>

        {/* ─── 세로모드 회전 안내 ─── */}
        {shouldRotate && (
          <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-7xl mb-4 animate-bounce">📱</div>
            <div className="text-2xl font-black text-white mb-2">가로로 돌려주세요!</div>
            <div className="text-sm text-slate-400 mb-6">
              타워 게임은 가로 화면에서<br />훨씬 잘 보여요 🗼
            </div>
            <div className="text-5xl animate-pulse">↻</div>
            <button
              onClick={() => { /* 무시하고 계속 */ }}
              className="mt-8 text-xs text-slate-500 underline"
            >
              세로로 계속하려면 무시하세요
            </button>
          </div>
        )}

        {/* ─── HUD ─── */}
        <div className="absolute top-0 left-0 right-0 p-2 sm:p-3 flex items-start justify-between pointer-events-none z-20">
          <div className="flex flex-col gap-1.5 pointer-events-auto" data-ui>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMenu((v) => !v)}
                className="px-2.5 py-1.5 rounded-xl bg-black/55 border border-white/10 text-white text-xs font-bold active:scale-95"
                data-ui
              >
                ☰
              </button>
              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white flex items-center gap-1 shadow-lg">
                <span className="text-sm">❤️</span>
                <span className="font-black text-xs text-yellow-300">
                  {lives === -1 ? '∞' : lives}
                </span>
              </div>
              <div className="px-2 py-1 rounded-full text-[9px] font-bold bg-black/50 border border-white/10 text-slate-200">
                {preset.icon}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white shadow-lg text-center">
              <div className="text-[9px] text-slate-300 font-bold uppercase leading-none">스테이지</div>
              <div className="text-lg font-black text-yellow-300 leading-tight">
                {stage}<span className="text-[10px] text-slate-400">/9</span>
              </div>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-[10px] font-semibold text-center">
              <div>💀 {deaths}</div>
              <div>🗼 {Math.max(0, Math.round(height))}m</div>
            </div>
          </div>
        </div>

        {hint && !shouldRotate && (
          <div className="absolute left-1/2 top-16 -translate-x-1/2 z-10 pointer-events-none px-4 w-full max-w-md">
            <div className="bg-black/75 px-4 py-3 rounded-2xl text-white text-[11px] text-center border border-white/15 space-y-1 shadow-2xl">
              <div className="font-black text-sm text-yellow-300">🗼 타워를 올라가세요! — {preset.name}</div>
              <div className="hidden md:block text-slate-200">🖱️ 클릭 후 마우스 시점 · WASD · Space · Shift</div>
              <div className="md:hidden text-slate-200">👈 왼쪽 드래그 이동 · 👉 오른쪽 드래그 시점 · 탭 점프</div>
              <div className="text-cyan-300 font-bold">✨ 공중에서 한 번 더 점프 가능! (더블 점프)</div>
              <div className="text-yellow-200 font-bold">
                {lives === -1 ? '🟡 체크포인트 무한 부활!' : `❤️ 하트 ${lives}개! 다 쓰면 게임오버`}
              </div>
            </div>
          </div>
        )}

        {flash === 'death' && (
          <div className="fixed inset-0 pointer-events-none z-40 bg-red-600/30 flex flex-col items-center justify-center">
            <div className="text-5xl font-black text-red-50 drop-shadow-2xl mb-2">💀</div>
            <div className="text-xs font-bold text-yellow-300 bg-black/70 px-4 py-1.5 rounded-full border border-white/20">
              {livesRef.current === -1 ? '체크포인트에서 부활!' : `-1 ❤️ · 남은 하트 ${livesRef.current}개`}
            </div>
          </div>
        )}

        {flash === 'cp' && (
          <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
            <div className="bg-yellow-400 text-slate-950 px-5 py-2.5 rounded-2xl text-lg font-black border-2 border-white shadow-2xl">
              ✓ 체크포인트 {stage} 저장!
            </div>
          </div>
        )}

        {over && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-auto" data-ui>
            <div className="bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 p-6 rounded-3xl text-white text-center shadow-2xl border-2 border-red-500/50 max-w-sm w-full space-y-3">
              <div className="text-5xl">💀</div>
              <h2 className="text-2xl font-black text-red-400">GAME OVER</h2>
              <p className="text-xs text-slate-300">
                하트를 모두 소진했습니다!<br />
                도달: <span className="text-yellow-300 font-bold">Stage {stage} · {Math.max(0, Math.round(height))}m</span>
              </p>
              <div className="space-y-2 pt-1">
                <button onClick={restart} className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 font-black text-sm">
                  🔄 처음부터 다시 도전
                </button>
                <button onClick={() => { setOver(false); setScreen('lobby'); }} className="w-full py-2.5 rounded-xl bg-white/10 font-bold text-xs">
                  🏠 로비로 (난이도 변경)
                </button>
              </div>
            </div>
          </div>
        )}

        {won && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-auto" data-ui>
            <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-6 rounded-3xl text-white text-center shadow-2xl border-4 border-yellow-300 max-w-sm w-full space-y-3">
              <div className="text-5xl">🏆</div>
              <h2 className="text-3xl font-black">클리어!</h2>
              <p className="text-xs opacity-90">{preset.name} · 💀 사망 {deaths}회</p>
              <div className="space-y-2">
                <button onClick={restart} className="w-full py-3 rounded-xl bg-white text-orange-600 font-black text-sm">
                  🔄 다시 플레이
                </button>
                <button onClick={() => { setWon(false); setScreen('lobby'); }} className="w-full py-2.5 rounded-xl bg-black/30 font-bold text-xs">
                  🏠 로비로
                </button>
              </div>
            </div>
          </div>
        )}

        <TouchControls />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/50 pointer-events-none z-10" />

        {menu && (
          <div className="absolute inset-0 bg-black/75 z-30 flex items-center justify-center p-4 overflow-auto" data-ui>
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/15 rounded-3xl p-5 max-w-md w-full space-y-3" data-ui>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="text-xl font-black">일시정지</h2>
                <div className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold">
                  {preset.name}
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center border border-white/5">
                <div>
                  <div className="text-[9px] text-slate-400">스테이지</div>
                  <div className="text-xl font-black text-yellow-400">{stage}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">하트</div>
                  <div className="text-xl font-black text-red-400">{lives === -1 ? '∞' : lives}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">높이</div>
                  <div className="text-xl font-black text-emerald-400">{Math.max(0, Math.round(height))}m</div>
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-3 border border-white/5">
                <div className="text-[9px] text-slate-400 uppercase font-bold">방 코드</div>
                <div className="text-lg font-mono font-black tracking-widest text-indigo-200">{roomCode}</div>
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(roomCode); } catch { /* noop */ }
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                  className="mt-2 w-full py-2 rounded-xl bg-indigo-500 text-xs font-bold"
                >
                  {copied ? '✓ 복사됨!' : '📋 방 코드 복사'}
                </button>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={() => { setMenu(false); resetInput(); (window as any).__respawnCheckpoint?.(); }}
                  className="w-full py-2.5 rounded-xl bg-white/10 text-xs font-bold"
                >
                  📍 마지막 체크포인트로 이동
                </button>
                <button
                  onClick={() => { setMenu(false); restart(); }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 font-bold text-xs"
                >
                  🔄 처음부터 (하트 리셋)
                </button>
                <button
                  onClick={() => { setMenu(false); setScreen('customize'); }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-xs"
                >
                  ✨ 캐릭터 편집
                </button>
                <button
                  onClick={() => { setMenu(false); setScreen('lobby'); }}
                  className="w-full py-2.5 rounded-xl bg-white/10 text-xs font-bold"
                >
                  🏠 로비로 나가기
                </button>
                <button
                  onClick={() => setMenu(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-black text-sm"
                >
                  ▶ 계속 플레이
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
