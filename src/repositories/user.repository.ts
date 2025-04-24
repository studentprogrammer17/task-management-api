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

  async createUser(user: CreateUserDto, role: string): Promise<Omit<User, 'password'>> {
    const db = this.db.getDb();

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const isUser = await db.get<User>('SELECT * FROM users WHERE email = ?', [
      user.email,
    ]);

    if (isUser) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userRole = await db.get("SELECT * FROM roles WHERE name = ?", [role])
    await db.run(
      'INSERT INTO users (id, name, email, password, roleId, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, user.name, user.email, hashedPassword, userRole.id, createdAt]
    );

    return this.getUserById(id);
  }

  async login(user: LoginDto): Promise<string> {
    const db = this.db.getDb();

    const currentUser = await db.get<User>(
      'SELECT * FROM users WHERE email = ?',
      [user.email]
    );

    if (!currentUser) {
      throw new Error('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(
      user.password,
      currentUser.password
    );
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    const token = jwt.sign(
      { id: currentUser.id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '1h',
      }
    );

    return token;
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const db = this.db.getDb();

    const users = await db.all<Omit<User, 'password'>[]>(
      `SELECT u.id, u.name, u.email, u.createdAt, r.name AS role
       FROM users u
       JOIN roles r ON u.roleId = r.id`
    );

    return users;
  }

  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const db = this.db.getDb();

    const user = await db.get<User & { role: string }>(
      `SELECT u.id, u.name, u.email, u.password, u.createdAt, r.name AS role
       FROM users u
       JOIN roles r ON u.roleId = r.id
       WHERE u.id = ?`,
      [id]
    );

    if (!user) {
      throw new Error('User not found');
    }

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    userId: string,
    updateData: UpdateUserDto
  ): Promise<Omit<User, 'password'>> {
    const db = this.db.getDb();
    const existingUser = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const user = await db.get(
      `SELECT u.roleId, r.name AS roleName
       FROM users u
       JOIN roles r ON u.roleId = r.id
       WHERE u.id = ?`,
      [userId]
    );
  
    if (userId !== id && user.roleName !== 'admin') {
      throw new Error("Updating user is forbidden");
    }

    let updateQuery = 'UPDATE users SET ';
    const updateValues: any[] = [];

    if (updateData.name !== undefined) {
      updateQuery += 'name = ?, ';
      updateValues.push(updateData.name);
    }

    if (updateData.email !== undefined) {
      const isEmail = await db.get('SELECT * FROM users WHERE email = ?', [
        updateData.email,
      ]);
      if (isEmail) {
        throw new Error('Email alredy in use');
      }
      updateQuery += 'email = ?, ';
      updateValues.push(updateData.email);
    }

    updateQuery = updateQuery.slice(0, -2);

    updateQuery += ' WHERE id = ?';
    updateValues.push(id);

    if (updateValues.length > 1) {
      await db.run(updateQuery, updateValues);
    }

    const updatedUser = await this.getUserById(id);

    return updatedUser;
  }

  async deleteUser(id: string, userId: string): Promise<void> {
    const db = this.db.getDb();

    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);

    if (!user) {
      throw new Error('User not found');
    }

    const currentUser = await db.get(
      `SELECT u.roleId, r.name AS roleName
       FROM users u
       JOIN roles r ON u.roleId = r.id
       WHERE u.id = ?`,
      [userId]
    );
    
    if(id !== userId && currentUser.roleName !== 'admin') {
      throw new Error("Deleting user is forbidden");
    }

    const tasks = await db.all("SELECT * FROM tasks WHERE userId = ?", [id])

    if(tasks) {
      await db.run("DELETE FROM tasks where userId = ?", [id])
    }
    
    await db.run('DELETE FROM users WHERE id = ?', [id]);
  }

  async changePassword(
    passwordData: ChangePasswordDto,
    userId: string
  ): Promise<void> {
    const db = this.db.getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      passwordData.oldPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [
      hashedPassword,
      userId,
    ]);
  }
}

export default new UserRepository();
