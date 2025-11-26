const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[USER-SERVICE] ${req.method} ${req.path}`);
  next();
});
app.use('/api/users', userRoutes);
app.get('/health', (req, res) => {
  res.json({ 
    service: 'user-service', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use((err, req, res, next) => {
  console.error('[USER-SERVICE] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║          USER SERVICE - 21 STONES GAME                   ║
╚══════════════════════════════════════════════════════════╝
  
  Service running on: http://localhost:${PORT}
  Health check: http://localhost:${PORT}/health
  Status: Ready to accept connections
  `);
});
