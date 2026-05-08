import { prisma } from '../../config/database';
import { CreatePharmacyDto, UpdatePharmacyDto } from './pharmacies.validation';
import { AppError, NotFoundError } from '../../middlewares/errorHandler';

export class PharmacyService {

  // ── Lister toutes les pharmacies validées ────────────────
  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    city?: string;
  }) {
    const { page, limit, search, city } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      isValidated: true,
      isActive: true,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const [pharmacies, total] = await prisma.$transaction([
      prisma.pharmacy.findMany({
        where,
        skip,
        take: limit,
        include: {
          medications: {
            include: { medication: true },
            where: { isAvailable: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pharmacy.count({ where }),
    ]);

    return {
      data: pharmacies,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ── Trouver une pharmacie par ID ─────────────────────────
  async findById(id: string) {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id },
      include: {
        medications: {
          include: { medication: { include: { category: true } } },
        },
        admin: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!pharmacy) throw new NotFoundError('Pharmacie introuvable');
    return pharmacy;
  }

  // ── Créer une pharmacie ──────────────────────────────────
  async create(data: CreatePharmacyDto & { adminId: string }) {
    const existing = await prisma.pharmacy.findUnique({
      where: { adminId: data.adminId },
    });

    if (existing) {
      throw new AppError(409, 'PHARMACY_EXISTS', 'Vous avez déjà une pharmacie enregistrée');
    }

    return prisma.pharmacy.create({
      data,
    });
  }

  // ── Mettre à jour une pharmacie ──────────────────────────
  async update(id: string, adminId: string, data: UpdatePharmacyDto) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id } });

    if (!pharmacy) throw new NotFoundError('Pharmacie introuvable');
    if (pharmacy.adminId !== adminId) {
      throw new AppError(403, 'FORBIDDEN', 'Vous ne pouvez modifier que votre pharmacie');
    }

    return prisma.pharmacy.update({
      where: { id },
      data,
    });
  }

  // ── Dashboard pharmacien ─────────────────────────────────
  async getDashboard(adminId: string) {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { adminId },
      include: {
        medications: {
          include: { medication: true },
        },
      },
    });

    if (!pharmacy) throw new NotFoundError('Pharmacie introuvable');

    const totalMedications = pharmacy.medications.length;
    const availableMedications = pharmacy.medications.filter(m => m.isAvailable).length;
    const lowStockItems = pharmacy.medications.filter(
      m => m.quantity <= m.threshold
    );
    const outOfStock = pharmacy.medications.filter(m => m.quantity === 0);

    return {
      pharmacy,
      stats: {
        totalMedications,
        availableMedications,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStock.length,
      },
      alerts: lowStockItems.map(item => ({
        medicationName: item.medication.name,
        quantity: item.quantity,
        threshold: item.threshold,
      })),
    };
  }
}