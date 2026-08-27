/**
 * BLOCKVERSE 멀티플레이어 서버
 * Express + Socket.io
 * 
 * 무료 배포: Render.com / Railway.app / Fly.io
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuid } from 'uuid';

// ─── 환경변수 ────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*'; // GitHub Pages URL

// ─── Express + HTTP 서버 ─────────────────────────────────────
const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Health check (Render keep-alive용)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    game: 'BLOCKVERSE',
    rooms: rooms.size,
    players: io.engine.clientsCount,
    uptime: Math.floor(process.uptime()) + 's',
  });
});

// ─── Socket.io 서버 ──────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ─── 데이터 구조 ─────────────────────────────────────────────

/** @type {Map<string, Room>} roomCode → Room */
const rooms = new Map();

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {string} roomCode
 * @property {Object} style  - CharacterStyle
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} rotation
 * @property {boolean} isJumping
 * @property {number} coins
 */

/**
 * @typedef {Object} Room
 * @property {string} code
 * @property {string} hostId
 * @property {Map<string, Player>} players
 * @property {Set<number>} collectedCoins
 * @property {number} createdAt
 */

// ─── 유틸 ────────────────────────────────────────────────────
function generateCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() +
         Math.random().toString(36).slice(2, 6).toUpperCase();
}

function getRoomInfo(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    playerCount: room.players.size,
    collectedCoins: Array.from(room.collectedCoins),
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      style: p.style,
      x: p.x, y: p.y, z: p.z,
      rotation: p.rotation,
      isJumping: p.isJumping,
      coins: p.coins,
    })),
  };
}

// 빈 방 청소 (10분 후)
function scheduleRoomCleanup(code) {
  setTimeout(() => {
    const room = rooms.get(code);
    if (room && room.players.size === 0) {
      rooms.delete(code);
      console.log(`[Room] Cleaned up empty room: ${code}`);
    }
  }, 10 * 60 * 1000);
}

// ─── Socket.io 이벤트 ────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  let currentPlayer = null;
  let currentRoom = null;

  // ── 방 생성 ────────────────────────────────────────
  socket.on('create_room', ({ playerName, style }, callback) => {
    let code = generateCode();
    // 충돌 방지
    while (rooms.has(code)) code = generateCode();

    const room = {
      code,
      hostId: socket.id,
      players: new Map(),
      collectedCoins: new Set(),
      createdAt: Date.now(),
    };

    const player = {
      id: socket.id,
      name: playerName || 'Player',
      roomCode: code,
      style: style || {},
      x: 0, y: 1, z: 0,
      rotation: 0,
      isJumping: false,
      coins: 0,
    };

    room.players.set(socket.id, player);
    rooms.set(code, room);
    socket.join(code);

    currentPlayer = player;
    currentRoom = room;

    console.log(`[Room] Created: ${code} by ${playerName}`);

    callback?.({ success: true, room: getRoomInfo(room) });
  });

  // ── 방 참여 ────────────────────────────────────────
  socket.on('join_room', ({ roomCode, playerName, style }, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      callback?.({ success: false, error: '방을 찾을 수 없습니다.' });
      return;
    }
    if (room.players.size >= 8) {
      callback?.({ success: false, error: '방이 가득 찼습니다. (최대 8명)' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName || 'Player',
      roomCode,
      style: style || {},
      x: (Math.random() - 0.5) * 6,
      y: 1,
      z: (Math.random() - 0.5) * 6,
      rotation: 0,
      isJumping: false,
      coins: 0,
    };

    room.players.set(socket.id, player);
    socket.join(roomCode);

    currentPlayer = player;
    currentRoom = room;

    // 기존 플레이어들에게 새 플레이어 알림
    socket.to(roomCode).emit('player_joined', {
      player: {
        id: player.id,
        name: player.name,
        style: player.style,
        x: player.x, y: player.y, z: player.z,
        rotation: player.rotation,
        isJumping: player.isJumping,
      },
    });

    console.log(`[Room] ${playerName} joined room ${roomCode}. Players: ${room.players.size}`);

    callback?.({ success: true, room: getRoomInfo(room) });
  });

  // ── 위치 동기화 (고빈도 - throttled on client) ────
  socket.on('player_move', ({ x, y, z, rotation, isJumping }) => {
    if (!currentPlayer || !currentRoom) return;

    currentPlayer.x = x;
    currentPlayer.y = y;
    currentPlayer.z = z;
    currentPlayer.rotation = rotation;
    currentPlayer.isJumping = isJumping;

    // 같은 방 다른 플레이어에게만 브로드캐스트
    socket.to(currentRoom.code).emit('player_moved', {
      id: socket.id,
      x, y, z, rotation, isJumping,
    });
  });

  // ── 코인 수집 동기화 ──────────────────────────────
  socket.on('collect_coin', ({ coinId }) => {
    if (!currentRoom) return;
    if (currentRoom.collectedCoins.has(coinId)) return; // 이미 수집됨

    currentRoom.collectedCoins.add(coinId);
    if (currentPlayer) currentPlayer.coins += 1;

    // 모든 방 플레이어에게 알림
    io.to(currentRoom.code).emit('coin_collected', {
      coinId,
      byPlayer: socket.id,
      byName: currentPlayer?.name,
    });
  });

  // ── 채팅 ──────────────────────────────────────────
  socket.on('chat_message', ({ message }) => {
    if (!currentRoom || !currentPlayer) return;
    const text = String(message).slice(0, 100).trim();
    if (!text) return;

    io.to(currentRoom.code).emit('chat_message', {
      playerId: socket.id,
      playerName: currentPlayer.name,
      message: text,
      timestamp: Date.now(),
    });
  });

  // ── 스타일 변경 동기화 ────────────────────────────
  socket.on('update_style', ({ style }) => {
    if (!currentPlayer || !currentRoom) return;
    currentPlayer.style = style;
    socket.to(currentRoom.code).emit('player_style_updated', {
      id: socket.id,
      style,
    });
  });

  // ── 핑 (연결 상태 확인) ───────────────────────────
  socket.on('ping_server', (callback) => {
    callback?.({ time: Date.now() });
  });

  // ── 방 목록 조회 ──────────────────────────────────
  socket.on('get_rooms', (callback) => {
    const list = Array.from(rooms.values())
      .filter(r => r.players.size > 0 && r.players.size < 8)
      .map(r => ({
        code: r.code,
        playerCount: r.players.size,
        createdAt: r.createdAt,
      }))
      .slice(0, 20);
    callback?.({ rooms: list });
  });

  // ── 연결 해제 ─────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);

    if (!currentRoom || !currentPlayer) return;

    currentRoom.players.delete(socket.id);

    // 남은 플레이어들에게 알림
    io.to(currentRoom.code).emit('player_left', {
      id: socket.id,
      name: currentPlayer.name,
    });

    // 방장이 나가면 다음 사람에게 방장 이양
    if (currentRoom.hostId === socket.id && currentRoom.players.size > 0) {
      const newHost = currentRoom.players.values().next().value;
      currentRoom.hostId = newHost.id;
      io.to(currentRoom.code).emit('host_changed', { newHostId: newHost.id });
    }

    // 빈 방 예약 삭제
    if (currentRoom.players.size === 0) {
      scheduleRoomCleanup(currentRoom.code);
    }

    currentPlayer = null;
    currentRoom = null;
  });
});

// ─── 서버 시작 ───────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║   🎮 BLOCKVERSE Server Running       ║
║   Port: ${PORT}                        ║
║   Env : ${process.env.NODE_ENV || 'development'}               ║
╚══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => process.exit(0));
});
