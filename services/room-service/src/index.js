const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const roomRoutes = require('./routes/roomRoutes');
const { setupWebSocketHandlers } = require('./websocket/handler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/rooms', roomRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'room-service' });
});

setupWebSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Room Service running on port ${PORT}`);
});