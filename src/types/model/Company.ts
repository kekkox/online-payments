import { z } from "zod";
import { Model, Types } from "mongoose";
import checkingAccountSchema from "./CheckingAccount";
import {
  ICompanyAccountReport,
  ICompanyAccountReportOptions,
  ICompanyMonthlyReport,
} from "../checkingAccount";

const companySchema = z.object({
  name: z.string(),
  checkingAccounts: z.array(checkingAccountSchema),
});

export type Company = z.infer<typeof companySchema>;
export interface ICompanyModel extends Model<Company> {
  /**
   * Get the report of the company with the given id
   * @param companyId The id of the company for which we want to get the report
   * @param options Additional options for the report
   */
  getCompanyReport(
    companyId: Types.ObjectId,
    options: ICompanyAccountReportOptions
  ): Promise<ICompanyAccountReport>;

  /**
   * Get a report month by month for the company with the given id
   * @param companyId The id of the company for which we want to get the report
   * @param options Additional options for the report
   */
  getMonthlyReport(
    companyId: Types.ObjectId,
    options: ICompanyAccountReportOptions
  ): Promise<ICompanyMonthlyReport[]>;
}

export const validateCompany = companySchema.safeParse;
export default companySchema;
