import { Request, Response } from 'express';
import * as saleService from '../services/saleService';

export const create = async (req: Request, res: Response) => {

  try {

    const sale = await saleService.create(req.body);

    res.status(201).json(sale);

  } catch (error: any) {

    res.status(400).json({ error: error.message });
    
  }
};