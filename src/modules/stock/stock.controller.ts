import { Request, Response, NextFunction } from 'express';
import { StockService } from './stock.service';

const stockService = new StockService();

export class StockController {
  getStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pharmacy = await getPharmacyFromUser(req);
      const stock = await stockService.getPharmacyStock(pharmacy.id);
      res.json({ success: true, data: stock });
    } catch (error) { next(error); }
  };

  addMedication = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pharmacy = await getPharmacyFromUser(req);
      const stock = await stockService.addMedication(pharmacy.id, req.body);
      res.status(201).json({ success: true, message: 'Médicament ajouté au stock', data: stock });
    } catch (error) { next(error); }
  };

  updateStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pharmacy = await getPharmacyFromUser(req);
      const stock = await stockService.updateStock(req.params.id, pharmacy.id, req.body);
      res.json({ success: true, message: 'Stock mis à jour', data: stock });
    } catch (error) { next(error); }
  };

  getAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pharmacy = await getPharmacyFromUser(req);
      const alerts = await stockService.getAlerts(pharmacy.id);
      res.json({ success: true, data: alerts });
    } catch (error) { next(error); }
  };
}

// Helper — trouve la pharmacie de l'utilisateur connecté
async function getPharmacyFromUser(req: Request) {
  const { prisma } = await import('../../config/database');
  const { NotFoundError } = await import('../../middlewares/errorHandler');
  const user = (req as any).user;
  const pharmacy = await prisma.pharmacy.findUnique({ where: { adminId: user.id } });
  if (!pharmacy) throw new NotFoundError('Aucune pharmacie associée à votre compte');
  return pharmacy;
}