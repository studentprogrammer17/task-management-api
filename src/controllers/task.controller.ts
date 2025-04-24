import { Request, Response } from 'express';
import taskRepository from '../repositories/task.repository';
import { CreateTaskDto, UpdateTaskDto } from '../models/task.model';
import { CustomRequest } from '../middlewares/auth.middleware';

export const getAllTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tasks = await taskRepository.getAllTasks();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
};

export const getUsersTasks = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as { id: string }).id;
    const tasks = await taskRepository.getUsersTasks(userId);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
};

export const getTaskById = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const taskId = req.params.id;
    const userId = (req.user as { id: string }).id;
    const task = await taskRepository.getTaskById(taskId, userId);
    res.status(200).json(task);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else if (
      error instanceof Error &&
      error.message === 'Task not related to user'
    ) {
      res.status(401).json({ error: 'Task not related to user' });
    } else {
      res.status(500).json({ error: 'Failed to retrieve task' });
    }
  }
};

export const createTask = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const taskData: CreateTaskDto = req.body;

    if (!taskData.title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    if (
      !taskData.status ||
      !['todo', 'in-progress', 'done'].includes(taskData.status)
    ) {
      res
        .status(400)
        .json({ error: 'Status must be one of: todo, in-progress, done' });
      return;
    }
    const userId = (req.user as { id: string }).id;
    const newTask = await taskRepository.createTask(taskData, userId);
    res.status(201).json(newTask);
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      res.status(404).json({ error: 'Category not found' });
    } else {
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
};

export const updateTask = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const taskId = req.params.id;
    const updateData: UpdateTaskDto = req.body;

    if (
      updateData.status &&
      !['todo', 'in-progress', 'done'].includes(updateData.status)
    ) {
      res
        .status(400)
        .json({ error: 'Status must be one of: todo, in-progress, done' });
      return;
    }
    const userId = (req.user as { id: string }).id;
    const updatedTask = await taskRepository.updateTask(
      taskId,
      updateData,
      userId
    );
    res.status(200).json(updatedTask);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else if (
      error instanceof Error &&
      error.message === 'Category not found'
    ) {
      res.status(404).json({ error: 'Category not found' });
    } else if (
      error instanceof Error &&
      error.message === 'Task not related to user'
    ) {
      res.status(401).json({ error: 'Task not related to user' });
    } else {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
};

export const deleteTask = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const taskId = req.params.id;
    const userId = (req.user as { id: string }).id;
    await taskRepository.deleteTask(taskId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else if (
      error instanceof Error &&
      error.message === 'Task not related to user'
    ) {
      res.status(401).json({ error: 'Task not related to user' });
    } else {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
};

export const addSubtask = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const parentId = req.params.id;
    const subtaskData: CreateTaskDto = req.body;

    if (!subtaskData.title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    if (
      !subtaskData.status ||
      !['todo', 'in-progress', 'done'].includes(subtaskData.status)
    ) {
      res
        .status(400)
        .json({ error: 'Status must be one of: todo, in-progress, done' });
      return;
    }
    const userId = (req.user as { id: string }).id;
    const updatedTask = await taskRepository.addSubtask(
      parentId,
      subtaskData,
      userId
    );
    res.status(201).json(updatedTask);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({ error: 'Parent task not found' });
    } else {
      res.status(500).json({ error: 'Failed to add subtask' });
    }
  }
};
