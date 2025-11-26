import axios from 'axios';

const USER_SERVICE_URL = 'http://localhost:3001';
const ROOM_SERVICE_URL = 'http://localhost:3002';
const GAME_RULES_SERVICE_URL = 'http://localhost:3003';

class ApiService {  async register(username) {
    const response = await axios.post(`${USER_SERVICE_URL}/api/users/register`, {
      username
    });
    return response.data;
  }

  async login(username) {
    const response = await axios.post(`${USER_SERVICE_URL}/api/users/login`, {
      username
    });
    return response.data;
  }

  async getUser(userId) {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
    return response.data;
  }
  async createRoom(userId) {
    const response = await axios.post(`${ROOM_SERVICE_URL}/api/rooms/create`, {
      userId
    });
    return response.data;
  }

  async joinRoom(roomId, userId) {
    const response = await axios.post(`${ROOM_SERVICE_URL}/api/rooms/${roomId}/join`, {
      userId
    });
    return response.data;
  }

  async getAvailableRooms() {
    const response = await axios.get(`${ROOM_SERVICE_URL}/api/rooms/available/list`);
    return response.data;
  }

  async getRoom(roomId) {
    const response = await axios.get(`${ROOM_SERVICE_URL}/api/rooms/${roomId}`);
    return response.data;
  }
  async getGame(gameId) {
    const response = await axios.get(`${GAME_RULES_SERVICE_URL}/api/games/${gameId}`);
    return response.data;
  }
}

export default new ApiService();
