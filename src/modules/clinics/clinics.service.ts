import { prisma } from '../../config/database';
import { CreateClinicDto, UpdateClinicDto } from './clinics.validation';
import { AppError, NotFoundError } from '../../middlewares/errorHandler';

export class ClinicService {

  async findAll(params: { page: number; limit: number; search?: string; city?: string }) {
    const { page, limit, search, city } = params;
    const skip = (page - 1) * limit;

    const where: any = { isValidated: true, isActive: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const [clinics, total] = await prisma.$transaction([
      prisma.clinic.findMany({
        where, skip, take: limit,
        include: {
          admin: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clinic.count({ where }),
    ]);

    return {
      data: clinics,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        admin: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!clinic) throw new NotFoundError('Clinique introuvable');
    return clinic;
  }

  async create(data: CreateClinicDto & { adminId: string }) {
    const existing = await prisma.clinic.findUnique({
      where: { adminId: data.adminId },
    });
    if (existing) {
      throw new AppError(409, 'CLINIC_EXISTS', 'Vous avez déjà une clinique enregistrée');
    }
    return prisma.clinic.create({ data });
  }

  async update(id: string, adminId: string, data: UpdateClinicDto) {
    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) throw new NotFoundError('Clinique introuvable');
    if (clinic.adminId !== adminId) {
      throw new AppError(403, 'FORBIDDEN', 'Accès non autorisé');
    }
    return prisma.clinic.update({ where: { id }, data });
  }

  async getMyClinic(adminId: string) {
    const clinic = await prisma.clinic.findUnique({ where: { adminId } });
    if (!clinic) throw new NotFoundError('Aucune clinique associée à votre compte');
    return clinic;
  }
}