import prisma from "../src/config/prisma.js";

async function main() {
  console.log("Starting database seed...");

  const beverages = await prisma.category.upsert({
    where: { name: "Beverages" },
    update: {
      description: "Soft drinks, water, juice and other beverages",
    },
    create: {
      name: "Beverages",
      description: "Soft drinks, water, juice and other beverages",
    },
  });

  const dairy = await prisma.category.upsert({
    where: { name: "Dairy" },
    update: {
      description: "Milk, cheese, yoghurt and dairy products",
    },
    create: {
      name: "Dairy",
      description: "Milk, cheese, yoghurt and dairy products",
    },
  });

  const bakery = await prisma.category.upsert({
    where: { name: "Bakery" },
    update: {
      description: "Bread, buns and bakery products",
    },
    create: {
      name: "Bakery",
      description: "Bread, buns and bakery products",
    },
  });

  const household = await prisma.category.upsert({
    where: { name: "Household" },
    update: {
      description: "Cleaning and household products",
    },
    create: {
      name: "Household",
      description: "Cleaning and household products",
    },
  });

  const sampleProducts = [
    {
      barcode: "100000000001",
      sku: "BEV-001",
      name: "Cola Bottle 1L",
      description: "One litre cola soft drink",
      costPriceCents: 38000,
      sellingPriceCents: 45000,
      stockQuantity: 50,
      reorderLevel: 10,
      unit: "BOTTLE",
      categoryId: beverages.id,
    },
    {
      barcode: "100000000002",
      sku: "DAI-001",
      name: "Fresh Milk 1L",
      description: "One litre fresh milk carton",
      costPriceCents: 46000,
      sellingPriceCents: 55000,
      stockQuantity: 30,
      reorderLevel: 8,
      unit: "CARTON",
      categoryId: dairy.id,
    },
    {
      barcode: "100000000003",
      sku: "BAK-001",
      name: "Large Bread",
      description: "Large sliced bread loaf",
      costPriceCents: 16000,
      sellingPriceCents: 20000,
      stockQuantity: 25,
      reorderLevel: 5,
      unit: "LOAF",
      categoryId: bakery.id,
    },
    {
      barcode: "100000000004",
      sku: "HOU-001",
      name: "Dishwashing Liquid 500ml",
      description: "Household dishwashing liquid",
      costPriceCents: 42000,
      sellingPriceCents: 52000,
      stockQuantity: 20,
      reorderLevel: 5,
      unit: "BOTTLE",
      categoryId: household.id,
    },
  ];

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: {
        barcode: product.barcode,
      },
      update: product,
      create: product,
    });
  }

  console.log(`Created or updated ${sampleProducts.length} sample products.`);
  console.log("Database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });