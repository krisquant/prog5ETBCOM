const express = require('express');
const cors = require('cors');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
  console.log(`[GAME-RULES] ${req.method} ${req.path}`);
  next();
});


app.use('/api/games', gameRoutes);


app.get('/health', (req, res) => {
  res.json({ 
    service: 'game-rules-service', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


app.use((err, req, res, next) => {
  console.error('[GAME-RULES] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║       GAME RULES SERVICE - 21 STONES GAME                ║
╚══════════════════════════════════════════════════════════╝
  
  Service running on: http://localhost:${PORT}
  Health check: http://localhost:${PORT}/health
  Status: Ready to accept connections
  `);
});
