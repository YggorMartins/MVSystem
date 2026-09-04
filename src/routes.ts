import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import * as ctrl from "./controllers/appControllers";
import * as cashController from "./controllers/cashController";
import * as customerController from "./controllers/customerController";
import * as productController from "./controllers/productController";
import * as reportController from "./controllers/reportController";
import * as saleController from "./controllers/saleController";
import * as userController from "./controllers/userController";
import * as supplyController from "./controllers/supplyController";
import * as fiscalController from "./controllers/fiscalController";
import { allowRoles, auth } from "./middleware/authMiddleware";
import { validate } from "./middleware/validationMiddleware";
import * as schemas from "./schemas/appSchemas";
import * as cashSchemas from "./schemas/cashSchema";
import * as customerSchemas from "./schemas/customerSchema";
import * as userSchemas from "./schemas/userSchema";
import * as supplierSchemas from "./schemas/supplierSchema";
import * as purchaseSchemas from "./schemas/purchaseSchema";

const router = Router();

// Auth (Público)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });
router.post("/auth/login", authLimiter, validate(schemas.loginSchema), ctrl.login);

router.get("/users", auth, allowRoles("admin"), userController.list);
router.post(
  "/users",
  auth,
  allowRoles("admin"),
  validate(userSchemas.createUser),
  userController.create,
);
router.patch(
  "/users/:id",
  auth,
  allowRoles("admin"),
  validate(userSchemas.updateUser),
  userController.update,
);

// Categorias (Apenas Admin e Gerente)
router.post(
  "/categories",
  auth,
  allowRoles("admin", "gerente"),
  validate(schemas.categorySchema),
  ctrl.createCategory,
);
router.get("/categories", auth, allowRoles("admin", "gerente", "estoque"), ctrl.listCategories);

router.get("/customers", auth, allowRoles("admin", "gerente", "caixa"), customerController.list);
router.post(
  "/customers",
  auth,
  allowRoles("admin", "gerente", "caixa"),
  validate(customerSchemas.create),
  customerController.create,
);
router.get("/credits", auth, allowRoles("admin", "gerente", "caixa"), customerController.credits);
router.post(
  "/customers/:id/credit-payments",
  auth,
  allowRoles("admin", "gerente", "caixa"),
  validate(customerSchemas.payment),
  customerController.payment,
);

// Produtos (Gestão por Admin, Gerente e Estoque)
router.post(
  "/products",
  auth,
  allowRoles("admin", "gerente", "estoque"),
  validate(schemas.productSchema),
  ctrl.createProduct,
);
router.get(
  "/products",
  auth,
  allowRoles("admin", "gerente", "estoque", "caixa"),
  ctrl.listProducts,
);
router.get(
  "/products/barcode/:barcode",
  auth,
  allowRoles("admin", "gerente", "estoque", "caixa"),
  productController.findByBarcode,
);

// Ajuste manual de estoque (Apenas admin e estoque)
router.patch(
  "/products/:id/stock",
  auth,
  allowRoles("admin", "estoque"),
  validate(
    z.strictObject({
      quantity: z
        .number("A quantidade deve ser um número")
        .nonnegative("A quantidade não pode ser negativa")
        .multipleOf(0.001, "A quantidade deve ter no máximo três casas decimais"),
    }),
  ),
  ctrl.updateStock,
);
router.delete("/products/:id", auth, allowRoles("admin"), ctrl.archiveProduct);
router.patch(
  "/products/:id",
  auth,
  allowRoles("admin", "gerente", "estoque"),
  validate(schemas.productSchema),
  ctrl.updateProduct,
);

// Vendas (Caixa, Gerente e Admin podem registrar)
router.post(
  "/sales",
  auth,
  allowRoles("admin", "gerente", "caixa"),
  validate(schemas.saleSchema),
  ctrl.createSale,
);
router.get("/sales", auth, allowRoles("admin", "gerente", "caixa"), ctrl.listSales);
router.get("/sales/:id", auth, allowRoles("admin", "gerente", "caixa"), saleController.find);
router.delete("/sales/:id", auth, allowRoles("admin"), ctrl.cancelSale);
router.post(
  "/sales/:id/nfce/simulate",
  auth,
  allowRoles("admin", "gerente"),
  fiscalController.simulate,
);

router.get(
  "/suppliers",
  auth,
  allowRoles("admin", "gerente", "estoque"),
  supplyController.listSuppliers,
);
router.post(
  "/suppliers",
  auth,
  allowRoles("admin", "gerente", "estoque"),
  validate(supplierSchemas.create),
  supplyController.createSupplier,
);
router.patch(
  "/suppliers/:id",
  auth,
  allowRoles("admin", "gerente", "estoque"),
  validate(supplierSchemas.update),
  supplyController.updateSupplier,
);
router.get(
  "/purchases",
  auth,
  allowRoles("admin", "gerente", "estoque"),
  supplyController.listPurchases,
);
router.post(
  "/purchases",
  auth,
  allowRoles("admin", "gerente", "estoque"),
  validate(purchaseSchemas.create),
  supplyController.createPurchase,
);
router.delete(
  "/purchases/:id",
  auth,
  allowRoles("admin", "gerente"),
  supplyController.cancelPurchase,
);

// Fluxo de caixa (Admin e Caixa)
router.post(
  "/cash/open",
  auth,
  allowRoles("admin", "caixa"),
  validate(cashSchemas.open),
  cashController.open,
);

router.post(
  "/cash/close/:id",
  auth,
  allowRoles("admin", "caixa"),
  validate(cashSchemas.close),
  cashController.close,
);

router.post(
  "/cash/movement",
  auth,
  allowRoles("admin", "caixa"),
  validate(cashSchemas.movement),
  cashController.movement,
);
router.get("/cash/registers", auth, allowRoles("admin", "caixa"), cashController.listRegisters);
router.get(
  "/cash/registers/:id/movements",
  auth,
  allowRoles("admin", "caixa"),
  cashController.listMovements,
);

// Relatórios diários (Admin, Gerente e Caixa)
router.get("/reports/daily", auth, allowRoles("admin", "gerente", "caixa"), reportController.daily);
router.get(
  "/reports/dashboard",
  auth,
  allowRoles("admin", "gerente", "caixa"),
  reportController.dashboard,
);
router.get(
  "/reports/inventory",
  auth,
  allowRoles("admin", "gerente", "estoque"),
  reportController.inventory,
);

router.get("/audit/logs", auth, allowRoles("admin", "gerente"), ctrl.listAuditLogs);

export default router;
