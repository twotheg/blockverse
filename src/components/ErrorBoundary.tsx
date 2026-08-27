import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[999] bg-slate-950 text-white p-6 overflow-auto flex items-center justify-center">
          <div className="max-w-md w-full bg-red-950/50 border border-red-500/40 rounded-2xl p-5 space-y-3">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-black text-red-300">게임 로딩 중 오류가 발생했습니다</h2>
            <pre className="text-[10px] bg-black/50 p-3 rounded-lg overflow-auto max-h-40 text-red-200 whitespace-pre-wrap">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack?.slice(0, 500)}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset?.();
              }}
              className="w-full py-3 rounded-xl bg-indigo-500 font-bold text-sm"
            >
              🏠 로비로 돌아가기
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl bg-white/10 font-bold text-xs"
            >
              🔄 페이지 새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
