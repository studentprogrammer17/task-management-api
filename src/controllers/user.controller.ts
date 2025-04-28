import { Request, Response } from 'express';
import userRepository from '../repositories/user.repository';
import {
  CreateUserByAdminDto,
  CreateUserDto,
  UpdateUserDto,
} from '../models/user.model';
import { CustomRequest } from '../middlewares/auth.middleware';
import { isValidEmail } from './auth.controller';

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { search = '', page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const { users, total } = await userRepository.getAllUsers(
      search as string,
      pageNum,
      limitNum
    );

    res.status(200).json({
      edges: users,
      pageInfo: {
        hasNextPage: total > pageNum * limitNum,
        hasPreviousPage: pageNum > 1,
        total,
        current: users.length + (pageNum - 1) * limitNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const userData: CreateUserByAdminDto = {
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
    role: req.body.role,
  };

  const requiredFields = ['name', 'password', 'email', 'role'];

  const missingFields = requiredFields.filter(
    field => !userData[field as keyof CreateUserDto]
  );

  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    });
    return;
  }

  if (userData.name.length < 2 || userData.name.length > 24) {
    res.status(400).json({
      success: false,
      error: 'Name must be between 2 and 24 characters long.',
    });
    return;
  }

  if (!isValidEmail(userData.email)) {
    res.status(400).json({
      success: false,
      error: 'Invalid email format.',
    });
    return;
  }

  try {
    const user = await userRepository.createUser(userData, userData.role);
    res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already in use') {
      res.status(500).json({ error: 'Email already in use' });
    } else {
      res.status(500).json({ error: 'Failed to register' });
    }
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    const user = await userRepository.getUserById(userId);
    res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }
};

export const updateUser = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const userId = (req.user as { id: string }).id;
    const updateData: UpdateUserDto = req.body;

    const user = await userRepository.updateUser(id, userId, updateData);
    res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else if (
      error instanceof Error &&
      error.message === 'Email alredy in use'
    ) {
      res.status(400).json({ error: 'Email alredy in use' });
    } else if (
      error instanceof Error &&
      error.message === 'Updating user is forbidden'
    ) {
      res.status(401).json({ error: 'Updating user is forbidden' });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
};

export const deleteUser = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const userId = (req.user as { id: string }).id;
    await userRepository.deleteUser(id, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else if (
      error instanceof Error &&
      error.message === 'Deleting user is forbidden'
    ) {
      res.status(404).json({ error: 'Deleting user is forbidden' });
    } else {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
};
