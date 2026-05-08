import { Request, Response, NextFunction } from 'express';
import { MedicationService } from './medications.service';

const medicationService = new MedicationService();

export class MedicationController {
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;
      const city = req.query.city as string;
      const result = await medicationService.findAll({ page, limit, search, categoryId, city });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const medication = await medicationService.findById(req.params.id);
      res.json({ success: true, data: medication });
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const medication = await medicationService.create(req.body);
      res.status(201).json({ success: true, message: 'Médicament créé', data: medication });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const medication = await medicationService.update(req.params.id, req.body);
      res.json({ success: true, message: 'Médicament mis à jour', data: medication });
    } catch (error) { next(error); }
  };

  getCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await medicationService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) { next(error); }
  };
}