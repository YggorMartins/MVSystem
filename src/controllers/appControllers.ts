import { Request, Response } from "express";
import * as authService from "../services/authService";
import * as productService from "../services/productService";
import * as saleService from "../services/saleService";
import { AuditRepository } from "../repositories/auditRepository";
import * as productController from "./productController";

export const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  res.status(201).json(user);
};

export const login = async (req: Request, res: Response) => {
  const token = await authService.login(req.body);
  res.json({ token });
};

export const createCategory = async (req: Request, res: Response) => {
  const category = await productService.createCategory(
    req.body.name,
    req.user?.userId,
  );
  res.status(201).json(category);
};

export const createProduct = async (req: Request, res: Response) => {
  const product = await productService.createProduct(
    req.body,
    req.user?.userId,
  );
  res.status(201).json(product);
};

export const listCategories = async (_req: Request, res: Response) => {
  const categories = await productService.listCategories();
  res.json(categories);
};

export const listSales = async (_req: Request, res: Response) => {
  const sales = await saleService.listSales();
  res.json(sales);
};

export const listAuditLogs = async (_req: Request, res: Response) => {
  const logs = await AuditRepository.listAll();
  res.json(logs);
};

export const listProducts = productController.list;

export const updateStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const product = await productService.updateStockManual(
    Number(id),
    Number(quantity),
    req.user?.userId,
  );
  res.json(product);
};

export const createSale = async (req: Request, res: Response) => {
  const sale = await saleService.createSale(req.body, req.user?.userId);
  res.status(201).json(sale);
};
