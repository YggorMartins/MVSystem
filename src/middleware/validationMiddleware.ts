import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Dados da requisição inválidos",
        details: result.error.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.code === "unrecognized_keys"
            ? `Campo(s) não permitido(s): ${issue.keys.join(", ")}`
            : issue.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
};
