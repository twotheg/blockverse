import { useEffect, useState } from 'react';

/**
 * 게임 진입 시 가로모드 잠금 시도 + 현재 세로/가로 상태 반환
 * - PWA(홈 화면 설치) 안드로이드에서는 실제 강제 회전됨
 * - 그 외 브라우저에서는 잠금이 거부되므로 안내 오버레이로 대응
 */
export function useLandscape(active: boolean) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile =
      /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
      (('ontouchstart' in window) && window.innerWidth < 1024);
    setIsMobile(mobile);

    const check = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    const so: any = (window.screen as any)?.orientation;

    // 가로모드 잠금 시도 (PWA standalone에서만 성공)
    const lock = async () => {
      try {
        if (so && typeof so.lock === 'function') {
          await so.lock('landscape');
        }
      } catch {
        // 브라우저에서 거부됨 → 안내 오버레이로 대응
      }
    };

    // 전체화면 + 가로 잠금 (사용자 제스처 후 가장 잘 동작)
    const tryFullscreenLandscape = async () => {
      try {
        const el: any = document.documentElement;
        if (!document.fullscreenElement && el.requestFullscreen) {
          await el.requestFullscreen({ navigationUI: 'hide' } as any);
        }
      } catch { /* noop */ }
      await lock();
    };

    lock();
    // 첫 터치 시 전체화면+가로 재시도
    const onFirstTouch = () => {
      tryFullscreenLandscape();
      window.removeEventListener('pointerdown', onFirstTouch);
    };
    window.addEventListener('pointerdown', onFirstTouch, { once: true });

    return () => {
      window.removeEventListener('pointerdown', onFirstTouch);
      try {
        if (so && typeof so.unlock === 'function') so.unlock();
      } catch { /* noop */ }
    };
  }, [active]);

  return { isPortrait, isMobile, shouldRotate: active && isMobile && isPortrait };
}
