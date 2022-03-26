import express from "express";

import { authRoute } from "./routes";

import type { Express } from "express";

const app: Express = express();
// Register the body parser
app.use(express.json());

// Register the routes
app.use("/api/auth", authRoute);

export default app;
