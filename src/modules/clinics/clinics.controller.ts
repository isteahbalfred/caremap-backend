import { Request, Response, NextFunction } from 'express';
import { ClinicService } from './clinics.service';

const clinicService = new ClinicService();

export class ClinicController {
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const city = req.query.city as string;
      const result = await clinicService.findAll({ page, limit, search, city });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinic = await clinicService.findById(req.params.id);
      res.json({ success: true, data: clinic });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const clinic = await clinicService.create({ ...req.body, adminId: user.id });
      res.status(201).json({
        success: true,
        message: 'Clinique créée. En attente de validation.',
        data: clinic,
      });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const clinic = await clinicService.update(req.params.id, user.id, req.body);
      res.json({ success: true, message: 'Clinique mise à jour', data: clinic });
    } catch (error) { next(error); }
  };

  getMy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const clinic = await clinicService.getMyClinic(user.id);
      res.json({ success: true, data: clinic });
    } catch (error) { next(error); }
  };
}