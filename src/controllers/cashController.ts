import { Request, Response } from "express";
import * as cashService from "../services/cashService";
import { AppError } from "../middleware/errorMiddleware";

export const open = async (req: Request, res: Response) => {
  try {
    const register = await cashService.open(req.body, req.user?.userId);
    res.status(201).json(register);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const close = async (req: Request, res: Response) => {
  try {
    const parsedId = Number(req.params.id);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const register = await cashService.close(parsedId, req.user?.userId);

    return res.json(register);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const listRegisters = async (_req: Request, res: Response) => {
  try {
    const registers = await cashService.listRegisters();
    res.json(registers);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const listMovements = async (req: Request, res: Response) => {
  try {
    const parsedId = Number(req.params.id);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const movements = await cashService.listMovements(parsedId);
    res.json(movements);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const movement = async (req: Request, res: Response) => {
  try {
    const movement = await cashService.movement(req.body, req.user?.userId);
    res.status(201).json(movement);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
