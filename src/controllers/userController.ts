import { Request, Response } from "express";
import * as userService from "../services/userService";

function idFrom(value: string | string[] | undefined) {
  const id = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const list = async (_req: Request, res: Response) => res.json(await userService.list());
export const create = async (req: Request, res: Response) =>
  res.status(201).json(await userService.create(req.body, req.user?.userId));
export const update = async (req: Request, res: Response) => {
  const id = idFrom(req.params.id);
  if (!id) return res.status(400).json({ error: "Identificador de usuário inválido" });
  return res.json(await userService.update(id, req.body, req.user?.userId));
};
