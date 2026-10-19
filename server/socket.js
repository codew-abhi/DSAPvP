import { Server } from 'socket.io';
import User from './models/User.js';

// Available curated problem slugs for arena battles
const ARENA_PROBLEM_SLUGS = [
  'two-sum',
  'best-time-to-buy-and-sell-stock',
  'contains-duplicate',
  'maximum-subarray',
  'move-zeroes',
];

// Store active rooms and io instance for global stats
let activeIo = null;
const rooms = new Map();

export function getGlobalStats() {
  let activeBattles = 0;
  for (const room of rooms.values()) {
    if (room.status === 'in-progress') activeBattles++;
  }
  return {
    activeBattles,
    onlinePlayers: activeIo ? activeIo.engine.clientsCount : 0,
    totalProblems: 1248,
  };
}

export function broadcastStats() {
  if (activeIo) {
    activeIo.emit('global-stats', getGlobalStats());
  }
}

export function initSocket(httpServer) {
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
    : '*';

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  activeIo = io;

  function getCleanRoomData(room) {
    return {
      roomId: room.id,
      status: room.status,
      players: Array.from(room.players.values()),
      questionSlug: room.questionSlug,
      winner: room.winner,
      startTime: room.startTime,
    };
  }

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Connected: ${socket.id}`);
    broadcastStats();

    let currentRoomId = null;

    // Send immediate stats upon request
    socket.on('get-stats', () => {
      socket.emit('global-stats', getGlobalStats());
    });

    // Join Arena Room
    socket.on('join-arena', async ({ roomId, user }) => {
      if (!roomId) return;
      const cleanRoomId = roomId.trim().toUpperCase();
      currentRoomId = cleanRoomId;

      socket.join(cleanRoomId);

      let room = rooms.get(cleanRoomId);
      if (!room) {
        room = {
          id: cleanRoomId,
          players: new Map(),
          status: 'waiting', // 'waiting' | 'countdown' | 'in-progress' | 'ended'
          questionSlug: null,
          winner: null,
          countdownTimer: null,
          startTime: null,
        };
        rooms.set(cleanRoomId, room);
      }

      // Check if player is already in room (reconnect) or check capacity
      const existingPlayer = room.players.get(socket.id);
      if (!existingPlayer && room.players.size >= 2) {
        socket.emit('arena-error', { message: 'Arena room is full (2 players maximum).' });
        return;
      }

      const playerInfo = {
        socketId: socket.id,
        uid: user?.uid || null,
        username: user?.username || user?.displayName || `Player ${room.players.size + 1}`,
        photoURL: user?.photoURL || '/src/images/robot.png',
        rating: user?.rating || 1200,
        isReady: false,
        progress: { passed: 0, total: 0 },
      };

      room.players.set(socket.id, playerInfo);
      console.log(`[Socket.io] User ${playerInfo.username} (${socket.id}) joined room ${cleanRoomId}`);

      // Broadcast updated room state
      io.to(cleanRoomId).emit('arena-state', getCleanRoomData(room));
    });

    // Toggle Ready Status
    socket.on('toggle-ready', ({ roomId }) => {
      const cleanRoomId = (roomId || currentRoomId)?.trim().toUpperCase();
      const room = rooms.get(cleanRoomId);
      if (!room || room.status !== 'waiting') return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.isReady = !player.isReady;
      console.log(`[Socket.io] ${player.username} ready: ${player.isReady} in ${cleanRoomId}`);

      io.to(cleanRoomId).emit('arena-state', getCleanRoomData(room));

      // Check if both players are ready to start countdown
      const playersList = Array.from(room.players.values());
      const bothReady = playersList.length === 2 && playersList.every((p) => p.isReady);

      if (bothReady) {
        room.status = 'countdown';
        // Pick a synchronized question for both players
        const randomSlug = ARENA_PROBLEM_SLUGS[Math.floor(Math.random() * ARENA_PROBLEM_SLUGS.length)];
        room.questionSlug = randomSlug;
        room.winner = null;

        let countdown = 3;
        io.to(cleanRoomId).emit('countdown-start', { countdown, questionSlug: room.questionSlug });

        if (room.countdownTimer) clearInterval(room.countdownTimer);

        room.countdownTimer = setInterval(() => {
          countdown -= 1;
          if (countdown > 0) {
            io.to(cleanRoomId).emit('countdown-tick', { countdown });
          } else {
            clearInterval(room.countdownTimer);
            room.countdownTimer = null;
            room.status = 'in-progress';
            room.startTime = Date.now();

            io.to(cleanRoomId).emit('match-started', {
              questionSlug: room.questionSlug,
              startTime: room.startTime,
            });
            io.to(cleanRoomId).emit('arena-state', getCleanRoomData(room));
            broadcastStats();
          }
        }, 1000);
      }
    });

    // Broadcast Real-time Test Progress (e.g., 2/5 Passed)
    socket.on('test-progress', ({ roomId, passed, total }) => {
      const cleanRoomId = (roomId || currentRoomId)?.trim().toUpperCase();
      const room = rooms.get(cleanRoomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (player) {
        player.progress = { passed, total };
      }

      socket.to(cleanRoomId).emit('opponent-progress', {
        socketId: socket.id,
        passed,
        total,
      });
    });

    // Submit Solution / Match Win
    socket.on('submit-solution', async ({ roomId, allPassed }) => {
      const cleanRoomId = (roomId || currentRoomId)?.trim().toUpperCase();
      const room = rooms.get(cleanRoomId);
      if (!room || room.status !== 'in-progress') return;

      const player = room.players.get(socket.id);
      if (!player) return;

      if (allPassed) {
        room.status = 'ended';
        room.winner = {
          socketId: socket.id,
          username: player.username,
          uid: player.uid,
        };

        console.log(`[Socket.io] ${player.username} won the match in room ${cleanRoomId}!`);

        // Find opponent
        const playersList = Array.from(room.players.values());
        const opponent = playersList.find((p) => p.socketId !== socket.id);

        // Update MongoDB Stats if logged in
        try {
          if (player.uid) {
            await User.findOneAndUpdate(
              { uid: player.uid },
              { $inc: { wins: 1, matchesPlayed: 1, rating: 25 } }
            );
          }
          if (opponent?.uid) {
            await User.findOneAndUpdate(
              { uid: opponent.uid },
              { $inc: { losses: 1, matchesPlayed: 1, rating: -15 } }
            );
          }
        } catch (dbErr) {
          console.warn('[Socket.io] Could not update user match stats in DB:', dbErr.message);
        }

        io.to(cleanRoomId).emit('match-ended', {
          winner: room.winner,
          players: playersList,
        });
        io.to(cleanRoomId).emit('arena-state', getCleanRoomData(room));
        broadcastStats();
      }
    });

    // Rematch Request
    socket.on('rematch-request', ({ roomId }) => {
      const cleanRoomId = (roomId || currentRoomId)?.trim().toUpperCase();
      const room = rooms.get(cleanRoomId);
      if (!room) return;

      room.status = 'waiting';
      room.winner = null;
      room.questionSlug = null;
      room.startTime = null;
      room.players.forEach((p) => {
        p.isReady = false;
        p.progress = { passed: 0, total: 0 };
      });

      io.to(cleanRoomId).emit('arena-state', getCleanRoomData(room));
      io.to(cleanRoomId).emit('rematch-started');
    });

    // Leave Arena
    const handleLeave = () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room) {
        const leavingPlayer = room.players.get(socket.id);
        room.players.delete(socket.id);

        if (room.countdownTimer) {
          clearInterval(room.countdownTimer);
          room.countdownTimer = null;
        }

        if (room.players.size === 0) {
          rooms.delete(currentRoomId);
          console.log(`[Socket.io] Room ${currentRoomId} deleted (empty)`);
        } else {
          room.status = 'waiting';
          room.players.forEach((p) => {
            p.isReady = false;
          });
          io.to(currentRoomId).emit('opponent-left', {
            username: leavingPlayer?.username || 'Opponent',
          });
          io.to(currentRoomId).emit('arena-state', getCleanRoomData(room));
        }
      }
      socket.leave(currentRoomId);
      currentRoomId = null;
      broadcastStats();
    };

    socket.on('leave-arena', handleLeave);
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Disconnected: ${socket.id}`);
      handleLeave();
      broadcastStats();
    });
  });

  return io;
}
