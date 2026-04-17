import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (data: { email: string; password: string; role?: string }) => {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new Error('Email already in use');
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: data.role ?? 'user',
    },
  });
  return user;
};

export const login = async (data: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '1h' });
  return token;
};