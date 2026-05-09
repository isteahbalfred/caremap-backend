import { MedicationService } from '../../src/modules/medications/medications.service';
import { prisma } from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  prisma: {
    medication: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('MedicationService', () => {
  const medicationService = new MedicationService();

  const mockMedication = {
    id: 'med-001',
    name: 'Doliprane 500mg',
    genericName: 'Paracétamol',
    description: 'Analgésique',
    imageUrl: null,
    categoryId: 'cat-001',
    category: { id: 'cat-001', name: 'Analgésiques' },
    stocks: [],
  };

  beforeEach(() => jest.clearAllMocks());

  describe('findAll()', () => {
    it('should return paginated medications', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        [mockMedication], 1
      ]);

      const result = await medicationService.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findById()', () => {
    it('should throw if medication not found', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(medicationService.findById('bad-id'))
        .rejects.toThrow('Médicament introuvable');
    });

    it('should return medication', async () => {
      (prisma.medication.findUnique as jest.Mock).mockResolvedValue(mockMedication);
      const result = await medicationService.findById('med-001');
      expect(result.name).toBe('Doliprane 500mg');
    });
  });

  describe('getCategories()', () => {
    it('should return categories', async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: 'cat-001', name: 'Analgésiques' },
        { id: 'cat-002', name: 'Antibiotiques' },
      ]);

      const result = await medicationService.getCategories();
      expect(result).toHaveLength(2);
    });
  });
});