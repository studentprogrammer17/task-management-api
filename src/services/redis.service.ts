// import redisClient from '../config/redis.config';

// class RedisService {
//   private static instance: RedisService;
//   private client = redisClient;
//   private isConnected = false;

//   private constructor() {
//     this.initializeConnection();
//   }

//   private async initializeConnection() {
//     try {
//       if (!this.client.isOpen) {
//         await this.client.connect();
//         this.isConnected = true;
//         console.log('Redis connected successfully');
//       }
//     } catch (error) {
//       console.error('Failed to connect to Redis:', error);
//       this.isConnected = false;
//     }
//   }

//   public static getInstance(): RedisService {
//     if (!RedisService.instance) {
//       RedisService.instance = new RedisService();
//     }
//     return RedisService.instance;
//   }

//   async connect() {
//     if (!this.isConnected) {
//       await this.initializeConnection();
//     }
//   }

//   async disconnect() {
//     if (this.client.isOpen) {
//       await this.client.disconnect();
//       this.isConnected = false;
//       console.log('Redis disconnected');
//     }
//   }

//   async set(key: string, value: string, expireSeconds?: number): Promise<void> {
//     try {
//       await this.connect();
//       if (expireSeconds) {
//         await this.client.set(key, value, { EX: expireSeconds });
//       } else {
//         await this.client.set(key, value);
//       }
//     } catch (error) {
//       console.error(`Failed to set Redis key ${key}:`, error);
//       throw error;
//     }
//   }

//   async get(key: string): Promise<string | null> {
//     try {
//       await this.connect();
//       return await this.client.get(key);
//     } catch (error) {
//       console.error(`Failed to get Redis key ${key}:`, error);
//       throw error;
//     }
//   }

//   async del(key: string): Promise<void> {
//     try {
//       await this.connect();
//       await this.client.del(key);
//     } catch (error) {
//       console.error(`Failed to delete Redis key ${key}:`, error);
//       throw error;
//     }
//   }

//   async setJSON<T>(
//     key: string,
//     value: T,
//     expireSeconds?: number
//   ): Promise<void> {
//     try {
//       await this.connect();
//       const stringValue = JSON.stringify(value);
//       if (expireSeconds) {
//         await this.client.set(key, stringValue, { EX: expireSeconds });
//       } else {
//         await this.client.set(key, stringValue);
//       }
//     } catch (error) {
//       console.error(`Failed to set JSON Redis key ${key}:`, error);
//       throw error;
//     }
//   }

//   async getJSON<T>(key: string): Promise<T | null> {
//     try {
//       await this.connect();
//       const value = await this.client.get(key);
//       return value ? JSON.parse(value) : null;
//     } catch (error) {
//       console.error(`Failed to get JSON Redis key ${key}:`, error);
//       throw error;
//     }
//   }

//   async exists(key: string): Promise<boolean> {
//     try {
//       await this.connect();
//       return (await this.client.exists(key)) === 1;
//     } catch (error) {
//       console.error(`Failed to check existence of Redis key ${key}:`, error);
//       throw error;
//     }
//   }
// }

// export default RedisService;
