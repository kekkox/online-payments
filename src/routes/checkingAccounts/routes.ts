import { Router, Response } from "express";
import { Types } from "mongoose";

import { authorize } from "../../middleware/auth";
import { Company } from "../../model";
import { IAuthRequest, IResponse } from "../../types";
import { ICompanyAccountReport } from "../../types/checkingAccount";
import {
  CreateCheckingAccountDto,
  validateCreateCheckingAccount,
} from "../../types/dto/checkingAccounts";
import { CheckingAccount } from "../../types/model";
import { validateCompany } from "./validation";

const router = Router();

// Get a report of the checking accounts that belongs to the company
router.get(
  "/companies/:companyId",
  authorize(),
  async (req: IAuthRequest, res: Response<IResponse<ICompanyAccountReport>>) => {
    // Get the company id
    const { companyId } = req.params;

    // Validate the company id
    const validation = await validateCompany(companyId);
    if (validation.error) {
      return res.status(400).json({ ok: false, message: validation.message });
    }

    // Parse the company id to a mongoose object id
    const companyIdParsed = new Types.ObjectId(companyId);
    // Check if the logged user is an admin
    const isAdmin = req.user.role === "admin";

    // Get the report
    const report = await Company.getCompanyReport(companyIdParsed, { onlyPublic: !isAdmin });

    // Return the report
    return res.json({ ok: true, data: report });
  }
);

// Create a new checking account
router.post(
  "/",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<CheckingAccount>>) => {
    // Validate the request body
    const bodyValidation = validateCreateCheckingAccount(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({ ok: false, message: bodyValidation.error.message });
    }

    // Destructure the body
    const {
      name,
      movements = [],
      public: isPublic,
      company: companyId,
    } = req.body as CreateCheckingAccountDto;

    // Validate the company id
    const companyValidation = await validateCompany(companyId);
    if (companyValidation.error) {
      return res.status(400).json({ ok: false, message: companyValidation.message });
    }

    // Create the checking account
    const company = await Company.findByIdAndUpdate(
      companyId,
      { $push: { checkingAccounts: { name, movements, public: isPublic } } },
      { new: true }
    ).lean();
    // Check if the company exists
    if (!company) {
      return res.status(400).json({ ok: false, message: "Company not found" });
    }

    // Find the checking account that was just created
    const checkingAccount = company.checkingAccounts.find(
      (account) =>
        account.name === name &&
        account.movements.length === movements.length &&
        account.public === isPublic
    );
    // Check if the checking account was found
    if (!checkingAccount) {
      return res
        .status(500)
        .json({ ok: false, message: "An error occurred while creating the checking account" });
    }

    // Return the checking account
    return res.json({ ok: true, data: checkingAccount });
  }
);

// Delete a checking account
router.delete(
  "/:accountId",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<CheckingAccount>>) => {
    // Get the account id
    const { accountId } = req.params;

    // Find the company that owns the account
    const company = await Company.findOne({ "checkingAccounts._id": accountId }).lean();
    // Check if the company exists
    if (!company) {
      return res
        .status(404)
        .json({ ok: false, message: "The given account id doesn't belong to any company" });
    }

    // Get the account that will be deleted
    const account = company.checkingAccounts.find(({ _id }) => _id == accountId)!;

    // Delete the account
    await Company.findByIdAndUpdate(company._id, {
      $pull: { checkingAccounts: { _id: accountId } },
    });

    // Return the account
    return res.json({ ok: true, data: account });
  }
);

export default router;
