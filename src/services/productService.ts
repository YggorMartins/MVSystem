import { ProductRepository } from "../repositories/productRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";
import { prisma } from "../lib/prisma";

export async function createCategory(name: string, userId?: number) {
  const exists = await CategoryRepository.findByName(name);
  if (exists) throw new AppError(409, "A categoria já existe");

  return prisma.$transaction(async (tx) => {
    const category = await CategoryRepository.create(name, tx);
    await AuditRepository.log(userId, "CATEGORY_CREATE", `Categoria ${name} criada`, tx);
    return category;
  });
}

export async function createProduct(data: any, userId?: number) {
  const exists = await ProductRepository.findAnyByBarcode(data.barcode);
  if (exists) throw new AppError(409, "O código de barras já está cadastrado");

  return prisma.$transaction(async (tx) => {
    const product = await ProductRepository.create(data, tx);
    await AuditRepository.log(
      userId,
      "PRODUCT_CREATE",
      `Produto ${data.name} criado - código ${data.barcode}`,
      tx,
    );
    return product;
  });
}

export async function archiveProduct(productId: number, userId?: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, "Produto não encontrado");
  if (product.archivedAt) throw new AppError(409, "Este produto já foi excluído");
  return prisma.$transaction(async (tx) => {
    const archived = await tx.product.update({
      where: { id: productId },
      data: { archivedAt: new Date() },
    });
    await AuditRepository.log(
      userId,
      "PRODUCT_ARCHIVE",
      `Produto ${productId} (${product.name}) excluído do catálogo`,
      tx,
    );
    return archived;
  });
}

export async function updateProduct(productId: number, data: any, userId?: number) {
  const current = await prisma.product.findUnique({ where: { id: productId } });
  if (!current || current.archivedAt) throw new AppError(404, "Produto não encontrado");
  const barcodeOwner = await ProductRepository.findAnyByBarcode(data.barcode);
  if (barcodeOwner && barcodeOwner.id !== productId)
    throw new AppError(409, "O código de barras já está cadastrado");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        barcode: data.barcode,
        costPrice: data.costPrice,
        price: data.price,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        lowStockThreshold: data.lowStockThreshold,
        categoryId: data.categoryId ?? null,
      },
      include: { category: true },
    });
    await AuditRepository.log(userId, "PRODUCT_UPDATE", `Produto ${productId} atualizado`, tx);
    return updated;
  });
}

export async function findByBarcode(barcode: string) {
  return ProductRepository.findByBarcode(barcode);
}

export async function listCategories() {
  return CategoryRepository.listAll();
}

export async function listProducts() {
  return ProductRepository.listAll();
}

export async function updateStockManual(productId: number, newQuantity: number, userId?: number) {
  const product = await ProductRepository.findById(productId);
  if (!product) throw new AppError(404, "Produto não encontrado");

  return prisma.$transaction(async (tx) => {
    const updated = await ProductRepository.updateStock(productId, newQuantity, tx);
    await AuditRepository.log(
      userId,
      "STOCK_MANUAL_UPDATE",
      `Estoque do produto ${productId} atualizado para ${newQuantity}`,
      tx,
    );
    return updated;
  });
}
