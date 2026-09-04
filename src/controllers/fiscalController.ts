import { Request, Response } from "express";
import { issueSimulation } from "../services/fiscalService";
export const simulate = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Venda inválida" });
  return res.status(201).json(await issueSimulation(id, req.user?.userId));
};
