import { useEffect, useState, useRef } from 'react';

interface LogItem {
  id: number;
  type: 'error' | 'warn' | 'info';
  msg: string;
  stack?: string;
  time: string;
}

let idCounter = 0;

/**
 * 화면에 실시간 에러/로그를 표시하는 디버그 오버레이.
 * 모바일에서 콘솔을 볼 수 없을 때 필수.
 */
export default function DebugOverlay() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [webglInfo, setWebglInfo] = useState<string>('확인중...');
  const fpsRef = useRef<HTMLSpanElement>(null);

  const push = (type: LogItem['type'], msg: string, stack?: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    setLogs((prev) => [...prev.slice(-49), { id: ++idCounter, type, msg, stack, time }]);
    if (type === 'error') {
      setHasError(true);
      setOpen(true); // 에러 발생 시 자동으로 열기
    }
  };

  useEffect(() => {
    // ── WebGL 지원 확인 ──
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (!gl) {
        setWebglInfo('❌ WebGL 미지원! (이것이 검은 화면의 원인일 수 있음)');
        push('error', 'WebGL을 사용할 수 없습니다. 브라우저/기기가 3D를 지원하지 않습니다.');
      } else {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown';
        setWebglInfo(`✅ WebGL OK · ${String(renderer).slice(0, 40)}`);
      }
    } catch (e) {
      setWebglInfo('⚠️ WebGL 확인 실패');
    }

    // ── 전역 에러 캐치 ──
    const onError = (e: ErrorEvent) => {
      push('error', `${e.message}`, `${e.filename}:${e.lineno}:${e.colno}\n${e.error?.stack ?? ''}`);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      push('error', `Unhandled Promise: ${r?.message ?? String(r)}`, r?.stack);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    // ── console.error / warn 후킹 ──
    const origError = console.error;
    const origWarn = console.warn;
    console.error = (...args: unknown[]) => {
      origError(...args);
      try {
        push('error', args.map((a) => (a instanceof Error ? a.message : typeof a === 'object' ? JSON.stringify(a).slice(0, 200) : String(a))).join(' '));
      } catch {}
    };
    console.warn = (...args: unknown[]) => {
      origWarn(...args);
      try {
        push('warn', args.map((a) => String(a)).join(' ').slice(0, 200));
      } catch {}
    };

    // ── WebGL 컨텍스트 손실 감지 ──
    const onCtxLost = (e: Event) => {
      e.preventDefault();
      push('error', 'WebGL 컨텍스트 손실! (GPU 과부하 또는 메모리 부족)');
    };
    document.addEventListener('webglcontextlost', onCtxLost, true);

    push('info', `앱 시작 · ${navigator.userAgent.slice(0, 60)}`);

    // ── FPS 측정 (DOM 직접 갱신, 리렌더 없음) ──
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        if (fpsRef.current) fpsRef.current.textContent = String(frames);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      document.removeEventListener('webglcontextlost', onCtxLost, true);
      console.error = origError;
      console.warn = origWarn;
      cancelAnimationFrame(raf);
    };
  }, []);

  const errCount = logs.filter((l) => l.type === 'error').length;

  return (
    <>
      {/* 플로팅 버튼 (항상 표시) */}
      <button
        onClick={() => setOpen((v) => !v)}
        data-ui
        className={`fixed bottom-3 right-3 z-[9998] px-3 py-2 rounded-full text-[11px] font-black shadow-2xl border-2 transition ${
          hasError
            ? 'bg-red-600 border-red-300 text-white animate-pulse'
            : 'bg-slate-900/80 border-white/20 text-emerald-300'
        }`}
      >
        {hasError ? `⚠️ 에러 ${errCount}` : '🐞'} · <span ref={fpsRef}>--</span>fps
      </button>

      {/* 로그 패널 */}
      {open && (
        <div
          data-ui
          className="fixed inset-x-2 bottom-16 top-16 z-[9999] bg-slate-950/97 border-2 border-white/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/15 bg-slate-900">
            <div className="text-xs font-black text-white">🐞 디버그 콘솔</div>
            <div className="flex gap-1.5">
              <button
                onClick={() => { setLogs([]); setHasError(false); }}
                className="text-[10px] px-2 py-1 rounded-lg bg-white/10 text-white font-bold"
              >
                지우기
              </button>
              <button
                onClick={() => {
                  const text = logs.map((l) => `[${l.time}] ${l.type.toUpperCase()}: ${l.msg}\n${l.stack ?? ''}`).join('\n\n');
                  navigator.clipboard?.writeText(text).catch(() => {});
                }}
                className="text-[10px] px-2 py-1 rounded-lg bg-indigo-500 text-white font-bold"
              >
                📋 전체 복사
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-[10px] px-2 py-1 rounded-lg bg-white/10 text-white font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-slate-900/60 border-b border-white/10 text-[10px] text-slate-300">
            {webglInfo}
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-1.5 font-mono">
            {logs.length === 0 && (
              <div className="text-[11px] text-slate-500 p-3 text-center">
                로그가 없습니다. 게임을 실행해 보세요.
              </div>
            )}
            {logs.map((l) => (
              <div
                key={l.id}
                className={`text-[10px] p-2 rounded-lg border break-words ${
                  l.type === 'error'
                    ? 'bg-red-950/60 border-red-500/40 text-red-200'
                    : l.type === 'warn'
                    ? 'bg-yellow-950/40 border-yellow-500/30 text-yellow-200'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <div className="opacity-60 text-[9px]">{l.time}</div>
                <div className="font-bold whitespace-pre-wrap">{l.msg}</div>
                {l.stack && (
                  <div className="mt-1 opacity-70 text-[9px] whitespace-pre-wrap max-h-24 overflow-auto">
                    {l.stack.slice(0, 400)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
