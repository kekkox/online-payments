import type { IAuthPayload } from "../../src/types/auth";

declare module "express-serve-static-core" {
  export interface Request {
    user: any;
  }
}
