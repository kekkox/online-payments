import { isValidObjectId } from "mongoose";
import { User } from "../../../model";

import { ValidationResult } from "../../../types";

export const validateCollaborator = async (collaboratorId: string): Promise<ValidationResult> => {
  // Validate the collaborator id
  if (!collaboratorId || !isValidObjectId(collaboratorId)) {
    return { error: true, message: "Invalid collaborator id" };
  }

  // Check if the collaborator exists
  const collaborator = await User.findOne({ _id: collaboratorId, role: "collaborator" });
  if (!collaborator) {
    return {
      error: true,
      message: "The specified collaborator id doesn't belong to any collaborator",
    };
  }

  return { error: false };
};
