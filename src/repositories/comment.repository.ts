import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  Comment,
} from '../models/comment.model';
import { Task } from '../models/task.model';

class CommentRepository {
  private db = DatabaseService.getInstance();

  async createComment(comment: CreateCommentDto): Promise<Comment> {
    const db = this.db.getClient();

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const task = await db.query<Task>('SELECT * FROM tasks WHERE id = $1', [
      comment.taskId,
    ]);

    if (task.rows.length === 0) {
      throw new Error('Task not found');
    }

    await db.query(
      'INSERT INTO comments (id, text, taskId, createdAt) VALUES ($1, $2, $3, $4)',
      [id, comment.text, comment.taskId, createdAt]
    );

    return this.getCommentById(id);
  }

  async getAllComments(): Promise<Comment[]> {
    const db = this.db.getClient();

    const result = await db.query('SELECT * FROM comments');

    return result.rows;
  }

  async getCommentById(id: string): Promise<Comment> {
    const db = this.db.getClient();

    const result = await db.query<Comment>(
      'SELECT * FROM comments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Comment not found');
    }

    return result.rows[0];
  }

  async getCommentsByTaskId(id: string): Promise<Comment[]> {
    const db = this.db.getClient();

    const result = await db.query('SELECT * FROM comments WHERE taskId = $1', [
      id,
    ]);

    return result.rows;
  }

  async updateComment(
    id: string,
    updateData: UpdateCommentDto
  ): Promise<Comment> {
    const db = this.db.getClient();

    const result = await db.query('SELECT * FROM comments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new Error('Comment not found');
    }

    await db.query('UPDATE comments SET text = $1 WHERE id = $2', [
      updateData.text,
      id,
    ]);

    return this.getCommentById(id);
  }

  async deleteComment(id: string): Promise<void> {
    const db = this.db.getClient();

    const result = await db.query('SELECT * FROM comments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new Error('Comment not found');
    }

    await db.query('DELETE FROM comments WHERE id = $1', [id]);
  }
}

export default new CommentRepository();
