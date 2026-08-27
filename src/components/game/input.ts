import { useEffect } from 'react';

/** 전역 입력 상태 (React 상태 아님 → 리렌더 없음) */
export const input = {
  moveX: 0,
  moveY: 0,
  jump: false,
  run: false,
  lookDX: 0,
  lookDY: 0,
};

/** 게임 → HUD 로 전달되는 실시간 값 (폴링으로 읽음, 리렌더 유발 안 함) */
export const gameState = {
  height: 0,
  stage: 0,
  fps: 0,
};

/** 게임 → UI 이벤트 콜백 (GameScreen이 등록) */
export const gameEvents: {
  onDeath?: () => void;
  onStage?: (stage: number) => void;
  onGoal?: () => void;
} = {};

/** 키보드 입력 훅 */
export function useKeyboard() {
  useEffect(() => {
    const keys: Record<string, boolean> = {};
    const update = () => {
      let x = 0, y = 0;
      if (keys['KeyW'] || keys['ArrowUp']) y += 1;
      if (keys['KeyS'] || keys['ArrowDown']) y -= 1;
      if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) x += 1;
      input.moveX = x;
      input.moveY = y;
      input.run = !!(keys['ShiftLeft'] || keys['ShiftRight']);
    };
    const down = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'Space') input.jump = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      update();
    };
    const up = (e: KeyboardEvent) => {
      keys[e.code] = false;
      update();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
}

/** 입력 전체 초기화 (화면 전환 시) */
export function resetInput() {
  input.moveX = 0;
  input.moveY = 0;
  input.jump = false;
  input.run = false;
  input.lookDX = 0;
  input.lookDY = 0;
}
