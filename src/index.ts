import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { prisma } from './config/prisma';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3100;

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to ServeSync API' });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
