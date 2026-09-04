if (process.env.NODE_ENV !== "test") throw new Error("Os testes exigem NODE_ENV=test");
if (!process.env.DATABASE_URL?.includes("_test"))
  throw new Error("Os testes exigem um DATABASE_URL de banco isolado contendo _test");
