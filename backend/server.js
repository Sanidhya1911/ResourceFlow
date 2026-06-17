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

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));