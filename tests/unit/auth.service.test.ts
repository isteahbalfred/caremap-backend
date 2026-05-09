import { AuthService } from '../../src/modules/auth/auth.service';
import { prisma } from '../../src/config/database';
import * as passwordUtils from '../../src/utils/password.utils';

jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/utils/password.utils');
jest.mock('../../src/utils/jwt.utils', () => ({
  generateAccessToken: jest.fn(() => 'mock_access_token'),
  generateRefreshToken: jest.fn(() => 'mock_refresh_token'),
  verifyRefreshToken: jest.fn(),
}));

describe('AuthService', () => {
  const authService = new AuthService();
  const mockUser = {
    id: 'user-123',
    email: 'test@caremap.ht',
    password: 'hashed_password',
    firstName: 'Jean',
    lastName: 'Pierre',
    role: 'PATIENT',
    isActive: true,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => jest.clearAllMocks());

  describe('register()', () => {
    it('should throw error if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      await expect(authService.register({
        email: 'test@caremap.ht',
        password: 'Test@1234',
        firstName: 'Jean',
        lastName: 'Pierre',
      })).rejects.toThrow('Cet email est déjà utilisé');
    });

    it('should create user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user',
        email: 'new@caremap.ht',
        firstName: 'Jean',
        lastName: 'Pierre',
        role: 'PATIENT',
        createdAt: new Date(),
      });

      const result = await authService.register({
        email: 'new@caremap.ht',
        password: 'Test@1234',
        firstName: 'Jean',
        lastName: 'Pierre',
      });

      expect(result.email).toBe('new@caremap.ht');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('login()', () => {
    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(authService.login({
        email: 'unknown@caremap.ht',
        password: 'Test@1234',
      })).rejects.toThrow('Email ou mot de passe incorrect');
    });

    it('should throw error if password invalid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);
      await expect(authService.login({
        email: 'test@caremap.ht',
        password: 'WrongPass',
      })).rejects.toThrow('Email ou mot de passe incorrect');
    });

    it('should return tokens on valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed_refresh');
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@caremap.ht',
        password: 'Test@1234',
      });

      expect(result.accessToken).toBe('mock_access_token');
      expect(result.refreshToken).toBe('mock_refresh_token');
      expect(result.user.email).toBe('test@caremap.ht');
    });
  });
});