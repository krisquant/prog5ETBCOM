const RoomModel = require('../models/Room');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const GAME_RULES_SERVICE_URL = process.env.GAME_RULES_SERVICE_URL || 'http://localhost:3003';

class WebSocketHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`[WEBSOCKET] Client connected: ${socket.id}`);
      socket.on('connect_room', async (data) => {
        try {
          const { roomId, userId, token } = data;
          
          console.log(`[WEBSOCKET] User ${userId} connecting to room ${roomId}`);
          const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
          const user = userResponse.data;
          const room = RoomModel.findById(roomId);
          if (!room) {
            socket.emit('error', {
              type: 'error',
              payload: {
                code: 'ROOM_NOT_FOUND',
                message: 'Room not found'
              }
            });
            return;
          }
          socket.join(roomId);
          this.userSockets.set(userId, socket.id);
          this.socketUsers.set(socket.id, { userId, roomId, username: user.username });

          console.log(`[WEBSOCKET] User ${user.username} joined room ${roomId}`);
          socket.to(roomId).emit('player_joined', {
            type: 'player_joined',
            payload: {
              roomId,
              userId,
              username: user.username,
              playersCount: room.players.length
            },
            timestamp: new Date().toISOString()
          });
          if (room.status === 'ready' && room.players.length === 2) {
            await this.startGame(roomId, room.players);
          }

        } catch (error) {
          console.error('[WEBSOCKET] Connect room error:', error.message);
          socket.emit('error', {
            type: 'error',
            payload: {
              code: 'CONNECTION_ERROR',
              message: error.message
            }
          });
        }
      });
      socket.on('make_move', async (data) => {
        try {
          const { gameId, userId, stonesToTake } = data;
          
          console.log(`[WEBSOCKET] Move attempt: User ${userId} taking ${stonesToTake} stones`);
          const response = await axios.post(
            `${GAME_RULES_SERVICE_URL}/api/games/${gameId}/move`,
            { playerId: userId, stonesToTake }
          );

          const moveResult = response.data;
          const userInfo = this.socketUsers.get(socket.id);

          if (!userInfo) {
            socket.emit('error', {
              type: 'error',
              payload: {
                code: 'USER_NOT_FOUND',
                message: 'User information not found'
              }
            });
            return;
          }
          const player1Response = await axios.get(
            `${USER_SERVICE_URL}/api/users/${userId}`
          );
          const currentUsername = player1Response.data.username;
          this.io.to(userInfo.roomId).emit('move_made', {
            type: 'move_made',
            payload: {
              gameId,
              playerId: userId,
              username: currentUsername,
              stonesToTake,
              stonesRemaining: moveResult.stonesRemaining,
              nextPlayerId: moveResult.currentPlayerId
            },
            timestamp: new Date().toISOString()
          });
          if (moveResult.status === 'finished') {
            const winnerResponse = await axios.get(
              `${USER_SERVICE_URL}/api/users/${moveResult.winnerId}`
            );
            const loserResponse = await axios.get(
              `${USER_SERVICE_URL}/api/users/${moveResult.loserId}`
            );

            this.io.to(userInfo.roomId).emit('game_over', {
              type: 'game_over',
              payload: {
                gameId,
                winnerId: moveResult.winnerId,
                winnerUsername: winnerResponse.data.username,
                loserId: moveResult.loserId,
                loserUsername: loserResponse.data.username,
                finalStones: 0,
                reason: 'opponent_took_last_stone'
              },
              timestamp: new Date().toISOString()
            });
            await axios.put(`${USER_SERVICE_URL}/api/users/${moveResult.winnerId}/stats`, {
              won: true
            });
            await axios.put(`${USER_SERVICE_URL}/api/users/${moveResult.loserId}/stats`, {
              won: false
            });

            console.log(`[WEBSOCKET] Game ${gameId} finished. Winner: ${winnerResponse.data.username}`);
          }

        } catch (error) {
          console.error('[WEBSOCKET] Make move error:', error.message);
          const errorMessage = error.response?.data?.error || error.message;
          socket.emit('error', {
            type: 'error',
            payload: {
              code: 'MOVE_ERROR',
              message: errorMessage
            }
          });
        }
      });
      socket.on('leave_room', (data) => {
        try {
          const { roomId, userId } = data;
          
          console.log(`[WEBSOCKET] User ${userId} leaving room ${roomId}`);

          socket.leave(roomId);
          
          const userInfo = this.socketUsers.get(socket.id);
          if (userInfo) {
            socket.to(roomId).emit('player_disconnected', {
              type: 'player_disconnected',
              payload: {
                userId,
                username: userInfo.username,
                roomId
              },
              timestamp: new Date().toISOString()
            });
          }

          this.userSockets.delete(userId);
          this.socketUsers.delete(socket.id);
          RoomModel.removePlayer(roomId, userId);

        } catch (error) {
          console.error('[WEBSOCKET] Leave room error:', error);
        }
      });
      socket.on('disconnect', () => {
        console.log(`[WEBSOCKET] Client disconnected: ${socket.id}`);
        
        const userInfo = this.socketUsers.get(socket.id);
        if (userInfo) {
          const { userId, roomId, username } = userInfo;
          
          socket.to(roomId).emit('player_disconnected', {
            type: 'player_disconnected',
            payload: {
              userId,
              username,
              roomId
            },
            timestamp: new Date().toISOString()
          });

          this.userSockets.delete(userId);
          this.socketUsers.delete(socket.id);
          RoomModel.removePlayer(roomId, userId);
        }
      });
    });
  }

  async startGame(roomId, playerIds) {
    try {
      console.log(`[WEBSOCKET] Starting game in room ${roomId}`);
      const player1Response = await axios.get(`${USER_SERVICE_URL}/api/users/${playerIds[0]}`);
      const player2Response = await axios.get(`${USER_SERVICE_URL}/api/users/${playerIds[1]}`);

      const player1 = player1Response.data;
      const player2 = player2Response.data;
      const gameResponse = await axios.post(`${GAME_RULES_SERVICE_URL}/api/games/start`, {
        roomId,
        player1Id: playerIds[0],
        player2Id: playerIds[1]
      });

      const game = gameResponse.data;
      RoomModel.setGameId(roomId, game.gameId);
      this.io.to(roomId).emit('game_started', {
        type: 'game_started',
        payload: {
          gameId: game.gameId,
          player1: {
            userId: player1.userId,
            username: player1.username
          },
          player2: {
            userId: player2.userId,
            username: player2.username
          },
          currentPlayerId: game.currentPlayerId,
          stonesRemaining: game.stonesRemaining
        },
        timestamp: new Date().toISOString()
      });

      console.log(`[WEBSOCKET] Game ${game.gameId} started: ${player1.username} vs ${player2.username}`);

    } catch (error) {
      console.error('[WEBSOCKET] Start game error:', error.message);
      this.io.to(roomId).emit('error', {
        type: 'error',
        payload: {
          code: 'GAME_START_ERROR',
          message: 'Failed to start game'
        }
      });
    }
  }
}

module.exports = WebSocketHandler;
