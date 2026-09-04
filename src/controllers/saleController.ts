import { Request, Response } from "express";
import * as saleService from "../services/saleService";

export const create = async (req: Request, res: Response) => {
  const sale = await saleService.createSale(req.body, req.user?.userId);
  res.status(201).json(sale);
};
export const find = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Venda inválida" });
  return res.json(await saleService.findSale(id));
};
