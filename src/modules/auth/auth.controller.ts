import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  // POST /api/v1/auth/register
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Compte créé avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/auth/login
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.json({
        success: true,
        message: 'Connexion réussie',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/auth/refresh
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/auth/logout
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await authService.logout(user.id);
      res.json({
        success: true,
        message: 'Déconnexion réussie',
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/auth/me
  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}