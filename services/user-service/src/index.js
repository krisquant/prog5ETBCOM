const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
  if (req.path !== '/health') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    service: 'user-service', 
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

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
  console.log('Health check available at /health');
});