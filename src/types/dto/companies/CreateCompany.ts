import { z } from "zod";
import checkingAccountSchema from "../../model/CheckingAccount";

const createCompanySchema = z.object({
  name: z.string(),
  checkingAccounts: z
    .array(checkingAccountSchema.omit({ _id: true }))
    .optional()
    .default([]),
});

export const validateCreateCompany = createCompanySchema.safeParse;

export type CreateCompanyDto = z.infer<typeof createCompanySchema>;
