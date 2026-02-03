import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/auth.routes';
import restaurantRoutes from './routes/restaurant.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import adminDriverRoutes from './routes/admin-driver.routes';
import userRoutes from './routes/user.routes';
import driverRoutes from './routes/driver.routes';
import { prisma } from './config/prisma';
import { initializeWebSocket } from './config/socket';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3100;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize WebSocket server
const io = initializeWebSocket(httpServer);

// Store io instance in app for controller access
app.set('io', io);

// Middleware
app.use(express.json());
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Swagger Documentation
const swaggerDocument = YAML.load(path.join(__dirname, 'docs/swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/auth', authRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/admin', adminDriverRoutes); // Nested for /admin/drivers
app.use('/users', userRoutes);
app.use('/drivers', driverRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to ServeSync API',
    features: ['REST API', 'WebSocket Support'],
    websocket: 'Connect to / with Socket.io client'
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    websocket: io ? 'Connected' : 'Not initialized'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');

  // Close WebSocket connections
  io.close(() => {
    console.log('✅ WebSocket server closed');
  });

  // Disconnect Prisma
  await prisma.$disconnect();
  console.log('✅ Database disconnected');

  process.exit(0);
});

// Start server (use httpServer instead of app)
httpServer.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
  console.log(`🌐 WebSocket server ready on ws://localhost:${port}`);
});

