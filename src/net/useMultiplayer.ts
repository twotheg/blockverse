import { useEffect, useState, useRef } from 'react';
import { getSocket } from './socket';
import { useGameStore } from '../store/useGameStore';
import type { CharacterStyle } from '../store/useGameStore';

export interface RemotePlayer {
  id: string;
  name: string;
  style: CharacterStyle;
  x: number;
  y: number;
  z: number;
  rotation: number;
  isJumping: boolean;
}

export type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'error';

export function useMultiplayer() {
  const [status, setStatus] = useState<ConnectionStatus>('offline');
  const [remotePlayers, setRemotePlayers] = useState<Map<string, RemotePlayer>>(new Map());
  const [chatMessages, setChatMessages] = useState<{ name: string; message: string; time: number }[]>([]);

  const { playerName, roomCode, character } = useGameStore();
  const lastSendRef = useRef(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setStatus('offline');
      return;
    }

    setStatus('connecting');

    const onConnect = () => {
      setStatus('connected');
      // 방 만들기 or 참여 (여기선 자동 참여 시도, 실패시 만들기)
      socket.emit(
        'join_room',
        { roomCode, playerName, style: character },
        (res: { success: boolean; room?: { players: RemotePlayer[] }; error?: string }) => {
          if (!res.success) {
            // 방 없으면 새로 만들기
            socket.emit('create_room', { playerName, style: character }, (r: { success: boolean }) => {
              if (r.success) console.log('[MP] Room created');
            });
          } else if (res.room) {
            const map = new Map<string, RemotePlayer>();
            res.room.players.forEach((p) => {
              if (p.id !== socket.id) map.set(p.id, p);
            });
            setRemotePlayers(map);
          }
        }
      );
    };

    const onDisconnect = () => setStatus('error');
    const onError = () => setStatus('error');

    const onPlayerJoined = ({ player }: { player: RemotePlayer }) => {
      setRemotePlayers((prev) => {
        const next = new Map(prev);
        next.set(player.id, player);
        return next;
      });
      setChatMessages((prev) => [
        ...prev.slice(-19),
        { name: 'SYSTEM', message: `${player.name} 님이 입장했습니다`, time: Date.now() },
      ]);
    };

    const onPlayerLeft = ({ id, name }: { id: string; name: string }) => {
      setRemotePlayers((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setChatMessages((prev) => [
        ...prev.slice(-19),
        { name: 'SYSTEM', message: `${name} 님이 퇴장했습니다`, time: Date.now() },
      ]);
    };

    const onPlayerMoved = ({ id, x, y, z, rotation, isJumping }: any) => {
      setRemotePlayers((prev) => {
        const next = new Map(prev);
        const p = next.get(id);
        if (p) next.set(id, { ...p, x, y, z, rotation, isJumping });
        return next;
      });
    };

    const onChatMessage = ({ playerName, message }: { playerName: string; message: string }) => {
      setChatMessages((prev) => [...prev.slice(-19), { name: playerName, message, time: Date.now() }]);
    };

    const onStyleUpdated = ({ id, style }: { id: string; style: CharacterStyle }) => {
      setRemotePlayers((prev) => {
        const next = new Map(prev);
        const p = next.get(id);
        if (p) next.set(id, { ...p, style });
        return next;
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('player_moved', onPlayerMoved);
    socket.on('chat_message', onChatMessage);
    socket.on('player_style_updated', onStyleUpdated);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('player_moved', onPlayerMoved);
      socket.off('chat_message', onChatMessage);
      socket.off('player_style_updated', onStyleUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMove = (x: number, y: number, z: number, rotation: number, isJumping: boolean) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    const now = Date.now();
    // Throttle to ~20 fps
    if (now - lastSendRef.current < 50) return;
    lastSendRef.current = now;
    socket.emit('player_move', { x, y, z, rotation, isJumping });
  };

  const sendChat = (message: string) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    socket.emit('chat_message', { message });
  };

  const sendStyleUpdate = (style: CharacterStyle) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    socket.emit('update_style', { style });
  };

  return { status, remotePlayers, chatMessages, sendMove, sendChat, sendStyleUpdate };
}
