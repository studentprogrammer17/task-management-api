// import { createClient } from 'redis';

// const redisClient = createClient({
//   url: process.env.REDIS_URL || 'redis://localhost:6379',
//   socket: {
//     reconnectStrategy: retries => Math.min(retries * 50, 1000),
//   },
// });

// redisClient.on('error', err => console.error('Redis Client Error', err));
// redisClient.on('connect', () => console.log('Redis Client Connected'));

// export default redisClient;
