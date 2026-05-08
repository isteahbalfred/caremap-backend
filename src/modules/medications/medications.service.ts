import { prisma } from '../../config/database';
import { CreateMedicationDto, UpdateMedicationDto } from './medications.validation';
import { NotFoundError } from '../../middlewares/errorHandler';

export class MedicationService {

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    city?: string;
  }) {
    const { page, limit, search, categoryId, city } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;

    const stockWhere: any = { isAvailable: true, quantity: { gt: 0 } };
    if (city) stockWhere.pharmacy = { city: { contains: city, mode: 'insensitive' }, isValidated: true };

    const [medications, total] = await prisma.$transaction([
      prisma.medication.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          stocks: {
            where: stockWhere,
            include: {
              pharmacy: {
                select: { id: true, name: true, city: true, address: true, latitude: true, longitude: true, phone: true },
              },
            },
            orderBy: { price: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.medication.count({ where }),
    ]);

    return {
      data: medications,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const medication = await prisma.medication.findUnique({
      where: { id },
      include: {
        category: true,
        stocks: {
          where: { isAvailable: true },
          include: {
            pharmacy: {
              select: { id: true, name: true, city: true, address: true, latitude: true, longitude: true, phone: true },
            },
          },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!medication) throw new NotFoundError('Médicament introuvable');
    return medication;
  }

  async create(data: CreateMedicationDto) {
    return prisma.medication.create({
      data,
      include: { category: true },
    });
  }

  async update(id: string, data: UpdateMedicationDto) {
    const medication = await prisma.medication.findUnique({ where: { id } });
    if (!medication) throw new NotFoundError('Médicament introuvable');
    return prisma.medication.update({ where: { id }, data, include: { category: true } });
  }

  async getCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}