import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';

import { WSServer } from './websocket/websocket-server.js';
import { WebSocketHandlers } from './websocket/websocket-handlers.js';
import { WebSocketIntegrationService } from './services/websocket-integration.service.js';
import { WebSocketRouter } from './websocket/websocket-router.js';
import { generationRoutes } from './routes/generation.routes.js';
import { llmRoutes } from './routes/llm.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    websocket: {
      connections: wsServer?.getConnectedClients() || 0,
      status: wsServer ? 'running' : 'not initialized'
    }
  });
});

// API routes
app.use('/api/generate', generationRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/projects', projectRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize WebSocket infrastructure
let wsServer: WSServer;
let wsHandlers: WebSocketHandlers;
let wsIntegration: WebSocketIntegrationService;
let wsRouter: WebSocketRouter;

try {
  const WS_PORT = parseInt(process.env.WS_PORT || '3002');
  
  // Create WebSocket server
  wsServer = new WSServer(WS_PORT);
  
  // Create WebSocket handlers
  wsHandlers = new WebSocketHandlers(wsServer);
  
  // Create integration service
  wsIntegration = new WebSocketIntegrationService(wsHandlers);
  
  // Create message router
  wsRouter = new WebSocketRouter(wsIntegration);
  
  // Connect router to WebSocket server
  wsServer.setIntegrationService({
    handleMessage: (clientId: string, message: any) => {
      wsRouter.handleMessage(clientId, message).catch(error => {
        console.error('Router error:', error);
        wsServer.sendError(clientId, error.message || 'Message handling failed');
      });
    }
  });
  
  console.log(`🔌 WebSocket server initialized on port ${WS_PORT}`);
} catch (error) {
  console.error('❌ Failed to initialize WebSocket server:', error);
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server initialized`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  }
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('📴 Shutting down servers gracefully...');
  
  // Close WebSocket server
  if (wsServer) {
    wsServer.close();
  }
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ Servers closed successfully');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.log('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});