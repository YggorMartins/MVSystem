import { Request, Response } from "express";
import * as reportService from "../services/reportService";

export const daily = async (_req: Request, res: Response) => {
  res.json(await reportService.daily());
};

export const dashboard = async (_req: Request, res: Response) => {
  res.json(await reportService.dashboard());
};

export const inventory = async (req: Request, res: Response) => {
  const category =
    typeof req.query.categoryId === "string" ? Number(req.query.categoryId) : undefined;
  if (category !== undefined && (!Number.isInteger(category) || category <= 0))
    return res.status(400).json({ error: "Categoria inválida" });
  const stock = req.query.stock;
  if (stock !== undefined && stock !== "low" && stock !== "zero")
    return res.status(400).json({ error: "Filtro de estoque inválido" });
  return res.json(
    await reportService.inventory({
      categoryId: category,
      stock: stock as "low" | "zero" | undefined,
    }),
  );
};
