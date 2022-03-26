import { Request } from "express";
import { IAuthPayload } from "./auth";

export interface IAuthRequest extends Request {
  user: IAuthPayload;
}
