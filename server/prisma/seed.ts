import bcrypt from "bcrypt";
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
  console.log(`Created or updated ${sampleProducts.length} sample products.`);
  console.log("Database seed completed successfully.");
    const seedUsers = [
    {
      name:
        process.env.SEED_ADMIN_NAME?.trim() ||
        "Store Administrator",
      email: process.env.SEED_ADMIN_EMAIL
        ?.trim()
        .toLowerCase(),
      password: process.env.SEED_ADMIN_PASSWORD,
      role: "ADMIN",
    },
    {
      name:
        process.env.SEED_CASHIER_NAME?.trim() ||
        "Main Cashier",
      email: process.env.SEED_CASHIER_EMAIL
        ?.trim()
        .toLowerCase(),
      password: process.env.SEED_CASHIER_PASSWORD,
      role: "CASHIER",
    },
  ];

  for (const seedUser of seedUsers) {
    if (!seedUser.email || !seedUser.password) {
      throw new Error(
        `Email or password is missing for the ${seedUser.role} user.`
      );
    }

    if (seedUser.password.length < 12) {
      throw new Error(
        `${seedUser.role} password must contain at least 12 characters.`
      );
    }

    if (Buffer.byteLength(seedUser.password, "utf8") > 72) {
      throw new Error(
        `${seedUser.role} password cannot exceed 72 UTF-8 bytes.`
      );
    }

    const passwordHash = await bcrypt.hash(
      seedUser.password,
      12
    );

    await prisma.user.upsert({
      where: {
        email: seedUser.email,
      },
      update: {
        name: seedUser.name,
        passwordHash,
        role: seedUser.role,
        isActive: true,
      },
      create: {
        name: seedUser.name,
        email: seedUser.email,
        passwordHash,
        role: seedUser.role,
        isActive: true,
      },
    });
  }

  console.log("Created or updated Admin and Cashier accounts.");
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });