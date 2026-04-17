import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {

  return (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse(req.body); // Valida os dados do corpo da requisição usando o esquema fornecido

    if (!result.success) {

      return res.status(400).json({ error: result.error.issues }); // Se a validação falhar, retorna um erro 400 com os detalhes dos erros de validação
    }
    req.body = result.data;
    next();
  };
};