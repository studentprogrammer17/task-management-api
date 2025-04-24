import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database.service';
// import RedisService from '../services/redis.service';
import { Task, CreateTaskDto, UpdateTaskDto } from '../models/task.model';

class TaskRepository {
  private db = DatabaseService.getInstance();
  // private redis = RedisService.getInstance();
  private readonly CACHE_TTL = 3600;
  private readonly TASKS_CACHE_KEY = 'tasks:all';
  private readonly TASK_CACHE_KEY = (id: string) => `task:${id}`;

  async createTask(task: CreateTaskDto, userId: string): Promise<Task> {
    try {
      const db = this.db.getDb();
      const id = uuidv4();
      const createdAt = new Date().toISOString();

      if (task.categoryId) {
        const category = await db.get('SELECT * FROM categories WHERE id = ?', [
          task.categoryId,
        ]);
        if (!category) {
          throw new Error('Category not found');
        }
      }

      if (task.endTime) {
        const endTime = new Date(task.endTime);
        const endTimeString = endTime.toISOString();
        task.endTime = endTimeString;
      }

      await db.run(
        'INSERT INTO tasks (id, title, description, status, categoryId, parentId, lat, lng, endTime, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

      const newTask = await this.getTaskById(id, userId);

      // await this.redis.del(this.TASKS_CACHE_KEY);

      // try {
      //   await this.redis.setJSON(
      //     this.TASK_CACHE_KEY(id),
      //     newTask,
      //     this.CACHE_TTL
      //   );
      // } catch (redisError) {
      //   console.error('Failed to cache task:', redisError);
      // }

      return newTask;
    } catch (error) {
      console.error('Error in createTask:', error);
      throw error;
    }
  }

  async getAllTasks(): Promise<Task[]> {
    // const cachedTasks = await this.redis.getJSON<Task[]>(this.TASKS_CACHE_KEY);
    // if (cachedTasks) {
    //   return cachedTasks;
    // }

    const db = this.db.getDb();
    const tasks = await db.all<Task[]>(
      'SELECT * FROM tasks WHERE parentId IS NULL'
    );

    for (let task of tasks) {
      task.subtasks = await this.getSubtasks(task.id);
      const comments = await db.all('SELECT * FROM comments WHERE taskId = ?', [
        task.id,
      ]);
      const category = await db.get('SELECT * FROM categories WHERE id = ?', [
        task.categoryId,
      ]);

      if (category) {
        task.categoryName = category.name;
      }
      if (comments) {
        task.comments = comments;
      }
    }

    // await this.redis.setJSON(this.TASKS_CACHE_KEY, tasks, this.CACHE_TTL);

    return tasks;
  }

  async getUsersTasks(userId: string): Promise<Task[]> {
    const db = this.db.getDb();
    const tasks = await db.all<Task[]>(
      'SELECT * FROM tasks WHERE parentId IS NULL AND userId = ?',
      [userId]
    );

    for (let task of tasks) {
      task.subtasks = await this.getSubtasks(task.id);
      const comments = await db.all('SELECT * FROM comments WHERE taskId = ?', [
        task.id,
      ]);
      const category = await db.get('SELECT * FROM categories WHERE id = ?', [
        task.categoryId,
      ]);

      if (category) {
        task.categoryName = category.name;
      }
      if (comments) {
        task.comments = comments;
      }
    }

    return tasks;
  }

  async getTaskById(id: string, userId: string): Promise<Task> {
    try {
      const db = this.db.getDb();
      const task = await db.get<Task>('SELECT * FROM tasks WHERE id = ?', [id]);

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.userId !== userId) {
        throw new Error('Task not related to user');
      }

      task.subtasks = await this.getSubtasks(id);
      const comments = await db.all('SELECT * FROM comments WHERE taskId = ?', [
        id,
      ]);
      task.comments = comments;

      return task;
    } catch (error) {
      console.error('Error in getTaskById:', error);
      throw error;
    }
  }

  private async getSubtasks(parentId: string): Promise<Task[]> {
    const db = this.db.getDb();

    const subtasks = await db.all<Task[]>(
      'SELECT * FROM tasks WHERE parentId = ?',
      [parentId]
    );

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
    const db = this.db.getDb();
    const existingTask = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    if (existingTask.userId !== userId) {
      throw new Error('Task not related to user');
    }

    if (updateData.categoryId) {
      const category = await db.get('SELECT * FROM categories WHERE id = ?', [
        updateData.categoryId,
      ]);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    let updateQuery = 'UPDATE tasks SET ';
    const updateValues: any[] = [];

    if (updateData.title !== undefined) {
      updateQuery += 'title = ?, ';
      updateValues.push(updateData.title);
    }

    if (updateData.description !== undefined) {
      updateQuery += 'description = ?, ';
      updateValues.push(updateData.description);
    }

    if (updateData.status !== undefined) {
      updateQuery += 'status = ?, ';
      updateValues.push(updateData.status);
    }

    if (updateData.lat !== undefined) {
      updateQuery += 'lat = ?, ';
      updateValues.push(updateData.lat);
    }

    if (updateData.lng !== undefined) {
      updateQuery += 'lng = ?, ';
      updateValues.push(updateData.lng);
    }

    if (updateData.categoryId !== undefined) {
      updateQuery += 'categoryId = ?, ';
      updateValues.push(updateData.categoryId);
    }

    if (updateData.endTime !== undefined) {
      updateQuery += 'endTime = ?, ';
      updateValues.push(updateData.endTime);
    }

    updateQuery = updateQuery.slice(0, -2);

    updateQuery += ' WHERE id = ?';
    updateValues.push(id);

    if (updateValues.length > 1) {
      await db.run(updateQuery, updateValues);
    }

    if (updateData.subtasks) {
      await db.run('DELETE FROM tasks WHERE parentId = ?', [id]);

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

    const updatedTask = await this.getTaskById(id, userId);

    // await this.redis.del(this.TASKS_CACHE_KEY);
    // await this.redis.del(this.TASK_CACHE_KEY(id));

    // await this.redis.setJSON(
    //   this.TASK_CACHE_KEY(id),
    //   updatedTask,
    //   this.CACHE_TTL
    // );

    return updatedTask;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const db = this.db.getDb();
    const existingTask = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    if (existingTask.userId !== userId) {
      throw new Error('Task not related to user');
    }

    const relatedComments = await db.all(
      'SELECT * FROM comments WHERE taskId = ?',
      [id]
    );

    if (relatedComments.length > 0) {
      await db.run('DELETE FROM comments WHERE taskId = ?', [id]);
    }
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);

    // await this.redis.del(this.TASKS_CACHE_KEY);
    // await this.redis.del(this.TASK_CACHE_KEY(id));
  }

  async addSubtask(
    parentId: string,
    subtask: CreateTaskDto,
    userId: string
  ): Promise<Task> {
    const parentTask = await this.getTaskById(parentId, userId);

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
