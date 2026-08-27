import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ─── Service Worker 등록 (GitHub Pages 하위 경로 대응) ───
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    // 현재 페이지 기준 상대 경로 계산
    // 예: https://user.github.io/blockverse/  →  base = /blockverse/
    const base = new URL('.', window.location.href).pathname;
    const swUrl = base + 'sw.js';

    // sw.js가 실제로 존재하는지 먼저 확인 (404 에러 방지)
    fetch(swUrl, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) {
          console.warn('[SW] sw.js를 찾을 수 없어 등록을 건너뜁니다:', swUrl);
          return;
        }
        return navigator.serviceWorker
          .register(swUrl, { scope: base })
          .then((reg) => console.log('[SW] 등록 완료:', reg.scope));
      })
      .catch((err) => {
        console.warn('[SW] 등록 실패 (게임 플레이에는 영향 없음):', err?.message);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
