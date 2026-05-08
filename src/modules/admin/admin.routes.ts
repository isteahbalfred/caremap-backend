import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();
const controller = new AdminController();
const adminOnly = [authenticate, authorize('SUPER_ADMIN')];

router.get('/dashboard', ...adminOnly, controller.getDashboard);
router.get('/users', ...adminOnly, controller.getAllUsers);
router.get('/pharmacies/pending', ...adminOnly, controller.getPendingPharmacies);
router.patch('/pharmacies/:id/validate', ...adminOnly, controller.validatePharmacy);
router.patch('/users/:id/toggle', ...adminOnly, controller.toggleUserStatus);

export default router;