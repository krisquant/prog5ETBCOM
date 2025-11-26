const readline = require('readline');
const axios = require('axios');
const { io } = require('socket.io-client');

const USER_SERVICE_URL = 'http://localhost:3001';
const ROOM_SERVICE_URL = 'http://localhost:3002';
const WEBSOCKET_URL = 'ws://localhost:3002';

class GameClient {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.userId = null;
    this.username = null;
    this.token = null;
    this.roomId = null;
    this.gameId = null;
    this.currentPlayerId = null;
    this.stonesRemaining = 21;
    this.socket = null;
    this.opponent = null;
  }

  async start() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     21 STONES GAME                             ║
║                    Command Line Client                         ║
╚════════════════════════════════════════════════════════════════╝

Game Rules:
- Two players take turns
- Each turn, take 1, 2, or 3 stones from the pile
- Start with 21 stones
- The player who takes the LAST stone LOSES!

`);

    await this.showMainMenu();
  }

  async showMainMenu() {
    console.log('\n=== MAIN MENU ===');
    console.log('1. Register new user');
    console.log('2. Login');
    console.log('3. Exit');
    
    const choice = await this.question('\nEnter your choice: ');
    
    switch (choice) {
      case '1':
        await this.register();
        break;
      case '2':
        await this.login();
        break;
      case '3':
        console.log('Goodbye!');
        this.rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid choice. Please try again.');
        await this.showMainMenu();
    }
  }

  async register() {
    const username = await this.question('\nEnter username (3-20 characters): ');
    
    try {
      const response = await axios.post(`${USER_SERVICE_URL}/api/users/register`, {
        username
      });
      
      console.log(`\n✓ Registration successful! Welcome, ${response.data.username}!`);
      await this.login(username);
      
    } catch (error) {
      console.log(`\n✗ Registration failed: ${error.response?.data?.error || error.message}`);
      await this.showMainMenu();
    }
  }

  async login(autoUsername = null) {
    const username = autoUsername || await this.question('\nEnter username: ');
    
    try {
      const response = await axios.post(`${USER_SERVICE_URL}/api/users/login`, {
        username
      });
      
      this.userId = response.data.userId;
      this.username = response.data.username;
      this.token = response.data.token;
      
      console.log(`\n✓ Login successful! Welcome back, ${this.username}!`);
      console.log(`  Games played: ${response.data.gamesPlayed}`);
      console.log(`  Games won: ${response.data.gamesWon}`);
      
      await this.showGameMenu();
      
    } catch (error) {
      console.log(`\n✗ Login failed: ${error.response?.data?.error || error.message}`);
      await this.showMainMenu();
    }
  }

  async showGameMenu() {
    console.log('\n\n=== GAME MENU ===');
    console.log('1. Create new room');
    console.log('2. Join existing room');
    console.log('3. List available rooms');
    console.log('4. Logout');
    
    const choice = await this.question('\nEnter your choice: ');
    
    switch (choice) {
      case '1':
        await this.createRoom();
        break;
      case '2':
        await this.joinRoomPrompt();
        break;
      case '3':
        await this.listAvailableRooms();
        break;
      case '4':
        this.logout();
        await this.showMainMenu();
        break;
      default:
        console.log('Invalid choice. Please try again.');
        await this.showGameMenu();
    }
  }

  async createRoom() {
    try {
      const response = await axios.post(`${ROOM_SERVICE_URL}/api/rooms/create`, {
        userId: this.userId
      });
      
      this.roomId = response.data.roomId;
      
      console.log(`\n✓ Room created successfully!`);
      console.log(`  Room ID: ${this.roomId}`);
      console.log(`  Status: ${response.data.status}`);
      console.log(`\n  Waiting for opponent to join...`);
      console.log(`  Share this Room ID with another player: ${this.roomId}`);
      
      await this.connectWebSocket();
      
    } catch (error) {
      console.log(`\n✗ Failed to create room: ${error.response?.data?.error || error.message}`);
      await this.showGameMenu();
    }
  }

  async joinRoomPrompt() {
    const roomId = await this.question('\nEnter Room ID: ');
    await this.joinRoom(roomId);
  }

  async joinRoom(roomId) {
    try {
      const response = await axios.post(`${ROOM_SERVICE_URL}/api/rooms/${roomId}/join`, {
        userId: this.userId
      });
      
      this.roomId = roomId;
      
      console.log(`\n✓ Joined room successfully!`);
      console.log(`  Room ID: ${this.roomId}`);
      console.log(`  Players: ${response.data.players.length}/2`);
      console.log(`  Status: ${response.data.status}`);
      
      await this.connectWebSocket();
      
    } catch (error) {
      console.log(`\n✗ Failed to join room: ${error.response?.data?.error || error.message}`);
      await this.showGameMenu();
    }
  }

  async listAvailableRooms() {
    try {
      const response = await axios.get(`${ROOM_SERVICE_URL}/api/rooms/available/list`);
      const rooms = response.data.rooms;
      
      console.log(`\n=== AVAILABLE ROOMS ===`);
      
      if (rooms.length === 0) {
        console.log('No available rooms. Create a new one!');
      } else {
        rooms.forEach((room, index) => {
          console.log(`${index + 1}. Room ID: ${room.id} | Players: ${room.players.length}/2`);
        });
        
        const choice = await this.question('\nEnter room number to join (or 0 to go back): ');
        const roomIndex = parseInt(choice) - 1;
        
        if (roomIndex >= 0 && roomIndex < rooms.length) {
          await this.joinRoom(rooms[roomIndex].id);
          return;
        }
      }
      
      await this.showGameMenu();
      
    } catch (error) {
      console.log(`\n✗ Failed to list rooms: ${error.message}`);
      await this.showGameMenu();
    }
  }

  async connectWebSocket() {
    this.socket = io(WEBSOCKET_URL);
    
    this.socket.on('connect', () => {
      console.log('\n✓ Connected to game server');
      this.socket.emit('connect_room', {
        roomId: this.roomId,
        userId: this.userId,
        token: this.token
      });
    });

    this.socket.on('player_joined', (data) => {
      console.log(`\n✓ Player joined: ${data.payload.username}`);
      console.log(`  Players in room: ${data.payload.playersCount}/2`);
      this.opponent = data.payload.username;
    });

    this.socket.on('game_started', (data) => {
      console.log(`\n
╔════════════════════════════════════════════════════════════════╗
║                       GAME STARTED!                            ║
╚════════════════════════════════════════════════════════════════╝
`);
      console.log(`  ${data.payload.player1.username} vs ${data.payload.player2.username}`);
      console.log(`  Starting stones: ${data.payload.stonesRemaining}`);
      
      this.gameId = data.payload.gameId;
      this.currentPlayerId = data.payload.currentPlayerId;
      this.stonesRemaining = data.payload.stonesRemaining;
      
      const currentPlayer = data.payload.currentPlayerId === data.payload.player1.userId 
        ? data.payload.player1.username 
        : data.payload.player2.username;
      
      console.log(`  ${currentPlayer}'s turn`);
      
      this.displayGameState();
      
      if (this.currentPlayerId === this.userId) {
        this.promptMove();
      }
    });

    this.socket.on('move_made', (data) => {
      const { playerId, username, stonesToTake, stonesRemaining, nextPlayerId } = data.payload;
      
      console.log(`\n${username} took ${stonesToTake} stone(s)`);
      
      this.stonesRemaining = stonesRemaining;
      this.currentPlayerId = nextPlayerId;
      
      this.displayGameState();
      
      if (this.currentPlayerId === this.userId) {
        this.promptMove();
      } else {
        console.log('\nWaiting for opponent...');
      }
    });

    this.socket.on('game_over', (data) => {
      const { winnerUsername, loserUsername } = data.payload;
      
      console.log(`\n
╔════════════════════════════════════════════════════════════════╗
║                        GAME OVER!                              ║
╚════════════════════════════════════════════════════════════════╝
`);
      
      if (data.payload.winnerId === this.userId) {
        console.log(`  🎉 YOU WIN! 🎉`);
        console.log(`  ${loserUsername} took the last stone and lost!`);
      } else {
        console.log(`  😞 YOU LOSE!`);
        console.log(`  You took the last stone!`);
        console.log(`  ${winnerUsername} wins!`);
      }
      
      setTimeout(async () => {
        this.socket.disconnect();
        this.roomId = null;
        this.gameId = null;
        await this.showGameMenu();
      }, 3000);
    });

    this.socket.on('player_disconnected', (data) => {
      console.log(`\n✗ ${data.payload.username} disconnected from the game`);
      console.log('Returning to game menu...');
      
      setTimeout(async () => {
        this.socket.disconnect();
        this.roomId = null;
        this.gameId = null;
        await this.showGameMenu();
      }, 2000);
    });

    this.socket.on('error', (data) => {
      console.log(`\n✗ Error: ${data.payload.message}`);
    });

    this.socket.on('disconnect', () => {
      console.log('\n✗ Disconnected from game server');
    });
  }

  displayGameState() {
    console.log('\n' + '═'.repeat(65));
    console.log(`  Stones remaining: ${'●'.repeat(this.stonesRemaining)} (${this.stonesRemaining})`);
    console.log('═'.repeat(65));
    
    if (this.currentPlayerId === this.userId) {
      console.log('  >> YOUR TURN <<');
    } else {
      console.log(`  >> Opponent's turn <<`);
    }
  }

  async promptMove() {
    const move = await this.question('\nHow many stones do you want to take? (1, 2, or 3): ');
    const stonesToTake = parseInt(move);
    
    if (![1, 2, 3].includes(stonesToTake)) {
      console.log('Invalid move! You can only take 1, 2, or 3 stones.');
      return this.promptMove();
    }
    
    if (stonesToTake > this.stonesRemaining) {
      console.log(`Invalid move! Only ${this.stonesRemaining} stones remaining.`);
      return this.promptMove();
    }
    this.socket.emit('make_move', {
      gameId: this.gameId,
      userId: this.userId,
      stonesToTake
    });
  }

  logout() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.userId = null;
    this.username = null;
    this.token = null;
    this.roomId = null;
    this.gameId = null;
    
    console.log('\n✓ Logged out successfully');
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}
const client = new GameClient();
client.start().catch(console.error);
process.on('SIGINT', () => {
  console.log('\n\nGoodbye!');
  process.exit(0);
});
