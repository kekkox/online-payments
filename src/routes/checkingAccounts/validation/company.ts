import { isValidObjectId, Types } from "mongoose";
import { Company } from "../../../model";

import { ValidationResult } from "../../../types";

/**
 * @description Utility function that checks if a company is valid or not
 * @param companyId The id of the company that you want to validate
 * @returns A validation result
 */
export const validateCompany = async (
  companyId: string | Types.ObjectId
): Promise<ValidationResult> => {
  // Validate the company id
  if (!companyId || !isValidObjectId(companyId)) {
    return { error: true, message: "Invalid company id" };
  }

  // Check if a business account exists
  const companyAccount = await Company.findById(companyId);
  if (!companyAccount) {
    return { error: true, message: "The specified company id doesn't belong to any company" };
  }

  return { error: false };
};
