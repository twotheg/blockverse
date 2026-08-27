import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useState, useEffect } from 'react';
import Character from './Character';
import { useGameStore } from '../store/useGameStore';
import type { HatType, GlassesType, MustacheType } from '../store/useGameStore';

const SKIN_PALETTE = ['#ffcf9e', '#f5c29a', '#e0a878', '#c68642', '#8d5524', '#56321a'];
const CLOTH_PALETTE = [
  '#e53935', '#d81b60', '#8e24aa', '#5e35b1',
  '#3949ab', '#1e88e5', '#039be5', '#00acc1',
  '#00897b', '#43a047', '#7cb342', '#c0ca33',
  '#fdd835', '#ffb300', '#fb8c00', '#f4511e',
  '#6d4c41', '#455a64', '#1a1a1a', '#f5f5f5',
];

type Tab = 'skin' | 'hat' | 'glasses' | 'mustache' | 'shirt' | 'pants' | 'shoes';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'skin', label: '얼굴', icon: '🧑' },
  { id: 'hat', label: '모자', icon: '🎩' },
  { id: 'glasses', label: '안경', icon: '👓' },
  { id: 'mustache', label: '수염', icon: '🧔' },
  { id: 'shirt', label: '상의', icon: '👕' },
  { id: 'pants', label: '하의', icon: '👖' },
  { id: 'shoes', label: '신발', icon: '👟' },
];

const HATS: { id: HatType; label: string; icon: string }[] = [
  { id: 'none', label: '없음', icon: '❌' },
  { id: 'cap', label: '캡', icon: '🧢' },
  { id: 'beanie', label: '비니', icon: '🎿' },
  { id: 'top', label: '실크햇', icon: '🎩' },
  { id: 'helmet', label: '헬멧', icon: '⛑️' },
];

const GLASSES: { id: GlassesType; label: string; icon: string }[] = [
  { id: 'none', label: '없음', icon: '❌' },
  { id: 'round', label: '라운드', icon: '👓' },
  { id: 'square', label: '스퀘어', icon: '🤓' },
  { id: 'sun', label: '선글라스', icon: '🕶️' },
];

const MUSTACHES: { id: MustacheType; label: string; icon: string }[] = [
  { id: 'none', label: '없음', icon: '❌' },
  { id: 'stubble', label: '삭수', icon: '🌱' },
  { id: 'goatee', label: '염소수염', icon: '🐐' },
  { id: 'full', label: '풀수염', icon: '🧔' },
];

export default function CustomizeScreen() {
  const { character, setCharacter, setScreen, playerName, setPlayerName } = useGameStore();
  const [tab, setTab] = useState<Tab>('hat');
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setPhase((p) => (p + 0.01) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const currentColor =
    tab === 'skin' ? character.skin :
    tab === 'hat' ? character.hatColor :
    tab === 'glasses' ? character.glassesColor :
    tab === 'mustache' ? character.mustacheColor :
    tab === 'shirt' ? character.shirt :
    tab === 'pants' ? character.pants :
    character.shoes;

  const setColor = (c: string) => {
    if (tab === 'skin') setCharacter({ skin: c });
    else if (tab === 'hat') setCharacter({ hatColor: c });
    else if (tab === 'glasses') setCharacter({ glassesColor: c });
    else if (tab === 'mustache') setCharacter({ mustacheColor: c });
    else if (tab === 'shirt') setCharacter({ shirt: c });
    else if (tab === 'pants') setCharacter({ pants: c });
    else setCharacter({ shoes: c });
  };

  return (
    <div className="fixed inset-0 flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white">
      {/* ─────────── 상단: 3D Preview ─────────── */}
      {/* 모바일: 화면의 40vh 고정 / 데스크탑: 좌측 절반 */}
      <div className="relative h-[38vh] lg:h-full lg:flex-1 shrink-0 border-b lg:border-b-0 lg:border-r border-white/10">
        <Canvas camera={{ position: [0, 2, 6], fov: 45 }} dpr={[1, 1.25]}>
          <ambientLight intensity={0.85} />
          <directionalLight position={[5, 8, 5]} intensity={1.1} />
          <directionalLight position={[-5, 3, -5]} intensity={0.45} color="#8ab4ff" />
          <directionalLight position={[0, 2, -8]} intensity={0.35} color="#ffd7a8" />
          <Character style={character} walkPhase={phase} isIdle />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
            <circleGeometry args={[5, 64]} />
            <meshStandardMaterial color="#2a2a3e" />
          </mesh>
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={3}
            maxDistance={10}
            target={[0, 0, 0]}
          />
        </Canvas>
        <div className="absolute top-2 left-2 text-[10px] bg-black/40 backdrop-blur px-2 py-1 rounded-full border border-white/10">
          👆 드래그로 회전
        </div>
        <div className="absolute top-2 right-2">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
            className="bg-black/50 backdrop-blur border border-white/20 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-indigo-400 w-32"
            placeholder="이름"
          />
        </div>
      </div>

      {/* ─────────── 하단: 컨트롤 영역 (flex column) ─────────── */}
      {/* 모바일: 남은 세로공간 다 쓰기 (min-h-0 필수!) / 데스크탑: 우측 440px */}
      <div className="flex-1 min-h-0 lg:flex-none lg:w-[440px] bg-slate-900/70 backdrop-blur flex flex-col">
        
        {/* 탭 (고정) */}
        <div className="flex gap-1 p-2 overflow-x-auto border-b border-white/10 scrollbar-hide shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg text-[11px] transition whitespace-nowrap min-w-[56px] ${
                tab === t.id
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <span className="text-lg leading-none mb-1">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {(tab === 'hat' || tab === 'glasses' || tab === 'mustache') && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">
                {tab === 'hat' ? '모자 스타일' : tab === 'glasses' ? '안경 스타일' : '수염 스타일'}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(tab === 'hat' ? HATS : tab === 'glasses' ? GLASSES : MUSTACHES).map((opt) => {
                  const current =
                    tab === 'hat' ? character.hat : tab === 'glasses' ? character.glasses : character.mustache;
                  const active = current === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (tab === 'hat') setCharacter({ hat: opt.id as HatType });
                        else if (tab === 'glasses') setCharacter({ glasses: opt.id as GlassesType });
                        else setCharacter({ mustache: opt.id as MustacheType });
                      }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xl transition ${
                        active
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-white scale-105'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      title={opt.label}
                    >
                      <span>{opt.icon}</span>
                      <span className="text-[9px] mt-0.5 text-white/70">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color palette */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">
              {tab === 'skin' ? '피부색' :
               tab === 'hat' ? '모자 색상' :
               tab === 'glasses' ? '안경 색상' :
               tab === 'mustache' ? '수염 색상' :
               tab === 'shirt' ? '상의 색상' :
               tab === 'pants' ? '하의 색상' : '신발 색상'}
            </div>
            <div className="grid grid-cols-8 gap-2">
              {(tab === 'skin' ? SKIN_PALETTE : CLOTH_PALETTE).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`aspect-square rounded-lg transition border-2 ${
                    currentColor.toLowerCase() === c.toLowerCase()
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-white/10 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─────────── 하단 액션 버튼 (항상 화면 하단 고정) ─────────── */}
        <div
          className="p-3 border-t border-white/10 shrink-0 flex gap-2 bg-slate-900/90 backdrop-blur"
          style={{
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', // iPhone 노치 대응
          }}
        >
          <button
            onClick={() => setScreen('lobby')}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition active:scale-95"
          >
            ← 로비
          </button>
          <button
            onClick={() => setScreen('game')}
            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 font-black text-sm shadow-lg shadow-emerald-500/30 transition active:scale-95"
          >
            ▶ 저장하고 게임 시작
          </button>
        </div>
      </div>
    </div>
  );
}
