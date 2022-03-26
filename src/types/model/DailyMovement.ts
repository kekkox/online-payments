import { z } from "zod";

const dailyMovementSchema = z.object({
  date: z.date(),
  balance: z.number(),
  expenses: z.number(),
  income: z.number(),
});

export type DailyMovement = z.infer<typeof dailyMovementSchema>;

export default dailyMovementSchema;
