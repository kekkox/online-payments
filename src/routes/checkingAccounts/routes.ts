import { Router, Response } from "express";
import { Types } from "mongoose";

import { authorize } from "../../middleware/auth";
import { Company } from "../../model";
import { IAuthRequest, IResponse } from "../../types";
import { ICompanyAccountReport } from "../../types/checkingAccount";
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

export default router;
