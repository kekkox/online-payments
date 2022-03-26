import { Schema, model } from "mongoose";
import jwt, { SignOptions } from "jsonwebtoken";
import argon from "argon2";

import type { User } from "../types/model";
import { IAuthPayload } from "../types/auth";

interface IUserDocument extends User, Document {
  /** Function that check if the given password match with the one of the user */
  comparePassword: (this: User, toCompare: string) => Promise<boolean>;
  /** Generate an authentication token for the current user */
  generateAuthToken: (this: User) => string;
}

const userSchema = new Schema<IUserDocument>({
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
    enum: ["admin", "collaborator"],
    required: true,
  },
});

// Encrypt the password before saving the user
userSchema.pre("save", async function (this: User) {
  const hashedPassword = await argon.hash(this.password);
  this.password = hashedPassword;
});

userSchema.methods.comparePassword = function (this: User, toCompare: string): Promise<boolean> {
  return argon.verify(this.password, toCompare);
};

userSchema.methods.generateAuthToken = function (this: User): string {
  // Build the payload
  const payload: IAuthPayload = {
    _id: this._id,
    role: this.role,
  };

  // Define the jwt options
  const jwtOptions: SignOptions = {
    expiresIn: "1d",
    algorithm: "HS512",
  };

  // Generate the token
  const token = jwt.sign(payload, process.env.JWT_SECRET!, jwtOptions);
  return token;
};

export default model<IUserDocument>("User", userSchema);
