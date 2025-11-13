import axios from 'axios';

const API_BASE = {
  USER: 'http://localhost:3001/api/users',
  ROOM: 'http://localhost:3002/api/rooms',
  GAME: 'http://localhost:3003/api/games'
};

export const api = {
  register: async (username) => {
    const res = await axios.post(`${API_BASE.USER}/register`, { username });
    return res.data;
  },

  login: async (username) => {
    const res = await axios.post(`${API_BASE.USER}/login`, { username });
    return res.data;
  },

  getUser: async (userId) => {
    const res = await axios.get(`${API_BASE.USER}/${userId}`);
    return res.data;
  },

  createRoom: async (userId) => {
    const res = await axios.post(`${API_BASE.ROOM}/create`, { userId });
    return res.data;
  },

  joinRoom: async (roomId, userId) => {
    const res = await axios.post(`${API_BASE.ROOM}/${roomId}/join`, { userId });
    return res.data;
  },

  getAvailableRooms: async () => {
    const res = await axios.get(`${API_BASE.ROOM}/available/list`);
    return res.data;
  }
};