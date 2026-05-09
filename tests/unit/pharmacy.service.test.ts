import { PharmacyService } from '../../src/modules/pharmacies/pharmacies.service';
import { prisma } from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  prisma: {
    pharmacy: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('PharmacyService', () => {
  const pharmacyService = new PharmacyService();

  const mockPharmacy = {
    id: 'pharma-123',
    name: 'Pharmacie Test',
    address: 'Rue Test',
    city: 'Port-au-Prince',
    phone: '+509 3700-0000',
    latitude: 18.512,
    longitude: -72.285,
    logoUrl: null,
    isValidated: true,
    isActive: true,
    adminId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => jest.clearAllMocks());

  describe('findAll()', () => {
    it('should return paginated pharmacies', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        [mockPharmacy], 1
      ]);

      const result = await pharmacyService.findAll({
        page: 1, limit: 10
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.pages).toBe(1);
    });
  });

  describe('findById()', () => {
    it('should throw NotFoundError if pharmacy not found', async () => {
      (prisma.pharmacy.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(pharmacyService.findById('bad-id'))
        .rejects.toThrow('Pharmacie introuvable');
    });

    it('should return pharmacy if found', async () => {
      (prisma.pharmacy.findUnique as jest.Mock).mockResolvedValue(mockPharmacy);
      const result = await pharmacyService.findById('pharma-123');
      expect(result.name).toBe('Pharmacie Test');
    });
  });

  describe('create()', () => {
    it('should throw error if pharmacy already exists for admin', async () => {
      (prisma.pharmacy.findUnique as jest.Mock).mockResolvedValue(mockPharmacy);
      await expect(pharmacyService.create({
        name: 'Test',
        address: 'Addr',
        city: 'PAP',
        phone: '12345678',
        latitude: 18.5,
        longitude: -72.3,
        adminId: 'user-123',
      })).rejects.toThrow('Vous avez déjà une pharmacie enregistrée');
    });
  });
});