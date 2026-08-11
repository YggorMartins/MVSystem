import { Router } from "express";
import * as ctrl from "./controllers/appControllers";
import * as reportController from "./controllers/reportController";
import * as cashController from "./controllers/cashController";
import * as productController from "./controllers/productController";
import { validate } from "./middleware/validationMiddleware";
import { auth, allowRoles } from "./middleware/authMiddleware";
import * as schemas from "./schemas/appSchemas";
import * as cashSchemas from "./schemas/cashSchema";
import { z } from "zod";

const router = Router();

// Auth (Público)
router.post("/auth/register", validate(schemas.registerSchema), ctrl.register);
router.post("/auth/login", validate(schemas.loginSchema), ctrl.login);

// Categorias (Apenas Admin e Gerente)
router.post(
  "/categories",
  auth,
  allowRoles("admin", "gerente"),
  validate(schemas.categorySchema),
  ctrl.createCategory,
);
router.get(
  "/categories",
  auth,
  allowRoles("admin", "gerente"),
  ctrl.listCategories,
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
  validate(z.object({ quantity: z.number().int().nonnegative() })),
  ctrl.updateStock,
);

// Vendas (Caixa, Gerente e Admin podem registrar)
router.post(
  "/sales",
  auth,
  allowRoles("admin", "gerente", "caixa"),
  validate(schemas.saleSchema),
  ctrl.createSale,
);
router.get(
  "/sales",
  auth,
  allowRoles("admin", "gerente", "caixa"),
  ctrl.listSales,
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
  cashController.close,
);

router.post(
  "/cash/movement",
  auth,
  allowRoles("admin", "caixa"),
  validate(cashSchemas.movement),
  cashController.movement,
);
router.get(
  "/cash/registers",
  auth,
  allowRoles("admin", "caixa"),
  cashController.listRegisters,
);
router.get(
  "/cash/registers/:id/movements",
  auth,
  allowRoles("admin", "caixa"),
  cashController.listMovements,
);

// Relatórios diários (Admin, Gerente e Caixa)
router.get(
  "/reports/daily",
  auth,
  allowRoles("admin", "gerente", "caixa"),
  reportController.daily,
);
router.get(
  "/reports/dashboard",
  auth,
  allowRoles("admin", "gerente", "caixa"),
  reportController.dashboard,
);

router.get(
  "/audit/logs",
  auth,
  allowRoles("admin", "gerente"),
  ctrl.listAuditLogs,
);

export default router;
