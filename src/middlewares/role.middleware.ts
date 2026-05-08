import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from './errorHandler';

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return next(new ForbiddenError('Non authentifié'));
    }
    if (!roles.includes(user.role)) {
      return next(new ForbiddenError("Permissions insuffisantes"));
    }
    next();
  };
};