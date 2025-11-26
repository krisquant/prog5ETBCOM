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
  if (req.path !== '/health') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

app.use('/api/rooms', roomRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    service: 'room-service', 
    status: 'ok'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Something went wrong' });
});


const wsHandler = new WebSocketHandler(io);
wsHandler.initialize();
console.log('WebSocket handler initialized');

server.listen(PORT, () => {
  console.log(`Room Service running on port ${PORT}`);
  console.log('WebSocket ready at ws://localhost:' + PORT);
  
});