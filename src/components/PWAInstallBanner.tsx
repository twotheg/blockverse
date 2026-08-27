import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 3 sec
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show hint after 5 sec if not installed
    if (ios) {
      const dismissed = sessionStorage.getItem('bv_ios_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 5000);
      }
    }

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('bv_ios_dismissed', '1');
  };

  if (installed || !showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 safe-area-bottom">
        <div className="max-w-md mx-auto bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-4 shadow-2xl border border-white/20 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl shadow bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-2xl shrink-0">
              🗼
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm text-white">BLOCKVERSE 앱 설치</div>
              <div className="text-xs text-indigo-200 mt-0.5">홈 화면에 추가하면 언제든지 바로 플레이!</div>
            </div>
            <button onClick={dismiss} className="text-white/60 hover:text-white text-xl leading-none ml-1">✕</button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 rounded-xl bg-white text-indigo-700 font-black text-sm hover:bg-indigo-50 transition active:scale-95 shadow"
            >
              {isIOS ? '📱 설치 방법 보기' : '📲 앱으로 설치'}
            </button>
            <button
              onClick={dismiss}
              className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition"
            >
              나중에
            </button>
          </div>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-md bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 rounded-3xl p-6 mb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-lg bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-3xl">
                🗼
              </div>
              <h2 className="text-xl font-black">iPhone/iPad 설치 방법</h2>
              <p className="text-sm text-slate-400 mt-1">Safari 브라우저에서 진행하세요</p>
            </div>

            <div className="space-y-4">
              {[
                { step: '1', icon: '🌐', title: 'Safari로 열기', desc: 'Chrome/다른 브라우저라면 Safari로 이 페이지를 열어주세요' },
                { step: '2', icon: '📤', title: '공유 버튼 탭', desc: '하단 가운데 □↑ 모양의 공유(Share) 버튼을 탭하세요' },
                { step: '3', icon: '➕', title: '홈 화면에 추가', desc: '"홈 화면에 추가(Add to Home Screen)" 를 탭하세요' },
                { step: '4', icon: '✅', title: '추가 완료', desc: '"추가" 버튼을 눌러 앱 설치를 완료하세요!' },
              ].map((s) => (
                <div key={s.step} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-black flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{s.icon} {s.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Arrow pointing down (mimicking the Share button position) */}
            <div className="mt-5 py-3 bg-white/5 rounded-xl text-center border border-white/10">
              <div className="text-2xl">⬇️</div>
              <div className="text-xs text-slate-400 mt-1">화면 하단 가운데의 공유 버튼</div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-sm"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
