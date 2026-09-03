import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { AppError } from "../middleware/errorMiddleware";

type RegisterInput = {
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export async function register(data: RegisterInput) {
  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: "caixa",
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    await bcrypt.compare(
      data.password,
      "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
    );
    throw new AppError(401, "E-mail ou senha inválidos");
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);

  if (!valid) {
    throw new AppError(401, "E-mail ou senha inválidos");
  }

  return signToken({
    userId: user.id,
  });
}
