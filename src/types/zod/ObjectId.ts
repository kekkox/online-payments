import { z } from "zod";
import { Types } from "mongoose";

export const zodObjectId = z.instanceof(Types.ObjectId).or(z.string().regex(/^[a-f\d]{24}$/i));
