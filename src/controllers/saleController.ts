import { Request, Response } from "express";
import * as saleService from "../services/saleService";

export const create = async (req: Request, res: Response) => {
  const sale = await saleService.createSale(req.body, req.user?.userId);
  res.status(201).json(sale);
};
