import { Router } from 'express';
import { StockController } from './stock.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { UpdateStockSchema, AddStockSchema } from './stock.validation';

const router = Router();
const controller = new StockController();

const pharmacyAuth = [authenticate, authorize('PHARMACY_ADMIN', 'SUPER_ADMIN')];

router.get('/', ...pharmacyAuth, controller.getStock);
router.post('/', ...pharmacyAuth, validate(AddStockSchema), controller.addMedication);
router.put('/:id', ...pharmacyAuth, validate(UpdateStockSchema), controller.updateStock);
router.get('/alerts', ...pharmacyAuth, controller.getAlerts);

export default router;