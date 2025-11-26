const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const roomRoutes = require('./routes/roomRoutes');
const WebSocketHandler = require('./websocket/handler');

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


app.use((req, res, next) => {
  console.log(`[ROOM-SERVICE] ${req.method} ${req.path}`);
  next();
});


app.use('/api/rooms', roomRoutes);


app.get('/health', (req, res) => {
  res.json({ 
    service: 'room-service', 
    status: 'running',
    websocket: 'enabled',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use((err, req, res, next) => {
  console.error('[ROOM-SERVICE] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
const wsHandler = new WebSocketHandler(io);
wsHandler.initialize();
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║        ROOM SERVICE - 21 STONES GAME                     ║
╚══════════════════════════════════════════════════════════╝
  
  Service running on: http://localhost:${PORT}
  WebSocket: ws://localhost:${PORT}
  Health check: http://localhost:${PORT}/health
  Status: Ready to accept connections
  `);
});
