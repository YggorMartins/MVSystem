import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

declare const process: any;

const prisma = new PrismaClient();

async function main() {
  const pwd = await bcrypt.hash("admin123", 10);

  // Criar Usuário Admin Base
  const admin = await prisma.user.upsert({
    where: { email: "admin@mvsystem.com" },
    update: {},
    create: {
      email: "admin@mvsystem.com",
      passwordHash: pwd,
      role: "admin",
    },
  });

  // Criar Caixa padrão
  const register = await prisma.cashRegister.create({
    data: {
      openedAt: new Date(),
      initialAmount: 200.0,
      status: "open",
    },
  });

  console.log({
    seed: "Database seeded successfully",
    adminId: admin.id,
    activeCashRegisterId: register.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
