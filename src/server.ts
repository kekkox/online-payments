import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { authRoute } from "./routes";

import type { Express } from "express";

const app: Express = express();
// Register the body parser
app.use(express.json());
// Register the cookie parser
app.use(cookieParser());
// Register the cors
app.use(cors());

// Register the routes
app.use("/api/auth", authRoute);

export default app;
