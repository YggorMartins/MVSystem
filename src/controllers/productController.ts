import { Request, Response } from "express";
import * as productService from "../services/productService";

export const create = async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body, req.user?.userId);
  res.status(201).json(product);
};

export const list = async (_req: Request, res: Response) => {
  res.json(await productService.listProducts());
};

export const findByBarcode = async (req: Request, res: Response) => {
  const { barcode } = req.params;
  if (typeof barcode !== "string" || !barcode || barcode.length > 64) {
    return res.status(400).json({ error: "Código de barras inválido" });
  }
  const product = await productService.findByBarcode(barcode);

    if (!product) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }
  return res.json(product);
};
