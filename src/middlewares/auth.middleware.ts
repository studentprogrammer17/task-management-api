import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import DatabaseService from '../services/database.service';

export interface CustomRequest extends Request {
  user?: string | object;
}

export const verifyToken = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers['authorization'];

  if (!token) {
    res.status(403).json({ error: 'No token provided.' });
    return;
  }

  const tokenWithoutBearer = token.startsWith('Bearer ')
    ? token.slice(7)
    : token;

  try {
    const user = jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET as string
    ) as { id: string };

    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

export const checkAdminRole = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = (req.user as { id: string }).id;
  const db = DatabaseService.getInstance().getClient();

  try {
    const userWithRole = await db.query(
      `SELECT r.name AS role FROM users u 
       JOIN roles r ON u."roleId" = r.id WHERE u.id = $1`,
      [userId]
    );

    if (!userWithRole.rows.length || userWithRole.rows[0].role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Admins only.' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
