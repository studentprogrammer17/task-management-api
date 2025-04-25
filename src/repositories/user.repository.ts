import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  LoginDto,
  UpdateUserDto,
  User,
} from '../models/user.model';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

class UserRepository {
  private db = DatabaseService.getInstance();

  async createUser(
    user: CreateUserDto,
    role: string
  ): Promise<Omit<User, 'password'>> {
    const db = this.db.getClient();

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const isUser = await db.query('SELECT * FROM users WHERE email = $1', [
      user.email,
    ]);

    if (isUser.rows.length > 0) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userRole = await db.query('SELECT * FROM roles WHERE name = $1', [
      role,
    ]);

    const res = await db.query(
      'INSERT INTO users (id, name, email, password, "roleId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6)',
      [
        id,
        user.name,
        user.email,
        hashedPassword,
        userRole.rows[0].id,
        createdAt,
      ]
    );

    return this.getUserById(id);
  }

  async login(user: LoginDto): Promise<string> {
    const db = this.db.getClient();

    const currentUser = await db.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [user.email]
    );

    if (currentUser.rows.length === 0) {
      throw new Error('Invalid username or password');
    }

    const foundUser = currentUser.rows[0];

    const isPasswordValid = await bcrypt.compare(
      user.password,
      foundUser.password
    );
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    const token = jwt.sign(
      { id: foundUser.id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '1h',
      }
    );

    return token;
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const db = this.db.getClient();

    try {
      const result = await db.query(
        `SELECT u.id, u.name, u.email, u."createdAt", r.name AS role
         FROM users u
         JOIN roles r ON u."roleId" = r.id`
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching users`);
    }
  }

  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const db = this.db.getClient();

    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.password, u."createdAt", r.name AS role
       FROM users u
       JOIN roles r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const { password, ...userWithoutPassword } = result.rows[0];

    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    userId: string,
    updateData: UpdateUserDto
  ): Promise<Omit<User, 'password'>> {
    const db = this.db.getClient();

    const existingUser = await db.query('SELECT * FROM users WHERE id = $1', [
      id,
    ]);
    if (existingUser.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = await db.query(
      `SELECT u."roleId", r.name AS roleName
       FROM users u
       JOIN roles r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userId !== id && user.rows[0].roleName !== 'admin') {
      throw new Error('Updating user is forbidden');
    }

    const updateValues: any[] = [];
    const setStatements: string[] = [];
    let placeholderIndex = 1;

    if (updateData.name !== undefined) {
      setStatements.push(`name = $${placeholderIndex}`);
      updateValues.push(updateData.name);
      placeholderIndex++;
    }

    if (updateData.email !== undefined) {
      const isEmail = await db.query('SELECT * FROM users WHERE email = $1', [
        updateData.email,
      ]);
      if (isEmail.rows.length > 0) {
        throw new Error('Email already in use');
      }
      setStatements.push(`email = $${placeholderIndex}`);
      updateValues.push(updateData.email);
      placeholderIndex++;
    }

    if (setStatements.length > 0) {
      setStatements.push(`id = $${placeholderIndex}`);
      updateValues.push(id);
      await db.query(
        `UPDATE users SET ${setStatements.join(
          ', '
        )} WHERE id = $${placeholderIndex}`,
        updateValues
      );
    }

    return this.getUserById(id);
  }

  async deleteUser(id: string, userId: string): Promise<void> {
    const db = this.db.getClient();

    const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);

    if (user.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentUser = await db.query(
      `SELECT u."roleId", r.name AS roleName
       FROM users u
       JOIN roles r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (id !== userId && currentUser.rows[0].roleName !== 'admin') {
      throw new Error('Deleting user is forbidden');
    }

    await db.query('DELETE FROM tasks WHERE "userId" = $1', [id]);
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }

  async changePassword(
    passwordData: ChangePasswordDto,
    userId: string
  ): Promise<void> {
    const db = this.db.getClient();
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (user.rows.length === 0) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      passwordData.oldPassword,
      user.rows[0].password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [
      hashedPassword,
      userId,
    ]);
  }
}

export default new UserRepository();
