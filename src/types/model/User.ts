import { z } from "zod";
import { zodObjectId } from "../zod";

const userSchema = z.object({
  _id: zodObjectId,
  role: z.enum(["admin", "collaborator"]),
  email: z.string().email(),
  password: z.string(),
});

export const validate = userSchema.safeParse;

export type User = z.infer<typeof userSchema>;
