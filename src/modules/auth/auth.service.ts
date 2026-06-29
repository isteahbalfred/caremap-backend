import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password.utils';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.utils';
import {
  UnauthorizedError,
  AppError,
} from '../../middlewares/errorHandler';
import { RegisterDto, LoginDto } from './auth.validation';
import { getGoogleUser } from './google.strategy';

export class AuthService {
  // ── Register ────────────────────────────────────────────
  async register(data: RegisterDto) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Cet email est déjà utilisé');
    }

    const password = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  // ── Login ────────────────────────────────────────────────
  async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const hashedRefresh = await hashPassword(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  // ── Google OAuth ─────────────────────────────────────────
  async loginWithGoogle(code: string) {
    // 1. Récupérer le profil Google via le code OAuth
    const googleUser = await getGoogleUser(code);

    // 2. Chercher un compte existant par googleId ou par email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.googleId },
          { email: googleUser.email },
        ],
      },
    });

    if (user) {
      // Compte existant — lier le googleId s'il ne l'est pas encore
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.googleId },
        });
      }

      if (!user.isActive) {
        throw new AppError(403, 'ACCOUNT_DISABLED', 'Votre compte est désactivé');
      }
    } else {
      // Nouveau compte — création automatique
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          googleId: googleUser.googleId,
          // Mot de passe vide hashé — connexion Google uniquement
          password: await hashPassword(Math.random().toString(36) + Date.now()),
        },
      });
    }

    // 3. Générer les tokens JWT CareMap
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const hashedRefresh = await hashPassword(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  // ── Refresh Token ────────────────────────────────────────
  async refresh(token: string) {
    try {
      const payload = verifyRefreshToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedError('Session invalide');
      }

      const isValid = await comparePassword(token, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedError('Token invalide');
      }

      const newPayload = { id: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(newPayload);
      const refreshToken = generateRefreshToken(newPayload);

      const hashedRefresh = await hashPassword(refreshToken);
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefresh },
      });

      return { accessToken, refreshToken };
    } catch {
      throw new UnauthorizedError('Session expirée, veuillez vous reconnecter');
    }
  }

  // ── Logout ───────────────────────────────────────────────
  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}