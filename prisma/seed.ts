import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Catégories de médicaments ─────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Antibiotiques' },
      update: {},
      create: { name: 'Antibiotiques' },
    }),
    prisma.category.upsert({
      where: { name: 'Analgésiques' },
      update: {},
      create: { name: 'Analgésiques' },
    }),
    prisma.category.upsert({
      where: { name: 'Antipaludéens' },
      update: {},
      create: { name: 'Antipaludéens' },
    }),
    prisma.category.upsert({
      where: { name: 'Vitamines & Compléments' },
      update: {},
      create: { name: 'Vitamines & Compléments' },
    }),
    prisma.category.upsert({
      where: { name: 'Antihypertenseurs' },
      update: {},
      create: { name: 'Antihypertenseurs' },
    }),
  ]);

  console.log(`✅ ${categories.length} catégories créées`);

  // ── Super Admin ───────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@CareMap2025', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@caremap.ht' },
    update: {},
    create: {
      email: 'admin@caremap.ht',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log(`✅ Super Admin créé : ${superAdmin.email}`);

  // ── Pharmacien test ───────────────────────────────────────
  const pharmacistPassword = await bcrypt.hash('Pharma@2025', 12);

  const pharmacist = await prisma.user.upsert({
    where: { email: 'pharmacie.centrale@caremap.ht' },
    update: {},
    create: {
      email: 'pharmacie.centrale@caremap.ht',
      password: pharmacistPassword,
      firstName: 'Jean',
      lastName: 'Baptiste',
      role: UserRole.PHARMACY_ADMIN,
    },
  });

  // ── Pharmacie test ────────────────────────────────────────
  const pharmacy = await prisma.pharmacy.upsert({
    where: { adminId: pharmacist.id },
    update: {},
    create: {
      name: 'Pharmacie Centrale',
      address: 'Rue du Centre, Pétion-Ville',
      city: 'Port-au-Prince',
      phone: '+509 3700-0000',
      latitude: 18.5120,
      longitude: -72.2852,
      isValidated: true,
      isActive: true,
      adminId: pharmacist.id,
    },
  });

  console.log(`✅ Pharmacie test créée : ${pharmacy.name}`);

  // ── Médicaments test ──────────────────────────────────────
  const medications = await Promise.all([
    prisma.medication.upsert({
      where: { id: 'med-001' },
      update: {},
      create: {
        id: 'med-001',
        name: 'Doliprane 500mg',
        genericName: 'Paracétamol',
        description: 'Analgésique et antipyrétique',
        categoryId: categories[1].id,
      },
    }),
    prisma.medication.upsert({
      where: { id: 'med-002' },
      update: {},
      create: {
        id: 'med-002',
        name: 'Amoxicilline 500mg',
        genericName: 'Amoxicilline',
        description: 'Antibiotique à large spectre',
        categoryId: categories[0].id,
      },
    }),
    prisma.medication.upsert({
      where: { id: 'med-003' },
      update: {},
      create: {
        id: 'med-003',
        name: 'Chloroquine 250mg',
        genericName: 'Chloroquine',
        description: 'Traitement antipaludéen',
        categoryId: categories[2].id,
      },
    }),
  ]);

  console.log(`✅ ${medications.length} médicaments créés`);

  // ── Stocks test ───────────────────────────────────────────
  await Promise.all([
    prisma.medicationStock.upsert({
      where: {
        pharmacyId_medicationId: {
          pharmacyId: pharmacy.id,
          medicationId: 'med-001',
        },
      },
      update: {},
      create: {
        pharmacyId: pharmacy.id,
        medicationId: 'med-001',
        quantity: 150,
        price: 75.00,
        threshold: 20,
        isAvailable: true,
      },
    }),
    prisma.medicationStock.upsert({
      where: {
        pharmacyId_medicationId: {
          pharmacyId: pharmacy.id,
          medicationId: 'med-002',
        },
      },
      update: {},
      create: {
        pharmacyId: pharmacy.id,
        medicationId: 'med-002',
        quantity: 8,
        price: 250.00,
        threshold: 10,
        isAvailable: true,
      },
    }),
  ]);

  console.log('✅ Stocks créés');
  console.log('');
  console.log('🎉 Seed terminé avec succès !');
  console.log('');
  console.log('📧 Comptes de test :');
  console.log('   Super Admin  : admin@caremap.ht / Admin@CareMap2025');
  console.log('   Pharmacien   : pharmacie.centrale@caremap.ht / Pharma@2025');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });