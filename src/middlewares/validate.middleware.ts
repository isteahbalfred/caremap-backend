import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const zodError = result as any;
      return next({
        statusCode: 422,
        code: 'VALIDATION_ERROR',
        message: 'Données invalides',
        details: zodError.error.issues.map((issue: any) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;
    next();
  };
};