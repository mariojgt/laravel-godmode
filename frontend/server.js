// Load environment variables from root .env file
require('dotenv').config({ path: '../.env' });

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.FRONTEND_PORT || process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend server running on port ${PORT}`);
  console.log(`📍 Open: http://localhost:${PORT}`);
});
