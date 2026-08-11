import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { AppError } from "../middleware/errorMiddleware";

type RegisterInput = {
  email: string;
  password: string;
  role?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export async function register(data: RegisterInput) {
  const exists = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (exists) {
    throw new AppError(400, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: data.role ?? "user",
    },
  });
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);

  if (!valid) {
    throw new AppError(401, "Invalid credentials");
  }

  return signToken({
    userId: user.id,
    role: user.role,
  });
}
