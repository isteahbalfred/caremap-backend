import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import pharmacyRoutes from './modules/pharmacies/pharmacies.routes';

dotenv.config();

const app = express();

// ── Middlewares globaux ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pharmacies', pharmacyRoutes);

// ── Rate limiting global ─────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Trop de requêtes' } },
}));

// ── Route de santé ───────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'CareMap API is running 🚀', version: '1.0.0' });
});

// ── Gestion des erreurs (toujours en dernier) ────────────────
app.use(errorHandler);

export default app;