import { Request, Response } from "express";
import * as service from "../services/customerService";

export async function list(_req: Request, res: Response) {
  res.json(await service.list());
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await service.create(req.body, req.user?.userId));
}
export async function credits(_req: Request, res: Response) {
  res.json(await service.listCredits());
}
export async function settle(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Venda inválida" });
  return res.json(await service.settleCredit(id, req.user?.userId));
}
export async function payment(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Cliente inválido" });
  return res.status(201).json(await service.registerPayment(id, req.body.amount, req.user?.userId));
}
