const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors()); // Allow all cross-origins for easy frontend integration
app.use(express.json());

// Routes mapping
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/production-costs', require('./routes/productionCosts'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));

// Base route for API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'PrecificaPro SaaS Backend',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Ocorreu um erro interno no servidor.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  PrecificaPro SaaS Backend running on port ${PORT}`);
  console.log(`  API health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=============================================`);
});
