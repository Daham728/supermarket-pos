interface ProductSource {
  id: number;
  barcode: string;
  sku: string;
  name: string;
  description: string | null;
  costPriceCents: number;
  sellingPriceCents: number;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  isActive: boolean;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
  };
}

export function formatProduct(product: ProductSource) {
  return {
    id: product.id,
    barcode: product.barcode,
    sku: product.sku,
    name: product.name,
    description: product.description,

    costPrice: product.costPriceCents / 100,
    sellingPrice: product.sellingPriceCents / 100,

    stockQuantity: product.stockQuantity,
    reorderLevel: product.reorderLevel,
    isLowStock: product.stockQuantity <= product.reorderLevel,

    unit: product.unit,
    isActive: product.isActive,

    category: product.category,

    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function convertToCents(amount: number) {
  return Math.round(amount * 100);
}