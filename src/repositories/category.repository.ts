import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  Category,
} from '../models/category.model';
import { Task } from '../models/task.model';

class CategoryRepository {
  private db = DatabaseService.getInstance();

  async createCategory(category: CreateCategoryDto): Promise<Category> {
    const db = this.db.getClient();

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const result = await db.query<Category>(
      'SELECT * FROM categories WHERE name = $1',
      [category.name]
    );

    if (result.rows.length > 0) {
      throw new Error('Such category already exists');
    }

    await db.query(
      'INSERT INTO categories (id, name, createdAt) VALUES ($1, $2, $3)',
      [id, category.name, createdAt]
    );

    return this.getCategoryById(id);
  }

  async getAllCategories(): Promise<Category[]> {
    const db = this.db.getClient();

    const result = await db.query<Category>('SELECT * FROM categories');

    return result.rows;
  }

  async getCategoryById(id: string): Promise<Category> {
    const db = this.db.getClient();

    const result = await db.query<Category>(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }

    return result.rows[0];
  }

  async tasksByCategory(id: string, userId: string): Promise<Task[]> {
    const db = this.db.getClient();

    const result = await db.query(
      'SELECT * FROM tasks WHERE categoryId = $1 AND userId = $2',
      [id, userId]
    );

    return result.rows;
  }

  async updateCategory(
    id: string,
    updateData: UpdateCategoryDto
  ): Promise<Category> {
    const db = this.db.getClient();

    const result = await db.query('SELECT * FROM categories WHERE id = $1', [
      id,
    ]);
    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }

    const existingCategory = await db.query<Category>(
      'SELECT * FROM categories WHERE name = $1',
      [updateData.name]
    );

    if (existingCategory.rows.length > 0) {
      throw new Error('Such category already exists');
    }

    await db.query('UPDATE categories SET name = $1 WHERE id = $2', [
      updateData.name,
      id,
    ]);

    return this.getCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    const db = this.db.getClient();

    const result = await db.query('SELECT * FROM categories WHERE id = $1', [
      id,
    ]);
    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }

    const tasks = await db.query<Task[]>(
      'SELECT * FROM tasks WHERE categoryId = $1',
      [id]
    );
    if (tasks.rows.length > 0) {
      throw new Error("Category can't be deleted because it has related tasks");
    }

    await db.query('DELETE FROM categories WHERE id = $1', [id]);
  }
}

export default new CategoryRepository();
