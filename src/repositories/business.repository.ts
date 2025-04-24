import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database.service';
import {
  Business,
  CreateBusinessDto,
  UpdateBusinessDto,
} from '../models/business.model';
import fs from 'fs';
import path from 'path';
import { BUSINESS_STATUS } from '../enums/business-status.enum';
import { User } from '../models/user.model';
import { ROLES } from '../enums/role.enum';

class BusinessRepository {
  private db = DatabaseService.getInstance();
  private uploadDir = path.join(__dirname, '../../uploads/businesses');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private async deleteImage(imagePath: string): Promise<void> {
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  async createBusiness(
    data: CreateBusinessDto,
    userId: string
  ): Promise<Business> {
    const db = this.db.getDb();

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const existingBusiness = await db.get<Business>(
      'SELECT * FROM businesses WHERE email = ?',
      [data.email]
    );

    if (existingBusiness) {
      throw new Error('Business with this email already exists');
    }

    const user = await db.get(
      `SELECT u.roleId, r.name, u.name AS roleName
       FROM users u
       JOIN roles r ON u.roleId = r.id
       WHERE u.id = ?`,
      [userId]
    );

    await db.run(
      `INSERT INTO businesses (
        id, name, employeeCount, phoneNumber, email, 
        country, city, ownerFullName, description, image, userId, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.employeeCount,
        data.phoneNumber,
        data.email,
        data.country,
        data.city,
        user?.name,
        data.description || '',
        data.image || null,
        userId,
        user.roleName === ROLES.ADMIN
          ? BUSINESS_STATUS.APPROVED
          : BUSINESS_STATUS.PENDING,
        createdAt,
      ]
    );

    return this.getBusinessById(id);
  }

  async getAllBusinesses(): Promise<Business[]> {
    const db = this.db.getDb();
    return db.all<Business[]>(
      'SELECT * FROM businesses WHERE status = ? ORDER BY createdAt DESC',
      ['approved']
    );
  }

  async getAllBusinessesByAdmin(): Promise<Business[]> {
    const db = this.db.getDb();
    return db.all<Business[]>(
      'SELECT * FROM businesses ORDER BY createdAt DESC'
    );
  }

  async changeStatus(id: string, status: BUSINESS_STATUS): Promise<Business> {
    const db = this.db.getDb();

    const business = await db.get<Business>(
      'SELECT * FROM businesses WHERE id = ?',
      [id]
    );

    if (!business) {
      throw new Error('Business not found');
    }

    await db.run(`UPDATE businesses SET status = ? WHERE id = ?`, [status, id]);

    return this.getBusinessById(id);
  }

  async getUserBusinesses(userId: string): Promise<Business[]> {
    const db = this.db.getDb();
    return db.all<Business[]>(
      'SELECT * FROM businesses WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );
  }

  async getBusinessById(id: string): Promise<Business> {
    const db = this.db.getDb();

    const business = await db.get<Business>(
      'SELECT * FROM businesses WHERE id = ?',
      [id]
    );

    if (!business) {
      throw new Error('Business not found');
    }

    return business;
  }

  async updateBusiness(
    id: string,
    userId: string,
    data: UpdateBusinessDto
  ): Promise<Business> {
    const db = this.db.getDb();

    const business = await db.get<Business>(
      'SELECT * FROM businesses WHERE id = ?',
      [id]
    );

    if (!business) {
      throw new Error('Business not found');
    }

    const currentUser = await db.get(
      `SELECT u.roleId, r.name AS roleName
       FROM users u
       JOIN roles r ON u.roleId = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (business.userId !== userId && currentUser.roleName !== 'admin') {
      throw new Error('Updating business is forbidden');
    }

    if (data.email && data.email !== business.email) {
      const existingBusiness = await db.get<Business>(
        'SELECT * FROM businesses WHERE email = ? AND id != ?',
        [data.email, id]
      );

      if (existingBusiness) {
        throw new Error('Business with this email already exists');
      }
    }

    if (data.image && business.image) {
      const oldImagePath = path.join(this.uploadDir, business.image);
      await this.deleteImage(oldImagePath);
    }

    await db.run(
      `UPDATE businesses SET 
        name = ?, employeeCount = ?, phoneNumber = ?, email = ?,
        country = ?, city = ?, description = ?, image = ?
      WHERE id = ?`,
      [
        data.name || business.name,
        data.employeeCount || business.employeeCount,
        data.phoneNumber || business.phoneNumber,
        data.email || business.email,
        data.country || business.country,
        data.city || business.city,
        data.description || business.description,
        data.image || business.image,
        id,
      ]
    );

    return this.getBusinessById(id);
  }

  async deleteBusiness(id: string, userId: string): Promise<void> {
    const db = this.db.getDb();

    const business = await db.get<Business>(
      'SELECT * FROM businesses WHERE id = ?',
      [id]
    );

    if (!business) {
      throw new Error('Business not found');
    }

    const currentUser = await db.get(
      `SELECT u.roleId, r.name AS roleName
       FROM users u
       JOIN roles r ON u.roleId = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (business.userId !== userId && currentUser.roleName !== 'admin') {
      throw new Error('Deleting business is forbidden');
    }

    if (business.image) {
      const imagePath = path.join(this.uploadDir, business.image);
      await this.deleteImage(imagePath);
    }

    await db.run('DELETE FROM businesses WHERE id = ?', [id]);
  }
}

export default new BusinessRepository();
