import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';

const adminService = new AdminService();

export class AdminController {
  getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminService.getDashboard();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await adminService.getAllUsers(page, limit);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getPendingPharmacies = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const pharmacies = await adminService.getPendingPharmacies();
      res.json({ success: true, data: pharmacies });
    } catch (error) { next(error); }
  };

  validatePharmacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { validate } = req.body;
      const pharmacy = await adminService.validatePharmacy(req.params.id, validate);
      const msg = validate ? 'Pharmacie validée' : 'Pharmacie rejetée';
      res.json({ success: true, message: msg, data: pharmacy });
    } catch (error) { next(error); }
  };

  toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.toggleUserStatus(req.params.id);
      res.json({ success: true, message: 'Statut utilisateur mis à jour', data: user });
    } catch (error) { next(error); }
  };
}