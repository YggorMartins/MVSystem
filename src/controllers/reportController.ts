import { Request, Response } from "express";
import * as reportService from "../services/reportService";

export const daily = async (_req: Request, res: Response) => {

  try {

    const report = await reportService.daily();

    res.json(report);

  } catch (error: any) {

    res.status(500).json({ error: error.message });
    
  }
};
