import { Router, Response } from "express";

import { authorize } from "../../middleware/auth";
import { User } from "../../model";
import { IAuthRequest, IResponse } from "../../types";
import {
  validateCreateCollaborator,
  CreateCollaboratorDto,
  validateEditCollaborator,
  EditCollaboratorDto,
} from "../../types/dto/collaborators";
import { validateCollaborator, validateCompany } from "./validation";

import type { ProtectedUser } from "../../types/model";

// List of fields that should be removed from a collaborator
const FORBIDDEN_FIELDS = ["password", "__v"];
// Select that removes the forbidden fields
const SELECT_ALLOWED_FIELDS = FORBIDDEN_FIELDS.map((field) => `-${field}`);

const router = Router();

// Get all the collaborators
router.get(
  "/",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<ProtectedUser[]>>) => {
    // Get the collaborators
    const collaborators: ProtectedUser[] = await User.find({ role: "collaborator" })
      .select(SELECT_ALLOWED_FIELDS)
      .lean();

    // Send the response
    return res.send({
      ok: true,
      data: collaborators,
    });
  }
);

// Get a collaborator by id
router.get(
  "/:id",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<ProtectedUser>>) => {
    // Get the collaborator id
    const { id } = req.params;

    // Validate the collaborator id
    const validation = await validateCollaborator(id);
    if (validation.error) {
      return res.status(400).send({ ok: false, message: validation.message });
    }

    // Get the collaborator
    const collaborator: ProtectedUser = await User.findById(req.params.id)
      .select(SELECT_ALLOWED_FIELDS)
      .lean();

    // Send the response
    return res.send({
      ok: true,
      data: collaborator,
    });
  }
);

// Get all the collaborators of a company
router.get(
  "/companies/:companyId",
  authorize(),
  async (req: IAuthRequest, res: Response<IResponse<ProtectedUser[]>>) => {
    // Get the company id
    const { companyId } = req.params;

    // Validate the company id
    const validation = await validateCompany(companyId);
    if (validation.error) {
      return res.status(400).send({ ok: false, message: validation.message });
    }

    // Get the collaborators of the company
    const collaborators: ProtectedUser[] = await User.find({
      company: companyId,
      role: "collaborator",
    })
      .select(SELECT_ALLOWED_FIELDS)
      .lean();

    // Send the response
    return res.send({
      ok: true,
      data: collaborators,
    });
  }
);

// Create a collaborator for a company
router.post(
  "/",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<ProtectedUser>>) => {
    // Get the company id
    const { company: companyId } = req.body;

    // Validate the request body
    const validation = validateCreateCollaborator(req.body);
    if (!validation.success) {
      return res.status(400).send({ ok: false, message: validation.error.message });
    }

    // Validate the company id
    const companyValidation = await validateCompany(companyId);
    if (companyValidation.error) {
      return res.status(400).send({ ok: false, message: companyValidation.message });
    }

    // Destructure the body
    const { email, password } = req.body as CreateCollaboratorDto;

    // Check if an user with the same email already exists
    const duplicatedUser = await User.findOne({ email });
    if (duplicatedUser) {
      return res.status(400).send({ ok: false, message: "Email already in use" });
    }

    // Create the user
    const user = new User({ email, password, role: "collaborator", company: companyId });

    // Save the user
    await user.save();

    // Send the response
    return res.status(201).send({
      ok: true,
      data: protect(user),
    });
  }
);

// Edit a collaborator of a company
router.put(
  "/:id",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<ProtectedUser>>) => {
    // Get the collaborator id
    const { id } = req.params;

    // Validate the collaborator id
    const validation = await validateCollaborator(id);
    if (validation.error) {
      return res.status(400).send({ ok: false, message: validation.message });
    }

    // Validate the request body
    const editValidation = validateEditCollaborator(req.body);
    if (!editValidation.success) {
      return res.status(400).send({ ok: false, message: editValidation.error.message });
    }

    // Destructure the body
    const { email } = req.body as EditCollaboratorDto;

    // Check if an user with the same email already exists
    const duplicatedUser = await User.findOne({ email });
    if (duplicatedUser && duplicatedUser._id.toString() !== id) {
      return res.status(400).send({ ok: false, message: "Email already in use" });
    }

    // Update the collaborator
    const collaborator: ProtectedUser = await User.findByIdAndUpdate(id, { email }, { new: true })
      .select(SELECT_ALLOWED_FIELDS)
      .lean();

    // Send the response
    return res.send({
      ok: true,
      data: collaborator,
    });
  }
);

// Delete a collaborator of a company
router.delete(
  "/:id",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<ProtectedUser>>) => {
    // Get the collaborator id
    const { id } = req.params;

    // Validate the collaborator id
    const validation = await validateCollaborator(id);
    if (validation.error) {
      return res.status(400).send({ ok: false, message: validation.message });
    }

    // Delete the collaborator
    const collaborator: ProtectedUser = await User.findByIdAndDelete(id)
      .select(SELECT_ALLOWED_FIELDS)
      .lean();

    // Send the response
    return res.send({
      ok: true,
      data: collaborator,
    });
  }
);

/**
 * @description Utility function that remove the forbidden fields from a collaborator
 * @param collaborator The collaborator that you want to protect
 * @returns A protected collaborator
 */
const protect = (collaborator: any): ProtectedUser => {
  // Parse the user
  const user = collaborator.toObject();

  // Remove the forbidden fields
  FORBIDDEN_FIELDS.forEach((field) => delete user[field]);

  // Return the user
  return user;
};

export default router;
