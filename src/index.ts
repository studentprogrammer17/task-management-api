import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/task.route';
import commentRoutes from './routes/comment.route';
import categoryRoutes from './routes/category.route';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import DatabaseService from './services/database.service';
import businessRoutes from './routes/business.route';
// import RedisService from './services/redis.service';
import CronService from './services/cron.service';
import EmailService from './services/email.service';

import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['https://task-management-frontend-steel.vercel.app'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/tasks', taskRoutes);
app.use('/comments', commentRoutes);
app.use('/categories', categoryRoutes);
app.use('/businesses', businessRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  }
);

const startServer = async () => {
  try {
    const dbService = DatabaseService.getInstance();
    await dbService.initialize();
    console.log('Database initialized successfully');

    // const redisService = RedisService.getInstance();
    // await redisService.connect();

    const emailService = EmailService.getInstance();
    await emailService.initialize();

    const cronService = CronService.getInstance();
    cronService.startCronJob();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// process.on('SIGTERM', async () => {
//   const redisService = RedisService.getInstance();
//   await redisService.disconnect();

//   const cronService = CronService.getInstance();
//   cronService.stopCronJob();

//   process.exit(0);
// });
