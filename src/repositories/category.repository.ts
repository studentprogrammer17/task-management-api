import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  Category,
} from '../models/category.model';
import { NOTFOUND } from 'sqlite3';
import { Task } from '../models/task.model';

class CategoryRepository {
  private db = DatabaseService.getInstance();

  async createCategory(category: CreateCategoryDto): Promise<Category> {
    const db = this.db.getDb();

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const isCategory = await db.get<Category>(
      'SELECT * FROM categories WHERE name = ?',
      [category.name]
    );

    if (isCategory) {
      throw new Error('Such category already exist');
    }

    await db.run(
      'INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?)',
      [id, category.name, createdAt]
    );

    return this.getCategoryById(id);
  }

  async getAllCategories(): Promise<Category[]> {
    const db = this.db.getDb();

    const categories = await db.all<Category[]>('SELECT * FROM categories');

    return categories;
  }

  async getCategoryById(id: string): Promise<Category> {
    const db = this.db.getDb();

    const category = await db.get<Category>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  async tasksByCategory(id: string, userId: string): Promise<Task[]> {
    const db = this.db.getDb();

    const tasks = await db.all<Task[]>(
      'SELECT * FROM tasks WHERE categoryId = ? AND userId = ?',
      [id, userId]
    );

    return tasks;
  }

  async updateCategory(
    id: string,
    updateData: UpdateCategoryDto
  ): Promise<Category> {
    const db = this.db.getDb();

    const category = await db.get('SELECT * FROM categories WHERE id = ?', [
      id,
    ]);
    if (!category) {
      throw new Error('Category not found');
    }

    const isCategory = await db.get<Category>(
      'SELECT * FROM categories WHERE name = ?',
      [updateData.name]
    );

    if (isCategory) {
      throw new Error('Such category already exist');
    }

    await db.run('UPDATE categories SET name = ? WHERE id = ?', [
      updateData.name,
      id,
    ]);

    return this.getCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    const db = this.db.getDb();

    const category = await db.get('SELECT * FROM categories WHERE id = ?', [
      id,
    ]);
    if (!category) {
      throw new Error('Category not found');
    }
    const tasks = await db.all<Task[]>(
      'SELECT * FROM tasks WHERE categoryId = ?',
      [id]
    );
    if (tasks.length > 0) {
      throw new Error('Category cant be delete because it has related tasks');
    }

    await db.run('DELETE FROM categories WHERE id = ?', [id]);
  }
}

export default new CategoryRepository();
