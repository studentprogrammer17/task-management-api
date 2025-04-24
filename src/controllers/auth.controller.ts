import {
  ChangePasswordDto,
  CreateUserDto,
  LoginDto,
  User,
} from '../models/user.model';
import { Request, Response } from 'express';
import userRepository from '../repositories/user.repository';
import { CustomRequest } from '../middlewares/auth.middleware';
import jwt from 'jsonwebtoken';
import { ROLES } from '../enums/role.enum';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const register = async (req: Request, res: Response) => {
  const userData: CreateUserDto = {
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
  };

  const requiredFields = ['name', 'password', 'email'];

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
    const user = await userRepository.createUser(userData, ROLES.USER);
    res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already in use') {
      res.status(500).json({ error: 'Email already in use' });
    } else {
      res.status(500).json({ error: 'Failed to register' });
    }
  }
};

export const registerAdmin = async (req: Request, res: Response) => {
  const userData: CreateUserDto = {
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
  };

  const requiredFields = ['name', 'password', 'email'];

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
    const user = await userRepository.createUser(userData, ROLES.ADMIN);
    res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already in use') {
      res.status(500).json({ error: 'Email already in use' });
    } else {
      res.status(500).json({ error: 'Failed to register' });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  const userData: LoginDto = {
    password: req.body.password,
    email: req.body.email,
  };

  const requiredFields = ['password', 'email'];

  const missingFields = requiredFields.filter(
    field => !userData[field as keyof LoginDto]
  );

  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    });
    return;
  }

  try {
    const token = await userRepository.login(userData);
    res.status(200).json({ token: token });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Invalid username or password'
    ) {
      res.status(401).json({ error: 'Invalid username or password' });
    } else {
      res.status(500).json({ error: 'Failed to register' });
    }
  }
};

export const changePassword = async (req: CustomRequest, res: Response) => {
  const passwordData: ChangePasswordDto = {
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword,
  };

  const requiredFields = ['oldPassword', 'newPassword'];

  const missingFields = requiredFields.filter(
    field => !passwordData[field as keyof ChangePasswordDto]
  );

  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    });
    return;
  }

  try {
    const userId = (req.user as { id: string }).id;
    await userRepository.changePassword(passwordData, userId);
    res.status(200).json({ message: 'Password was successfully changed' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid password') {
      res.status(401).json({ error: 'Invalid password' });
    } else {
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
};

export const isTokenExpired = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(200).json({ message: 'Token is valid' });
  });
};

export const getMe = async (req: CustomRequest, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const user = await userRepository.getUserById(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};
