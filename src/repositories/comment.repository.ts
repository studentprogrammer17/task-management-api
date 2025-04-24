import { v4 as uuidv4 } from "uuid";
import DatabaseService from "../services/database.service";
import {
  CreateCommentDto,
  UpdateCommentDto,
  Comment,
} from "../models/comment.model";
import { Task } from "../models/task.model";
import { NOTFOUND } from "sqlite3";

class CommentRepository {
  private db = DatabaseService.getInstance();

  async createComment(comment: CreateCommentDto): Promise<Comment> {
    const db = this.db.getDb();

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const task = await db.get<Task>("SELECT * FROM tasks WHERE id = ?", [
      comment.taskId,
    ]);
    if (!task) {
      throw new Error("Task not found");
    }
    await db.run(
      "INSERT INTO comments (id, text, taskId, createdAt) VALUES (?, ?, ?, ?)",
      [id, comment.text, comment.taskId, createdAt]
    );

    return this.getCommentById(id);
  }

  async getAllComments(): Promise<Comment[]> {
    const db = this.db.getDb();

    const comments = await db.all<Comment[]>("SELECT * FROM comments");

    return comments;
  }

  async getCommentById(id: string): Promise<Comment> {
    const db = this.db.getDb();

    const comment = await db.get<Comment>(
      "SELECT * FROM comments WHERE id = ?",
      [id]
    );

    if (!comment) {
      throw new Error("Comment not found");
    }

    return comment;
  }

  async getCommentsByTaskId(id: string): Promise<Comment[]> {
    const db = this.db.getDb();

    const comments = await db.all<Comment[]>(
      "SELECT * FROM comments WHERE taskId = ?",
      [id]
    );

    return comments;
  }

  async updateComment(
    id: string,
    updateData: UpdateCommentDto
  ): Promise<Comment> {
    const db = this.db.getDb();

    const comment = await db.get("SELECT * FROM comments WHERE id = ?", [id]);
    if (!comment) {
      throw new Error("Comment not found");
    }

    await db.run("UPDATE comments SET text = ? WHERE id = ?", [
      updateData.text,
      id,
    ]);

    return this.getCommentById(id);
  }

  async deleteComment(id: string): Promise<void> {
    const db = this.db.getDb();

    const comment = await db.get("SELECT * FROM comments WHERE id = ?", [id]);
    if (!comment) {
      throw new Error("Comment not found");
    }

    await db.run("DELETE FROM comments WHERE id = ?", [id]);
  }
}

export default new CommentRepository();
