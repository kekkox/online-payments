import { Schema, model } from "mongoose";
import type { User } from "../types/model";

const userSchema = new Schema<User>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    required: true,
  },
});

export default model<User>("User", userSchema);
