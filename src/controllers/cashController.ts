import { Request, Response } from "express";
import * as cashService from "../services/cashService";

function parsePositiveId(value: string | string[] | undefined) {
  const id = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const open = async (req: Request, res: Response) => {
  const register = await cashService.open(req.body, req.user?.userId);
  res.status(201).json(register);
};

export const close = async (req: Request, res: Response) => {
  const id = parsePositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: "Identificador do caixa inválido" });
  const register = await cashService.close(id, req.body, req.user?.userId);
  return res.json(register);
};

export const listRegisters = async (_req: Request, res: Response) => {
  res.json(await cashService.listRegisters());
};

export const listMovements = async (req: Request, res: Response) => {
  const id = parsePositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: "Identificador do caixa inválido" });
  return res.json(await cashService.listMovements(id));
};

export const movement = async (req: Request, res: Response) => {
  const movement = await cashService.movement(req.body, req.user?.userId);
  res.status(201).json(movement);
};
