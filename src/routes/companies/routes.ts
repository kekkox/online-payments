import { Router, Response } from "express";

import { authorize } from "../../middleware/auth";
import { Company } from "../../model";
import { IAuthRequest, IResponse } from "../../types";
import { validateCreateCompany } from "../../types/dto/companies";
import { Company as CompanyType } from "../../types/model";
import { validateCompany } from "./validation";

const router = Router();

// Get all the companies
router.get(
  "/",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<CompanyType[]>>) => {
    // Get the companies
    const companies: CompanyType[] = await Company.find({}).lean();

    // Send the response
    return res.send({
      ok: true,
      data: companies,
    });
  }
);

// Get a company by id
router.get(
  "/:id",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<CompanyType>>) => {
    // Get the company id
    const { id } = req.params;

    // Validate the company id
    const validation = await validateCompany(id);
    if (validation.error) {
      return res.status(400).send({ ok: false, message: validation.message });
    }

    // Get the company
    const company: CompanyType = await Company.findById(req.params.id).lean();

    // Send the response
    return res.send({
      ok: true,
      data: company,
    });
  }
);

// Create a company account
router.post(
  "/",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<CompanyType>>) => {
    // Validate the body
    const validation = validateCreateCompany(req.body);
    if (!validation.success) {
      return res.status(400).send({ ok: false, message: validation.error.message });
    }

    // Create the company
    const company = await Company.create(validation.data);

    // Send the response
    return res.send({
      ok: true,
      data: company,
    });
  }
);

// Delete a company account and all the associated checking accounts
router.delete(
  "/:id",
  authorize("admin"),
  async (req: IAuthRequest, res: Response<IResponse<CompanyType>>) => {
    // Get the company id
    const { id } = req.params;

    // Validate the company id
    const validation = await validateCompany(id);
    if (validation.error) {
      return res.status(400).send({ ok: false, message: validation.message });
    }

    // Delete the company
    const company: CompanyType = await Company.findByIdAndDelete(id).lean();

    // Send the response
    return res.send({
      ok: true,
      data: company,
    });
  }
);

export default router;
