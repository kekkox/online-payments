import { z } from "zod";
import { zodObjectId } from "../zod";
import dailyMovementSchema from "./DailyMovement";

const checkingAccountSchema = z.object({
  _id: zodObjectId,
  name: z.string(),
  public: z.boolean(),
  movements: z.array(dailyMovementSchema).default([]),
  createdAt: z.date().default(new Date()),
});

export type CheckingAccount = z.infer<typeof checkingAccountSchema>;

export default checkingAccountSchema;
