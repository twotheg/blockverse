import { useEffect, useState } from 'react';
import { input } from './input';

/**
 * Roblox 스타일 터치 컨트롤
 * - 왼쪽 화면: 조이스틱 (터치한 지점에 생성)
 * - 오른쪽 화면: 드래그 = 카메라 회전, 짧은 탭 = 점프
 */
export default function TouchControls() {
  const [stick, setStick] = useState<{ x: number; y: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    const s = {
      leftId: -1, lx: 0, ly: 0,
      rightId: -1, rlx: 0, rly: 0,
      rStart: 0, rsx: 0, rsy: 0, rMoved: false,
    };
    const half = () => window.innerWidth / 2;

    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t && t.closest && t.closest('[data-ui]')) return;

      if (e.clientX < half()) {
        if (s.leftId === -1) {
          s.leftId = e.pointerId;
          s.lx = e.clientX;
          s.ly = e.clientY;
          setStick({ x: 0, y: 0, cx: e.clientX, cy: e.clientY });
        }
      } else if (s.rightId === -1) {
        s.rightId = e.pointerId;
        s.rlx = e.clientX;
        s.rly = e.clientY;
        s.rsx = e.clientX;
        s.rsy = e.clientY;
        s.rStart = performance.now();
        s.rMoved = false;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId === s.leftId) {
        const dx = e.clientX - s.lx;
        const dy = e.clientY - s.ly;
        const max = 60;
        const dist = Math.hypot(dx, dy);
        const cx = dist > max ? (dx / dist) * max : dx;
        const cy = dist > max ? (dy / dist) * max : dy;
        input.moveX = cx / max;
        input.moveY = -cy / max;
        setStick({ x: cx, y: cy, cx: s.lx, cy: s.ly });
      } else if (e.pointerId === s.rightId) {
        input.lookDX += e.clientX - s.rlx;
        input.lookDY += e.clientY - s.rly;
        s.rlx = e.clientX;
        s.rly = e.clientY;
        if (Math.abs(e.clientX - s.rsx) + Math.abs(e.clientY - s.rsy) > 10) s.rMoved = true;
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId === s.leftId) {
        s.leftId = -1;
        input.moveX = 0;
        input.moveY = 0;
        setStick(null);
      } else if (e.pointerId === s.rightId) {
        if (performance.now() - s.rStart < 250 && !s.rMoved) input.jump = true;
        s.rightId = -1;
      }
    };

    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  if (!stick) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <div
        className="absolute w-32 h-32 rounded-full border-2 border-white/30 bg-white/5"
        style={{ left: stick.cx - 64, top: stick.cy - 64 }}
      />
      <div
        className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 border-2 border-white/60 shadow-lg"
        style={{ left: stick.cx + stick.x - 28, top: stick.cy + stick.y - 28 }}
      />
    </div>
  );
}
