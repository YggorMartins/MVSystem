import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();
const input = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(12).max(72),
}).safeParse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });

async function main() {
  if (!input.success) {
    throw new Error("Defina ADMIN_EMAIL válido e ADMIN_PASSWORD com 12 a 72 caracteres");
  }
  const passwordHash = await bcrypt.hash(input.data.password, 12);
  const admin = await prisma.user.upsert({
    where: { email: input.data.email },
    update: { passwordHash, role: "admin" },
    create: { email: input.data.email, passwordHash, role: "admin" },
    select: { id: true, email: true },
  });
  console.log(`Administrador configurado: ${admin.email} (id ${admin.id})`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Falha ao criar administrador");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
