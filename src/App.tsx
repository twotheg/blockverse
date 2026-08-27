import { useGameStore } from './store/useGameStore';
import LobbyScreen from './components/LobbyScreen';
import CustomizeScreen from './components/CustomizeScreen';
import GameScreen from './components/GameScreen';
import PWAInstallBanner from './components/PWAInstallBanner';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="w-full h-full">
      <ErrorBoundary onReset={() => setScreen('lobby')}>
        {screen === 'lobby' && <LobbyScreen />}
        {screen === 'customize' && <CustomizeScreen />}
        {screen === 'game' && <GameScreen />}
      </ErrorBoundary>
      <PWAInstallBanner />
    </div>
  );
}
