import { Router } from 'express';
import { MedicationController } from './medications.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { CreateMedicationSchema, UpdateMedicationSchema } from './medications.validation';

const router = Router();
const controller = new MedicationController();

// Routes publiques
router.get('/', controller.getAll);
router.get('/categories', controller.getCategories);
router.get('/:id', controller.getById);

// Routes protégées — Admin seulement
router.post('/', authenticate, authorize('SUPER_ADMIN'), validate(CreateMedicationSchema), controller.create);
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), validate(UpdateMedicationSchema), controller.update);

export default router;