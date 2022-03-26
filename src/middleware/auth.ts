import jwt from "jsonwebtoken";

import User from "../model/User";
import { IAuthPayload, UserRole, validatePayload } from "../types/auth";

import type { Response } from "express";
import type { IRequest, IResponse, ValidationResult } from "../types";

/**
 * Middleware that allow the access to a route only if the user is authenticated.
 * If one or more role are specified, the user will be authorized only if it has the specified role
 */
export const authorize = (...roles: UserRole[]) => {
  return async (req: IRequest, res: Response<IResponse<any>>, next: Function) => {
    // Try to get the token from the header
    const token = req.header("authorization");
    if (!token)
      return res.status(401).send({ ok: false, message: "Access denied. No token provided." });

    try {
      // Verify token (Algorithm that differ from H512 will be rejected)
      const decodedPayload = jwt.verify(token, process.env.JWT_SECRET!, {
        algorithms: ["HS512"],
      });

      // Validate the payload
      const { error } = isPayloadValid(decodedPayload);
      if (error) {
        return res.status(401).send({ ok: false, message: "Invalid token." });
      }

      //   Destructure the payload
      const { _id, role } = decodedPayload as IAuthPayload;

      // Check if the user still exists
      const user = await User.findById(_id);
      if (!user)
        return res.status(403).send({
          ok: false,
          message:
            "Your account is either suspended or inactive. Contact admin to re-activate your account.",
        });

      // Check if the user has the right role
      if (roles.length > 0 && !roles.includes(role))
        return res.status(403).send({
          ok: false,
          message: "You don't have the right role to access this route.",
        });

      // Set the token payload to the request object
      req.user = decodedPayload as IAuthPayload;
      // Continue with the request
      next();
    } catch (ex) {
      // TODO: Implement refresh token mechanism
      return res.status(401).send({ ok: false, message: "Invalid token." });
    }
  };
};

// Utility function to validate the JWT token payload
const isPayloadValid = (payload: any): ValidationResult => {
  // If the payload is falsy, it means that the token is invalid
  if (!payload) {
    return { error: true, message: "Missing token." };
  }

  const validation = validatePayload(payload);
  if (!validation.success) {
    return { error: true, message: validation.error.message };
  }

  return { error: false };
};
