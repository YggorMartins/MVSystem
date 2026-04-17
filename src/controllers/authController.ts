import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ id: user.id, email: user.email });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const token = await authService.login(req.body);
    res.json({ token });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};