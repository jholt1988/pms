import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ML training data...');

  // Update existing properties with ML training fields
  const properties = await prisma.property.findMany();
  
  const propertyUpdates = [
    {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      type: 'Apartment',
      yearBuilt: 2015,
      hasPool: true,
      hasGym: true,
      hasElevator: true,
      hasParking: true,
      neighborhood: 'Downtown',
    },
    {
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      type: 'Apartment',
      yearBuilt: 2010,
      hasPool: false,
      hasGym: true,
      hasElevator: false,
      hasParking: true,
      neighborhood: 'Hollywood',
    },
    {
      city: 'San Diego',
      state: 'CA',
      zipCode: '92101',
      type: 'Condo',
      yearBuilt: 2018,
      hasPool: true,
      hasGym: false,
      hasElevator: true,
      hasParking: false,
      neighborhood: 'Gaslamp',
    },
  ];

  for (let i = 0; i < properties.length && i < propertyUpdates.length; i++) {
    await prisma.property.update({
      where: { id: properties[i].id },
      data: propertyUpdates[i],
    });
    console.log(`✅ Updated property ${properties[i].id} - ${properties[i].name}`);
  }

  // Update existing units with ML training fields
  const units = await prisma.unit.findMany();
  
  const unitConfigs = [
    { bedrooms: 2, bathrooms: 2.0, squareFeet: 1200, floor: 3, hasParking: true, hasLaundry: true, hasBalcony: true, hasAC: true, isFurnished: false, petsAllowed: true },
    { bedrooms: 1, bathrooms: 1.0, squareFeet: 750, floor: 2, hasParking: false, hasLaundry: true, hasBalcony: false, hasAC: true, isFurnished: false, petsAllowed: false },
    { bedrooms: 3, bathrooms: 2.5, squareFeet: 1600, floor: 5, hasParking: true, hasLaundry: true, hasBalcony: true, hasAC: true, isFurnished: true, petsAllowed: true },
    { bedrooms: 2, bathrooms: 1.5, squareFeet: 1100, floor: 1, hasParking: true, hasLaundry: false, hasBalcony: false, hasAC: false, isFurnished: false, petsAllowed: true },
    { bedrooms: 1, bathrooms: 1.0, squareFeet: 650, floor: 4, hasParking: false, hasLaundry: true, hasBalcony: true, hasAC: true, isFurnished: false, petsAllowed: false },
    { bedrooms: 2, bathrooms: 2.0, squareFeet: 1300, floor: 6, hasParking: true, hasLaundry: true, hasBalcony: true, hasAC: true, isFurnished: false, petsAllowed: true },
  ];

  for (let i = 0; i < units.length; i++) {
    const config = unitConfigs[i % unitConfigs.length];
    await prisma.unit.update({
      where: { id: units[i].id },
      data: {
        unitNumber: `${config.floor}0${(i % 4) + 1}`,
        ...config,
      },
    });
    console.log(`✅ Updated unit ${units[i].id} - ${units[i].name}`);
  }

  console.log('✅ ML training data seeded successfully!');
  console.log(`   - Updated ${properties.length} properties`);
  console.log(`   - Updated ${units.length} units`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
