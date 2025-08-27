// Load environment variables from root .env file
require('dotenv').config({ path: '../../.env' });

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');

const projectRoutes = require('./routes/projects');
const templateRoutes = require('./routes/templates');
const terminalRoutes = require('./routes/terminal');
const envRoutes = require('./routes/env');
const laravelRoutes = require('./routes/laravel');
const servicesRoutes = require('./routes/services');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add debugging middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/env', envRoutes);
app.use('/api/laravel', laravelRoutes);
app.use('/api/services', servicesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'app-manager-backend',
    port: PORT,
    cors: 'enabled'
  });
});

// WebSocket handling for real-time logs
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected from:', req.headers.origin);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'subscribe_logs':
      // Handle log subscription
      console.log('Client subscribed to logs for project:', data.projectId);
      break;
    case 'terminal_input':
      // Handle terminal input
      console.log('Terminal input received:', data.input);
      break;
    default:
      console.log('Unknown WebSocket message type:', data.type);
  }
}

const PORT = process.env.BACKEND_PORT || process.env.PORT || 5001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 WebSocket server ready`);
  console.log(`🌐 CORS enabled for frontend ports`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
