import { LeaseStatus, MaintenanceAssetCategory, MaintenancePriority, TechnicianRole, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureGlobalSla(priority: MaintenancePriority, resolution: number, response?: number) {
  const existing = await prisma.maintenanceSlaPolicy.findFirst({
    where: {
      propertyId: null,
      priority,
    },
  });

  if (existing) {
    await prisma.maintenanceSlaPolicy.update({
      where: { id: existing.id },
      data: {
        resolutionTimeMinutes: resolution,
        responseTimeMinutes: response ?? null,
        active: true,
      },
    });
    return existing;
  }

  return prisma.maintenanceSlaPolicy.create({
    data: {
      name: `${priority.toLowerCase()} default`,
      priority,
      resolutionTimeMinutes: resolution,
      responseTimeMinutes: response ?? null,
    },
  });
}

async function ensureTechnician(name: string, role: TechnicianRole, contact: { phone?: string; email?: string }) {
  const existing = await prisma.technician.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }
  return prisma.technician.create({
    data: {
      name,
      role,
      phone: contact.phone,
      email: contact.email,
    },
  });
}

async function ensurePropertyWithUnits() {
  let property = await prisma.property.findFirst({
    where: { name: 'Central Plaza' },
    include: { units: true },
  });

  if (!property) {
    property = await prisma.property.create({
      data: {
        name: 'Central Plaza',
        address: '500 Market Street, Springfield',
        units: {
          create: [{ name: 'Suite 101' }, { name: 'Suite 102' }, { name: 'Suite 201' }],
        },
      },
      include: { units: true },
    });
  } else {
    if (!property.address) {
      property = await prisma.property.update({
        where: { id: property.id },
        data: { address: '500 Market Street, Springfield' },
        include: { units: true },
      });
    }

    if (property.units.length === 0) {
      property = await prisma.property.update({
        where: { id: property.id },
        data: {
          units: {
            create: [{ name: 'Suite 101' }, { name: 'Suite 102' }],
          },
        },
        include: { units: true },
      });
    }
  }

  return property;
}

async function ensureAsset(propertyId: number, unitId: number | null, name: string, category: MaintenanceAssetCategory) {
  const existing = await prisma.maintenanceAsset.findFirst({
    where: {
      name,
      propertyId,
      unitId: unitId === null ? null : unitId ?? undefined,
    },
  });
  if (existing) {
    return existing;
  }
  return prisma.maintenanceAsset.create({
    data: {
      property: { connect: { id: propertyId } },
      unit: unitId ? { connect: { id: unitId } } : undefined,
      name,
      category,
    },
  });
}

async function main() {
  console.info('🌱 Seeding maintenance and lease defaults...');

  await ensureGlobalSla(MaintenancePriority.EMERGENCY, 240, 60);
  await ensureGlobalSla(MaintenancePriority.HIGH, 720, 240);
  await ensureGlobalSla(MaintenancePriority.MEDIUM, 1440, 480);
  await ensureGlobalSla(MaintenancePriority.LOW, 4320);

  const property = await ensurePropertyWithUnits();
  const unit = property.units[0];

  const technicians = await Promise.all([
    ensureTechnician('Alex Rivera', TechnicianRole.IN_HOUSE, {
      phone: '+1-555-0100',
      email: 'alex.rivera@example.com',
    }),
    ensureTechnician('Skyline HVAC Services', TechnicianRole.VENDOR, {
      phone: '+1-555-0155',
      email: 'dispatch@skyline-hvac.example',
    }),
  ]);

  await ensureAsset(property.id, unit?.id ?? null, 'Main Rooftop HVAC', MaintenanceAssetCategory.HVAC);
  await ensureAsset(property.id, null, 'Fire Pump Controller', MaintenanceAssetCategory.SAFETY);

  const tenantUser = await prisma.user.findFirst({ where: { username: 'demo_tenant' } });
  if (tenantUser && unit) {
    await prisma.lease.upsert({
      where: { tenantId: tenantUser.id },
      update: {},
      create: {
        tenantId: tenantUser.id,
        unitId: unit.id,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        moveInAt: new Date(),
        rentAmount: 1800,
        depositAmount: 500,
        status: LeaseStatus.ACTIVE,
        noticePeriodDays: 45,
        autoRenew: true,
        autoRenewLeadDays: 60,
      },
    });
  }

  console.info('✅ Seed complete.');
  if (tenantUser && unit) {
    console.info(`   Lease ensured for ${tenantUser.username} in unit ${unit.name}.`);
  }
  console.info('   Technicians:', technicians.map((t) => `${t.name} (${t.role})`).join(', '));
}

main()
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





