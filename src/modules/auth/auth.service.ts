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