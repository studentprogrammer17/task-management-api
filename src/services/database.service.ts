import { Pool } from 'pg';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
dotenv.config();

class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;
  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
        ca: fs.readFileSync(
          path.join(__dirname, '../config/db-certificate.pem')
        ),
      },
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL
        );
      `);

      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_unique'
          ) THEN
            ALTER TABLE roles ADD CONSTRAINT roles_name_unique UNIQUE (name);
          END IF;
        END $$;
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          "roleId" UUID REFERENCES roles(id) ON DELETE CASCADE,
          "createdAt" TIMESTAMPTZ NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'done')),
          "categoryId" UUID REFERENCES categories(id) ON DELETE CASCADE,
          "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
          "parentId" UUID REFERENCES tasks(id) ON DELETE CASCADE,
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          "endTime" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id UUID PRIMARY KEY,
          "taskId" UUID REFERENCES tasks(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS businesses (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          "employeeCount" INTEGER NOT NULL,
          "phoneNumber" TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          country TEXT NOT NULL,
          city TEXT NOT NULL,
          "ownerFullName" TEXT NOT NULL,
          description TEXT,
          image TEXT,
          "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
          "createdAt" TIMESTAMPTZ NOT NULL
        );
      `);

      const now = new Date().toISOString();

      await client.query(
        `
        INSERT INTO roles (id, name, "createdAt")
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING
        `,
        [randomUUID(), 'admin', now]
      );

      await client.query(
        `
        INSERT INTO roles (id, name, "createdAt")
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING
        `,
        [randomUUID(), 'user', now]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public getClient() {
    return this.pool;
  }
}

export default DatabaseService;
