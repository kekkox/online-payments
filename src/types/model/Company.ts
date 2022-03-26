import { z } from "zod";
import checkingAccountSchema from "./CheckingAccount";

const companySchema = z.object({
  _id: z.string(),
  name: z.string(),
  checkingAccounts: z.array(checkingAccountSchema),
});

export type Company = z.infer<typeof companySchema>;

export const validateCompany = companySchema.safeParse;
export default companySchema;
