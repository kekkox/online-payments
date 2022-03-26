import { z } from "zod";

import { UserRole } from "./UserRole";
import { zodObjectId } from "../zod";

const authPayloadSchema = z.object({
  _id: zodObjectId,
  role: z.enum(["admin", "collaborator"]),
});

export const validatePayload = authPayloadSchema.safeParse;

export type IAuthPayload = z.infer<typeof authPayloadSchema> & { role: UserRole };
