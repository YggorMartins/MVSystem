import { Request, Response } from "express";
import * as supplierService from "../services/supplierService";
import * as purchaseService from "../services/purchaseService";
const id = (value: string | string[] | undefined) =>
  typeof value === "string" && Number.isInteger(Number(value)) && Number(value) > 0
    ? Number(value)
    : null;
export const listSuppliers = async (_req: Request, res: Response) =>
  res.json(await supplierService.list());
export const createSupplier = async (req: Request, res: Response) =>
  res.status(201).json(await supplierService.create(req.body, req.user?.userId));
export const updateSupplier = async (req: Request, res: Response) => {
  const value = id(req.params.id);
  if (!value) return res.status(400).json({ error: "Fornecedor inválido" });
  return res.json(await supplierService.update(value, req.body, req.user?.userId));
};
export const listPurchases = async (_req: Request, res: Response) =>
  res.json(await purchaseService.list());
export const createPurchase = async (req: Request, res: Response) =>
  res.status(201).json(await purchaseService.create(req.body, req.user?.userId));
export const cancelPurchase = async (req: Request, res: Response) => {
  const value = id(req.params.id);
  if (!value) return res.status(400).json({ error: "Compra inválida" });
  return res.json(await purchaseService.cancel(value, req.user?.userId));
};
