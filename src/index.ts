import express from "express";
import routes from "./routes";
import { env } from "./lib/env";

const app = express();

app.use(express.json());
app.use("/api", routes);

app.get("/", (_req, res) => {
  res.send("MVSystem API");
});

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});