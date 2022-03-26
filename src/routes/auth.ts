import { Router, Response } from "express";

import { IAuthRequest, IErrorResponse, IResponse } from "../types";
import { User } from "../model";
import { LoginDto, SignupDto, validateLogin, validateSignup } from "../types/auth/dto";
import { authorize } from "../middleware/auth";

// Utility constants
const LOGIN_FAILED_ERROR: IErrorResponse = { ok: false, message: "Wrong email or password" };

// Create the router
const router = Router();

// Endpoint that handles login requests
router.post("/", async (req, res: Response<IResponse<{ token: string }>>) => {
  // Validate the body
  const validation = validateLogin(req.body);
  if (!validation.success) {
    return res.status(400).send({ ok: false, message: validation.error.message });
  }

  // Destructure the body
  const { email, password } = req.body as LoginDto;

  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).send(LOGIN_FAILED_ERROR);
  }

  // Check if the password is correct
  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return res.status(401).send(LOGIN_FAILED_ERROR);
  }

  // Generate the token
  const token = user.generateAuthToken();
  // Set the token to the cookie
  res.cookie("authToken", token, { httpOnly: true });

  // Send the response
  return res.send({
    ok: true,
    data: { token },
  });
});

// Endpoint that handles signup requests for company users
router.post("/signup", async (req, res: Response<IResponse<{ token: string }>>) => {
  // Validate the body
  const validation = validateSignup(req.body);
  if (!validation.success) {
    return res.status(400).send({ ok: false, message: validation.error.message });
  }

  // Destructure the body
  const { email, password } = req.body as SignupDto;

  // Check if an user with the same email already exists
  const duplicatedUser = await User.findOne({ email });
  if (duplicatedUser) {
    return res.status(400).send({ ok: false, message: "Email already in use" });
  }

  // Create the user
  const user = new User({ email, password, role: "admin" });
  await user.save();

  // Generate the token
  const token = user.generateAuthToken();
  // Set the token to the cookie
  res.cookie("authToken", token, { httpOnly: true });

  // Send the response
  return res.send({
    ok: true,
    data: { token },
  });
});

// Endpoint that handles logout requests
router.post(
  "/logout",
  authorize(),
  async (req: IAuthRequest, res: Response<IResponse<undefined>>) => {
    // Delete all the cookies
    res.clearCookie("authToken");

    res.status(200).send({ ok: true, data: undefined, message: "Logged out" });
  }
);

export default router;
