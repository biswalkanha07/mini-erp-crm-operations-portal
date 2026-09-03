import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser, JwtPayloadData } from '../types/auth';
import userService from '../services/userService';

/**
 * Authentication Middleware
 * Enforces JWT token presence, valid signature, user existence, and active status.
 * Attaches decoded + verified identity to req.user and full record to req.userObj.
 */
export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const secret = process.env.JWT_SECRET || 'your-very-long-random-string';
    const decoded = jwt.verify(token, secret) as JwtPayloadData;
    const user = await userService.getById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    req.user = {
      ...decoded,
      id: user.id,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      userType: user.userType,
      organizationId: user.organizationId ?? null,
      storeId: user.storeId ?? null
    } as AuthenticatedUser;

    req.userObj = user;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is not valid' });
  }
};

export default auth;
