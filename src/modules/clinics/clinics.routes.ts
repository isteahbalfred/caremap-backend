import { Router } from 'express';
import { ClinicController } from './clinics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { CreateClinicSchema, UpdateClinicSchema } from './clinics.validation';

const router = Router();
const controller = new ClinicController();

// Routes publiques
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Routes protégées
router.get('/my/clinic', authenticate, authorize('CLINIC_ADMIN', 'SUPER_ADMIN'), controller.getMy);
router.post('/', authenticate, authorize('CLINIC_ADMIN', 'SUPER_ADMIN'), validate(CreateClinicSchema), controller.create);
router.put('/:id', authenticate, authorize('CLINIC_ADMIN', 'SUPER_ADMIN'), validate(UpdateClinicSchema), controller.update);

export default router;