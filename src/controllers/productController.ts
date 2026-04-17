import { Request, Response } from 'express';
import * as productService from '../services/productService';

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
    const products = await productService.list();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const findByBarcode = async (req: Request, res: Response) => {
  try {
    const product = await productService.findByBarcode(req.params.barcode);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};