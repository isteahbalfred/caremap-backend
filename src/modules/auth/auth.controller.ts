import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { buildGoogleAuthUrl } from './google.strategy';

const authService = new AuthService();

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ success: true, message: 'Compte créé avec succès', data: user });
    } catch (error) { next(error); }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, message: 'Connexion réussie', data: result });
    } catch (error) { next(error); }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (error) { next(error); }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await authService.logout(user.id);
      res.json({ success: true, message: 'Déconnexion réussie' });
    } catch (error) { next(error); }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ success: true, data: (req as any).user });
    } catch (error) { next(error); }
  };

  // ── Google OAuth — Étape 1 : redirection vers Google ────
  googleRedirect = (_req: Request, res: Response) => {
    const url = buildGoogleAuthUrl();
    res.redirect(url);
  };

  // ── Google OAuth — Étape 2 : callback après autorisation ─
  googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.query.code as string;

      if (!code) {
        // L'utilisateur a annulé ou Google a refusé
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=google_cancelled`
        );
      }

      const result = await authService.loginWithGoogle(code);

      // Redirection vers le frontend avec les tokens en query params
      // Le frontend les intercepte via authService.handleGoogleCallback()
      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?${params.toString()}`);
    } catch (error) {
      next(error);
    }
  };
}