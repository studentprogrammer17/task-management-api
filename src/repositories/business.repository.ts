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
    const db = this.db.getClient();

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const result = await db.query<Business>(
      'SELECT * FROM businesses WHERE email = $1',
      [data.email]
    );

    if (result.rows.length > 0) {
      throw new Error('Business with this email already exists');
    }

    const userResult = await db.query(
      `SELECT u."roleId", r.name, u.name AS "roleName"
       FROM users u
       JOIN roles r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [userId]
    );
    const user = userResult.rows[0];

    await db.query(
      `INSERT INTO businesses (
        id, name, "employeeCount", "phoneNumber", email, 
        country, city, "ownerFullName", description, image, "userId", status, "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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

  async getAllBusinesses(userId: string): Promise<Business[]> {
    const db = this.db.getClient();
    const result = await db.query(
      'SELECT * FROM businesses WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );

    return result.rows;
  }

  async getBusinessesByStatus(status: string): Promise<Business[]> {
    const db = this.db.getClient();
    const result = await db.query(
      'SELECT * FROM businesses WHERE status = $1 ORDER BY "createdAt" DESC',
      [status]
    );

    return result.rows;
  }

  async changeStatus(id: string, status: BUSINESS_STATUS): Promise<Business> {
    const db = this.db.getClient();

    const result = await db.query<Business>(
      'SELECT * FROM businesses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Business not found');
    }

    await db.query(`UPDATE businesses SET status = $1 WHERE id = $2`, [
      status,
      id,
    ]);

    return this.getBusinessById(id);
  }

  async getUserBusinesses(userId: string): Promise<Business[]> {
    const db = this.db.getClient();
    const result = await db.query(
      'SELECT * FROM businesses WHERE userId = $1 ORDER BY "createdAt" DESC',
      [userId]
    );

    return result.rows;
  }

  async getBusinessById(id: string): Promise<Business> {
    const db = this.db.getClient();

    const result = await db.query<Business>(
      'SELECT * FROM businesses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Business not found');
    }

    return result.rows[0];
  }

  async updateBusiness(
    id: string,
    userId: string,
    data: UpdateBusinessDto
  ): Promise<Business> {
    const db = this.db.getClient();

    const result = await db.query<Business>(
      'SELECT * FROM businesses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Business not found');
    }

    const business = result.rows[0];

    const currentUserResult = await db.query(
      `SELECT u."roleId", r.name AS "roleName"
       FROM users u
       JOIN roles r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [userId]
    );
    const currentUser = currentUserResult.rows[0];

    if (business.userId !== userId && currentUser.roleName !== 'admin') {
      throw new Error('Updating business is forbidden');
    }

    if (data.email && data.email !== business.email) {
      const existingBusiness = await db.query<Business>(
        'SELECT * FROM businesses WHERE email = $1 AND id != $2',
        [data.email, id]
      );

      if (existingBusiness.rows.length > 0) {
        throw new Error('Business with this email already exists');
      }
    }

    if (data.image && business.image) {
      const oldImagePath = path.join(this.uploadDir, business.image);
      await this.deleteImage(oldImagePath);
    }

    await db.query(
      `UPDATE businesses SET 
        name = $1, "employeeCount" = $2, "phoneNumber" = $3, email = $4,
        country = $5, city = $6, description = $7, image = $8
      WHERE id = $9`,
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
    const db = this.db.getClient();

    const result = await db.query<Business>(
      'SELECT * FROM businesses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Business not found');
    }

    const business = result.rows[0];

    const currentUserResult = await db.query(
      `SELECT u."roleId", r.name AS "roleName"
       FROM users u
       JOIN roles r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [userId]
    );
    const currentUser = currentUserResult.rows[0];

    if (business.userId !== userId && currentUser.roleName !== 'admin') {
      throw new Error('Deleting business is forbidden');
    }

    if (business.image) {
      const imagePath = path.join(this.uploadDir, business.image);
      await this.deleteImage(imagePath);
    }

    await db.query('DELETE FROM businesses WHERE id = $1', [id]);
  }
}

export default new BusinessRepository();
