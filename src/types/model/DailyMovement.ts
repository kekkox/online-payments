import { z } from "zod";

const dailyMovementSchema = z.object({
  date: z.date().or(z.string().transform((toParse) => new Date(toParse))),
  balance: z.number(),
  expenses: z.number().default(0),
  incomes: z.number().default(0),
});

export type DailyMovement = z.infer<typeof dailyMovementSchema>;

export default dailyMovementSchema;
