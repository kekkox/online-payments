import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const validateSignup = signupSchema.safeParse;

export type SignupDto = z.infer<typeof signupSchema>;
