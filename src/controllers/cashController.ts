import { Request, Response } from 'express';
import * as cashService from '../services/cashService';

export const open = async (req: Request, res: Response) => {
  try {
    const register = await cashService.open(req.body);
    res.status(201).json(register);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const close = async (req: Request, res: Response) => {
  try {
    const register = await cashService.close(req.params.id, req.body);
    res.json(register);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const movement = async (req: Request, res: Response) => {
  try {
    const movement = await cashService.movement(req.body);
    res.status(201).json(movement);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};