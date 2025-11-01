const express = require('express');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.use('/api/games', gameRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'game-rules-service' });
});

app.listen(PORT, () => {
  console.log(`Game Rules Service running on port ${PORT}`);
});