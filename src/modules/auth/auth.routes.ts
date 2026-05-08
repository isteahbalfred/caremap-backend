import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { LoginSchema, RegisterSchema, RefreshSchema } from './auth.validation';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const controller = new AuthController();

// Rate limit strict sur les routes auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Trop de tentatives, réessayez dans 15 minutes' },
  },
});

router.post('/register', authLimiter, validate(RegisterSchema), controller.register);
router.post('/login', authLimiter, validate(LoginSchema), controller.login);
router.post('/refresh', validate(RefreshSchema), controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);

export default router;