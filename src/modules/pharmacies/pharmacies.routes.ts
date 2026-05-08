import { Router } from 'express';
import { PharmacyController } from './pharmacies.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { CreatePharmacySchema, UpdatePharmacySchema } from './pharmacies.validation';

const router = Router();
const controller = new PharmacyController();

// Routes publiques
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Routes protégées — Pharmacien
router.get(
  '/my/dashboard',
  authenticate,
  authorize('PHARMACY_ADMIN'),
  controller.dashboard
);
router.post(
  '/',
  authenticate,
  authorize('PHARMACY_ADMIN', 'SUPER_ADMIN'),
  validate(CreatePharmacySchema),
  controller.create
);
router.put(
  '/:id',
  authenticate,
  authorize('PHARMACY_ADMIN', 'SUPER_ADMIN'),
  validate(UpdatePharmacySchema),
  controller.update
);

export default router;