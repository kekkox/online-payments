import type { Request } from "express";
import { IAuthPayload } from "./auth";

export interface IRequest extends Request {
  user?: IAuthPayload;
}

export interface IAuthRequest extends IRequest {
  user: IAuthPayload;
}
