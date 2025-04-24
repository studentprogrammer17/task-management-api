import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database.service';
import { Task, CreateTaskDto, UpdateTaskDto } from '../models/task.model';

class TaskRepository {
  private db = DatabaseService.getInstance();
  private readonly CACHE_TTL = 3600;
  private readonly TASKS_CACHE_KEY = 'tasks:all';
  private readonly TASK_CACHE_KEY = (id: string) => `task:${id}`;

  async createTask(task: CreateTaskDto, userId: string): Promise<Task> {
    try {
      const db = this.db.getClient();
      const id = uuidv4();
      const createdAt = new Date().toISOString();

      if (task.categoryId) {
        const category = await db.query(
          'SELECT * FROM categories WHERE id = $1',
          [task.categoryId]
        );
        if (category.rows.length === 0) {
          throw new Error('Category not found');
        }
      }

      if (task.endTime) {
        const endTime = new Date(task.endTime);
        task.endTime = endTime.toISOString();
      }

      await db.query(
        'INSERT INTO tasks (id, title, description, status, categoryId, parentId, lat, lng, endTime, userId, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [
          id,
          task.title,
          task.description || null,
          task.status,
          task.categoryId || null,
          task.parentId || null,
          task.lat || null,
          task.lng || null,
          task.endTime || null,
          userId,
          createdAt,
        ]
      );

      if (task.subtasks && task.subtasks.length > 0) {
        for (const subtask of task.subtasks) {
          await this.createTask(
            {
              ...subtask,
              parentId: id,
            },
            userId
          );
        }
      }

      return this.getTaskById(id, userId);
    } catch (error) {
      console.error('Error in createTask:', error);
      throw error;
    }
  }

  async getAllTasks(): Promise<Task[]> {
    const db = this.db.getClient();
    const tasksResult = await db.query(
      'SELECT * FROM tasks WHERE parentId IS NULL'
    );
    const tasks = tasksResult.rows;

    for (let task of tasks) {
      task.subtasks = await this.getSubtasks(task.id);
      const commentsResult = await db.query(
        'SELECT * FROM comments WHERE taskId = $1',
        [task.id]
      );
      const categoryResult = await db.query(
        'SELECT * FROM categories WHERE id = $1',
        [task.categoryId]
      );

      if (categoryResult.rows.length > 0) {
        task.categoryName = categoryResult.rows[0].name;
      }
      if (commentsResult.rows.length > 0) {
        task.comments = commentsResult.rows;
      }
    }

    return tasks;
  }

  async getUsersTasks(userId: string): Promise<Task[]> {
    const db = this.db.getClient();
    const tasksResult = await db.query(
      'SELECT * FROM tasks WHERE parentId IS NULL AND userId = $1',
      [userId]
    );
    const tasks = tasksResult.rows;

    for (let task of tasks) {
      task.subtasks = await this.getSubtasks(task.id);
      const commentsResult = await db.query(
        'SELECT * FROM comments WHERE taskId = $1',
        [task.id]
      );
      const categoryResult = await db.query(
        'SELECT * FROM categories WHERE id = $1',
        [task.categoryId]
      );

      if (categoryResult.rows.length > 0) {
        task.categoryName = categoryResult.rows[0].name;
      }
      if (commentsResult.rows.length > 0) {
        task.comments = commentsResult.rows;
      }
    }

    return tasks;
  }

  async getTaskById(id: string, userId: string): Promise<Task> {
    try {
      const db = this.db.getClient();
      const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [
        id,
      ]);

      if (taskResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const task = taskResult.rows[0];

      if (task.userId !== userId) {
        throw new Error('Task not related to user');
      }

      task.subtasks = await this.getSubtasks(id);
      const commentsResult = await db.query(
        'SELECT * FROM comments WHERE taskId = $1',
        [id]
      );
      task.comments = commentsResult.rows;

      return task;
    } catch (error) {
      console.error('Error in getTaskById:', error);
      throw error;
    }
  }

  private async getSubtasks(parentId: string): Promise<Task[]> {
    const db = this.db.getClient();
    const subtasksResult = await db.query(
      'SELECT * FROM tasks WHERE parentId = $1',
      [parentId]
    );
    const subtasks = subtasksResult.rows;

    for (let subtask of subtasks) {
      subtask.subtasks = await this.getSubtasks(subtask.id);
    }

    return subtasks;
  }

  async updateTask(
    id: string,
    updateData: UpdateTaskDto,
    userId: string
  ): Promise<Task> {
    const db = this.db.getClient();
    const existingTaskResult = await db.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );
    if (existingTaskResult.rows.length === 0) {
      throw new Error('Task not found');
    }

    const existingTask = existingTaskResult.rows[0];

    if (existingTask.userId !== userId) {
      throw new Error('Task not related to user');
    }

    if (updateData.categoryId) {
      const categoryResult = await db.query(
        'SELECT * FROM categories WHERE id = $1',
        [updateData.categoryId]
      );
      if (categoryResult.rows.length === 0) {
        throw new Error('Category not found');
      }
    }

    let updateQuery = 'UPDATE tasks SET ';
    const updateValues: any[] = [];

    if (updateData.title !== undefined) {
      updateQuery += 'title = $' + (updateValues.length + 1) + ', ';
      updateValues.push(updateData.title);
    }

    if (updateData.description !== undefined) {
      updateQuery += 'description = $' + (updateValues.length + 1) + ', ';
      updateValues.push(updateData.description);
    }

    if (updateData.status !== undefined) {
      updateQuery += 'status = $' + (updateValues.length + 1) + ', ';
      updateValues.push(updateData.status);
    }

    if (updateData.lat !== undefined) {
      updateQuery += 'lat = $' + (updateValues.length + 1) + ', ';
      updateValues.push(updateData.lat);
    }

    if (updateData.lng !== undefined) {
      updateQuery += 'lng = $' + (updateValues.length + 1) + ', ';
      updateValues.push(updateData.lng);
    }

    if (updateData.categoryId !== undefined) {
      updateQuery += 'categoryId = $' + (updateValues.length + 1) + ', ';
      updateValues.push(updateData.categoryId);
    }

    if (updateData.endTime !== undefined) {
      updateQuery += 'endTime = $' + (updateValues.length + 1) + ', ';
      updateValues.push(updateData.endTime);
    }

    updateQuery = updateQuery.slice(0, -2);

    updateQuery += ' WHERE id = $' + (updateValues.length + 1);
    updateValues.push(id);

    await db.query(updateQuery, updateValues);

    if (updateData.subtasks) {
      await db.query('DELETE FROM tasks WHERE parentId = $1', [id]);

      for (const subtask of updateData.subtasks) {
        await this.createTask(
          {
            ...subtask,
            parentId: id,
          },
          userId
        );
      }
    }

    return this.getTaskById(id, userId);
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const db = this.db.getClient();
    const existingTaskResult = await db.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );
    if (existingTaskResult.rows.length === 0) {
      throw new Error('Task not found');
    }

    const existingTask = existingTaskResult.rows[0];

    if (existingTask.userId !== userId) {
      throw new Error('Task not related to user');
    }

    const relatedCommentsResult = await db.query(
      'SELECT * FROM comments WHERE taskId = $1',
      [id]
    );

    if (relatedCommentsResult.rows.length > 0) {
      await db.query('DELETE FROM comments WHERE taskId = $1', [id]);
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
  }

  async addSubtask(
    parentId: string,
    subtask: CreateTaskDto,
    userId: string
  ): Promise<Task> {
    await this.createTask(
      {
        ...subtask,
        parentId,
      },
      userId
    );

    return this.getTaskById(parentId, userId);
  }
}

export default new TaskRepository();
