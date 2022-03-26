import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const validateLogin = loginSchema.safeParse;

export type LoginDto = z.infer<typeof loginSchema>;
