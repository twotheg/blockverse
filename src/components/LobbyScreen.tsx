import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

// ─── 난이도 설정 (외부 의존 없이 자체 정의 → 빌드 안전) ───
type DiffMode = 'easy' | 'normal' | 'hard' | 'hardcore' | 'custom';

interface DiffPreset {
  mode: DiffMode;
  name: string;
  label: string;
  lives: number; // -1 = 무한
  desc: string;
  icon: string;
}

const PRESETS: DiffPreset[] = [
  {
    mode: 'easy',
    name: '이지 모드',
    label: '무한 부활',
    lives: -1,
    desc: '체크포인트에서 무제한 부활! 편안하게 타워를 즐기세요.',
    icon: '🌱',
  },
  {
    mode: 'normal',
    name: '노말 모드',
    label: '하트 5개',
    lives: 5,
    desc: '체크포인트 5회 부활 가능. 적당한 긴장감!',
    icon: '⚡',
  },
  {
    mode: 'hard',
    name: '하드 모드',
    label: '하트 3개',
    lives: 3,
    desc: '단 3번의 기회! 실수 없이 올라가야 합니다.',
    icon: '🔥',
  },
  {
    mode: 'hardcore',
    name: '하드코어',
    label: '원 라이프',
    lives: 1,
    desc: '죽으면 즉시 처음부터! 진정한 고수 전용.',
    icon: '💀',
  },
  {
    mode: 'custom',
    name: '커스텀',
    label: '직접 설정',
    lives: 10,
    desc: '원하는 기회 횟수를 직접 지정하세요.',
    icon: '⚙️',
  },
];

const findPreset = (m: string): DiffPreset => PRESETS.find((p) => p.mode === m) ?? PRESETS[0];

export default function LobbyScreen() {
  const roomCode = useGameStore((s) => s.roomCode);
  const regenerateRoomCode = useGameStore((s) => s.regenerateRoomCode);
  const setScreen = useGameStore((s) => s.setScreen);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);

  // store에 난이도 기능이 없어도 안전하게 동작하도록 방어 처리
  const storeDifficulty = useGameStore((s: any) => s.difficulty);
  const setDifficultyFn = useGameStore((s: any) => s.setDifficulty);
  const storeCustomLives = useGameStore((s: any) => s.customLives);
  const setCustomLivesFn = useGameStore((s: any) => s.setCustomLives);
  const resetLivesFn = useGameStore((s: any) => s.resetLives);

  // store에 없으면 로컬 상태로 대체
  const [localDiff, setLocalDiff] = useState<DiffMode>('easy');
  const [localCustom, setLocalCustom] = useState(10);

  const difficulty: DiffMode = (storeDifficulty as DiffMode) ?? localDiff;
  const customLives: number = typeof storeCustomLives === 'number' ? storeCustomLives : localCustom;

  const applyDifficulty = (m: DiffMode) => {
    setLocalDiff(m);
    if (typeof setDifficultyFn === 'function') setDifficultyFn(m);
  };
  const applyCustomLives = (n: number) => {
    const v = Math.max(1, Math.min(30, n));
    setLocalCustom(v);
    if (typeof setCustomLivesFn === 'function') setCustomLivesFn(v);
  };

  const [copied, setCopied] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [showModal, setShowModal] = useState(false);

  const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  };

  const startGame = () => {
    if (typeof resetLivesFn === 'function') resetLivesFn();
    setScreen('game');
  };

  const cur = findPreset(difficulty);
  const curLives = difficulty === 'custom' ? customLives : cur.lives;

  return (
    <div className="fixed inset-0 overflow-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-purple-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 py-8 lg:py-12">
        {/* 헤더 */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/10 text-xs mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🗼 타워 오브 헬 · 9개 스테이지
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                BLOCKVERSE
              </span>
            </h1>
            <p className="text-slate-400 mt-1 text-sm">3D 레고 타워 클라이밍 오비 어드벤처</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-xs font-bold">
              {playerName.slice(0, 2).toUpperCase()}
            </div>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
              className="bg-transparent focus:outline-none text-sm w-32"
              placeholder="이름"
            />
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* 난이도 설정 카드 */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-indigo-200/80 font-bold">🎯 게임 난이도 설정</div>
                <h2 className="text-2xl font-black mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{cur.icon}</span>
                  <span>{cur.name}</span>
                  <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-yellow-300">
                    {curLives === -1 ? '❤️ 무제한' : `❤️ ${curLives}개`}
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition font-bold shrink-0"
              >
                ⚙️ 상세
              </button>
            </div>

            {/* 난이도 버튼 4개 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESETS.slice(0, 4).map((p) => {
                const active = difficulty === p.mode;
                return (
                  <button
                    key={p.mode}
                    onClick={() => applyDifficulty(p.mode)}
                    className={`p-3.5 rounded-2xl flex flex-col items-start text-left transition border ${
                      active
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-white shadow-lg shadow-indigo-500/30'
                        : 'bg-black/25 hover:bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <div className="font-black text-sm">{p.name}</div>
                    <div className="text-[11px] text-white/70 mt-0.5 font-bold">
                      {p.lives === -1 ? '❤️ 무한' : `❤️ ${p.lives}회`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 설명 */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
              <div className="text-3xl">💡</div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-yellow-300">
                  {curLives === -1
                    ? '체크포인트 무제한 부활'
                    : `체크포인트 부활 ${curLives}회 제한`}
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {cur.desc} 노란색 체크포인트 발판을 밟으면 위치가 저장되며, 죽으면 하트 1개를 소모하고 그곳에서 다시 시작합니다. 하트를 모두 쓰면 처음부터 다시 도전!
                </div>
              </div>
            </div>

            {/* 방 코드 */}
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400">내 방 초대 코드</div>
                  <div className="text-2xl font-black font-mono tracking-widest text-indigo-200">{roomCode}</div>
                </div>
                <button
                  onClick={regenerateRoomCode}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition"
                >
                  🔄
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copy(roomCode, 'code')}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition"
                >
                  📋 {copied === 'code' ? '복사됨!' : '코드 복사'}
                </button>
                <button
                  onClick={() => copy(inviteLink, 'link')}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-xs font-bold transition shadow-md shadow-emerald-500/20"
                >
                  🔗 {copied === 'link' ? '복사됨!' : '링크 복사'}
                </button>
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="bg-black/30 backdrop-blur border border-white/10 rounded-2xl p-5">
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold">내 캐릭터</div>
              <button
                onClick={() => setScreen('customize')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-black text-sm shadow-lg shadow-pink-500/30 transition active:scale-95"
              >
                ✨ 캐릭터 커스텀 편집
              </button>
              <p className="text-[11px] text-slate-400 mt-2">모자, 안경, 수염, 옷 색상 변경</p>
            </div>

            <div className="bg-black/30 backdrop-blur border border-white/10 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold">친구 방 입장</div>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  placeholder="8자리 코드"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-400 font-mono tracking-widest uppercase"
                />
                <button
                  onClick={() => { if (joinCode.length === 8) startGame(); }}
                  className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold transition"
                >
                  입장
                </button>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:brightness-110 font-black text-xl text-slate-950 shadow-2xl shadow-emerald-500/40 transition active:scale-95 flex flex-col items-center justify-center"
            >
              <div className="flex items-center gap-2">
                <span>▶</span>
                <span>타워 도전 시작!</span>
              </div>
              <span className="text-xs font-bold opacity-80 mt-0.5">
                {cur.name} · {curLives === -1 ? '무한 부활' : `하트 ${curLives}개`}
              </span>
            </button>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <div>🗼 9단계 장애물 타워 · 노란 발판 체크포인트 · 빨간 톱날 주의</div>
          <div>📱 왼쪽 드래그 이동 / 오른쪽 드래그 시점 / 오른쪽 탭 점프</div>
        </footer>
      </div>

      {/* 상세 난이도 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/15 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xl font-black">🎯 난이도 설정</h3>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-2">
              {PRESETS.map((p) => {
                const active = difficulty === p.mode;
                return (
                  <div
                    key={p.mode}
                    onClick={() => applyDifficulty(p.mode)}
                    className={`p-3.5 rounded-2xl cursor-pointer border transition flex items-center justify-between ${
                      active ? 'bg-indigo-600/40 border-indigo-400 ring-2 ring-indigo-400/50' : 'bg-black/30 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-2">
                          <span>{p.name}</span>
                          <span className="text-xs text-yellow-300 font-semibold">({p.label})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
                      </div>
                    </div>
                    {active && <span className="text-emerald-400 font-black text-lg">✓</span>}
                  </div>
                );
              })}
            </div>

            {difficulty === 'custom' && (
              <div className="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>하트(기회) 개수:</span>
                  <span className="text-yellow-300 text-base">{customLives}개</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={customLives}
                  onChange={(e) => applyCustomLives(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1개 (극악)</span>
                  <span>10개 (보통)</span>
                  <span>30개 (넉넉)</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-black text-sm transition"
            >
              선택 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
