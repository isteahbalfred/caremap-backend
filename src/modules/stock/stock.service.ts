import { prisma } from '../../config/database';
import { UpdateStockDto, AddStockDto } from './stock.validation';
import { NotFoundError, AppError } from '../../middlewares/errorHandler';

export class StockService {

  async getPharmacyStock(pharmacyId: string) {
    return prisma.medicationStock.findMany({
      where: { pharmacyId },
      include: { medication: { include: { category: true } } },
      orderBy: { medication: { name: 'asc' } },
    });
  }

  async addMedication(pharmacyId: string, data: AddStockDto) {
    const existing = await prisma.medicationStock.findUnique({
      where: { pharmacyId_medicationId: { pharmacyId, medicationId: data.medicationId } },
    });

    if (existing) {
      throw new AppError(409, 'STOCK_EXISTS', 'Ce médicament est déjà dans votre stock');
    }

    return prisma.medicationStock.create({
      data: { pharmacyId, ...data },
      include: { medication: true },
    });
  }

  async updateStock(id: string, pharmacyId: string, data: UpdateStockDto) {
    const stock = await prisma.medicationStock.findUnique({ where: { id } });

    if (!stock) throw new NotFoundError('Stock introuvable');
    if (stock.pharmacyId !== pharmacyId) {
      throw new AppError(403, 'FORBIDDEN', 'Accès non autorisé à ce stock');
    }

    const isAvailable = data.isAvailable !== undefined
      ? data.isAvailable
      : data.quantity > 0;

    return prisma.medicationStock.update({
      where: { id },
      data: { ...data, isAvailable },
      include: { medication: true },
    });
  }

  async getLowStockAlerts(pharmacyId: string) {
    return prisma.medicationStock.findMany({
      where: {
        pharmacyId,
        quantity: { lte: prisma.medicationStock.fields.threshold },
      },
      include: { medication: true },
    });
  }

  async getAlerts(pharmacyId: string) {
    const stocks = await prisma.medicationStock.findMany({
      where: { pharmacyId },
      include: { medication: true },
    });

    const alerts = stocks.filter(s => s.quantity <= s.threshold);
    const outOfStock = stocks.filter(s => s.quantity === 0);

    return {
      lowStock: alerts,
      outOfStock,
      totalAlerts: alerts.length,
    };
  }
}