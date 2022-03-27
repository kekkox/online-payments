import { z } from "zod";
import { Model, Types } from "mongoose";
import checkingAccountSchema from "./CheckingAccount";
import { ICompanyAccountReport, ICompanyAccountReportOptions } from "../checkingAccount";

const companySchema = z.object({
  name: z.string(),
  checkingAccounts: z.array(checkingAccountSchema),
});

export type Company = z.infer<typeof companySchema>;
export interface ICompanyModel extends Model<Company> {
  getCompanyReport(
    companyId: Types.ObjectId,
    options: ICompanyAccountReportOptions
  ): Promise<ICompanyAccountReport>;
}

export const validateCompany = companySchema.safeParse;
export default companySchema;
