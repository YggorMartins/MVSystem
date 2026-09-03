import { Request, Response } from "express";
import * as reportService from "../services/reportService";

export const daily = async (_req: Request, res: Response) => {
  res.json(await reportService.daily());
};

export const dashboard = async (_req: Request, res: Response) => {
  res.json(await reportService.dashboard());
};
