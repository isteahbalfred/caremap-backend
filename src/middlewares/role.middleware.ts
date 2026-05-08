import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from './errorHandler';

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Non authentifié'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError("Vous n'avez pas les permissions nécessaires")
      );
    }

    next();
  };
};