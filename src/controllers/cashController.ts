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
    const { id } = req.params; // Assumindo que o ID do caixa é passado como parâmetro na URL

    const parsedId = Number(id);

    if (isNaN(parsedId)) { // Validação básica para garantir que o ID é um número
      return res.status(400).json({ error: 'Invalid id' });
    }

    const register = await cashService.close(parsedId, req.body); // Chama o serviço para fechar o caixa com o ID e os dados fornecidos

    return res.json(register);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
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