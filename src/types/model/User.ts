import { z } from "zod";
import { zodObjectId } from "../zod";

const userSchema = z.object({
  _id: zodObjectId,
  role: z.enum(["admin", "collaborator"]),
  email: z.string().email(),
  password: z.string(),
  company: zodObjectId.optional(),
});

export type User = z.infer<typeof userSchema>;
export type ProtectedUser = Omit<User, "password">;

export interface IUserDocument extends User {
  /** Function that check if the given password match with the one of the user */
  comparePassword: (this: User, toCompare: string) => Promise<boolean>;
  /** Generate an authentication token for the current user */
  generateAuthToken: (this: User) => string;
}

export default userSchema;
