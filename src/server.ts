import express from "express";
import type { Express } from "express";

const app: Express = express();
// Register the body parser
app.use(express.json());

export default app;
