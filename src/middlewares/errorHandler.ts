import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ── Classes d'erreurs métier ─────────────────────────────────
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource introuvable') {
    super(404, 'RESOURCE_NOT_FOUND', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Non autorisé') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès interdit') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Données invalides', public details?: object[]) {
    super(422, 'VALIDATION_ERROR', message);
  }
}

// ── Handler global ───────────────────────────────────────────
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  if (statusCode === 500) {
    logger.error('Erreur non gérée:', { message: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'Une erreur interne est survenue',
      ...(err.details && { details: err.details }),
    },
  });
};