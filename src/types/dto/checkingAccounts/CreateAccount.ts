import { z } from "zod";
import checkingAccountSchema from "../../model/CheckingAccount";
import { zodObjectId } from "../../zod";

const createCheckingAccountSchema = checkingAccountSchema.omit({ _id: true }).extend({
  company: zodObjectId,
});

export const validateCreateCheckingAccount = createCheckingAccountSchema.safeParse;

export type CreateCheckingAccountDto = z.infer<typeof createCheckingAccountSchema>;
