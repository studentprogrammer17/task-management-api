import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import { randomUUID } from 'crypto';

class DatabaseService {
  private static instance: DatabaseService;
  private db: Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await open({
      filename: path.resolve(__dirname, '../../database.sqlite'),
      driver: sqlite3.Database,
    });

    await this.createTables();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL CHECK(status IN ('todo', 'in-progress', 'done')),
        categoryId TEXT,
        userId TEXT,
        parentId TEXT,
        lat REAL,
        lng REAL,
        endTime TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        text TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        employeeCount INTEGER NOT NULL,
        phoneNumber TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        country TEXT NOT NULL,
        city TEXT NOT NULL,
        ownerFullName TEXT NOT NULL,
        description TEXT,
        image TEXT,
        userId TEXT,
        status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        roleId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    const adminId = randomUUID();
    const userId = randomUUID();

    await this.db.run(
      `INSERT INTO roles (id, name, createdAt)
       SELECT ?, 'admin', datetime('now')
       WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin')`,
      adminId
    );

    await this.db.run(
      `INSERT INTO roles (id, name, createdAt)
       SELECT ?, 'user', datetime('now')
       WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'user')`,
      userId
    );
  }

  public getDb(): Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }
}

export default DatabaseService;
