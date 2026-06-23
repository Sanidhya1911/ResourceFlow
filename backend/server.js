require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes     = require('./routes/auth');
const resourceRoutes = require('./routes/resources');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/resources', resourceRoutes);

// Health check endpoints for production tracking
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

// FIX: Added '0.0.0.0' to explicitly bind to all network interfaces for Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});