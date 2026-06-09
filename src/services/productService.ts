import { ProductRepository } from "../repositories/productRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { AppError } from "../middleware/errorMiddleware";
import { AuditRepository } from "../repositories/auditRepository";

export async function createCategory(name: string, userId?: number) {
  const exists = await CategoryRepository.findByName(name);
  if (exists) throw new AppError(400, "Category already exists");

  const category = await CategoryRepository.create(name);
  await AuditRepository.log(
    userId,
    "CATEGORY_CREATE",
    `Created category ${name}`,
  );
  return category;
}

export async function createProduct(data: any, userId?: number) {
  const exists = await ProductRepository.findByBarcode(data.barcode);
  if (exists) throw new AppError(400, "Product barcode already registered");

  const product = await ProductRepository.create(data);
  await AuditRepository.log(
    userId,
    "PRODUCT_CREATE",
    `Created product ${data.name} - Barcode: ${data.barcode}`,
  );
  return product;
}

export async function listProducts() {
  return ProductRepository.listAll();
}

export async function updateStockManual(
  productId: number,
  newQuantity: number,
  userId?: number,
) {
  const product = await ProductRepository.findById(productId);
  if (!product) throw new AppError(404, "Product not found");

  const updated = await ProductRepository.updateStock(productId, newQuantity);
  await AuditRepository.log(
    userId,
    "STOCK_MANUAL_UPDATE",
    `Updated ID ${productId} stock to ${newQuantity}`,
  );
  return updated;
}
