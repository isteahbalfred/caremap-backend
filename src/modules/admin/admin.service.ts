import { prisma } from '../../config/database';
import { NotFoundError } from '../../middlewares/errorHandler';

export class AdminService {

  async getDashboard() {
    const [
      totalUsers,
      totalPharmacies,
      validatedPharmacies,
      pendingPharmacies,
      totalClinics,
      totalMedications,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.pharmacy.count(),
      prisma.pharmacy.count({ where: { isValidated: true } }),
      prisma.pharmacy.count({ where: { isValidated: false } }),
      prisma.clinic.count(),
      prisma.medication.count(),
    ]);

    return {
      stats: {
        totalUsers,
        totalPharmacies,
        validatedPharmacies,
        pendingPharmacies,
        totalClinics,
        totalMedications,
      },
    };
  }

  async getAllUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    return { data: users, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getPendingPharmacies() {
    return prisma.pharmacy.findMany({
      where: { isValidated: false },
      include: {
        admin: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validatePharmacy(id: string, validate: boolean) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) throw new NotFoundError('Pharmacie introuvable');

    return prisma.pharmacy.update({
      where: { id },
      data: { isValidated: validate },
    });
  }

  async toggleUserStatus(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('Utilisateur introuvable');

    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true, role: true },
    });
  }
}