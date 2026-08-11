import { Request, Response } from "express";
import * as productService from "../services/productService";

export const create = async (req: Request, res: Response) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const list = async (_req: Request, res: Response) => {
  try {
    const products = await productService.listProducts();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const findByBarcode = async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params; // Assumindo que o código de barras é passado como parâmetro na URL

    if (typeof barcode !== "string") {
      // Validação básica para garantir que o código de barras é uma string
      return res.status(400).json({ error: "Invalid barcode" });
    }

    const product = await productService.findByBarcode(barcode); // Chama o serviço para buscar o produto pelo código de barras

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
