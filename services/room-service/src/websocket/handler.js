const axios = require('axios');
const { rooms } = require('../controllers/roomController');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL || 'http://localhost:3003';

function setupWebSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('connect_room', async (data) => {
      try {
        const { roomId, userId, token } = data;

        const room = rooms.get(roomId);
        if (!room) {
          socket.emit('error', { payload: { message: 'Room not found' } });
          return;
        }

        socket.join(roomId);
        socket.userId = userId;
        socket.roomId = roomId;

        const user = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);

        io.to(roomId).emit('player_joined', {
          payload: {
            userId,
            username: user.data.username,
            playersCount: room.players.length
          }
        });

        if (room.players.length === 2 && room.status === 'ready') {
          const gameResponse = await axios.post(`${GAME_SERVICE_URL}/api/games/start`, {
            player1Id: room.players[0],
            player2Id: room.players[1]
          });

          room.startGame(gameResponse.data.gameId);

          const player1 = await axios.get(`${USER_SERVICE_URL}/api/users/${room.players[0]}`);
          const player2 = await axios.get(`${USER_SERVICE_URL}/api/users/${room.players[1]}`);

          io.to(roomId).emit('game_started', {
            payload: {
              gameId: gameResponse.data.gameId,
              player1: { userId: room.players[0], username: player1.data.username },
              player2: { userId: room.players[1], username: player2.data.username },
              currentPlayerId: gameResponse.data.currentPlayerId,
              stonesRemaining: gameResponse.data.stonesRemaining
            }
          });
        }
      } catch (error) {
        console.error('Connect room error:', error);
        socket.emit('error', { payload: { message: 'Failed to connect to room' } });
      }
    });

    socket.on('make_move', async (data) => {
      try {
        const { gameId, userId, stonesToTake } = data;

        const user = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);

        const gameResponse = await axios.post(`${GAME_SERVICE_URL}/api/games/${gameId}/move`, {
          playerId: userId,
          stonesToTake
        });

        io.to(socket.roomId).emit('move_made', {
          payload: {
            playerId: userId,
            username: user.data.username,
            stonesToTake,
            stonesRemaining: gameResponse.data.stonesRemaining,
            nextPlayerId: gameResponse.data.currentPlayerId
          }
        });

        if (gameResponse.data.status === 'finished') {
          const winner = await axios.get(`${USER_SERVICE_URL}/api/users/${gameResponse.data.winnerId}`);
          const loser = await axios.get(`${USER_SERVICE_URL}/api/users/${gameResponse.data.loserId}`);

          io.to(socket.roomId).emit('game_over', {
            payload: {
              winnerId: gameResponse.data.winnerId,
              winnerUsername: winner.data.username,
              loserId: gameResponse.data.loserId,
              loserUsername: loser.data.username
            }
          });
        }
      } catch (error) {
        console.error('Make move error:', error);
        socket.emit('error', { payload: { message: error.response?.data?.error || 'Invalid move' } });
      }
    });

    socket.on('leave_room', () => {
      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room && socket.userId) {
          room.removePlayer(socket.userId);
        }
        socket.leave(socket.roomId);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.roomId && socket.userId) {
        try {
          const user = await axios.get(`${USER_SERVICE_URL}/api/users/${socket.userId}`);
          
          io.to(socket.roomId).emit('player_disconnected', {
            payload: {
              userId: socket.userId,
              username: user.data.username
            }
          });

          const room = rooms.get(socket.roomId);
          if (room) {
            room.removePlayer(socket.userId);
          }
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      }
    });
  });
}

module.exports = { setupWebSocketHandlers };