import { Schema, model } from "mongoose";

import { Company, CheckingAccount, DailyMovement } from "../types/model";

// Schema for the daily movement
const dailyMovementSchema = new Schema<DailyMovement>(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    balance: {
      type: Number,
      required: true,
    },
    expenses: {
      type: Number,
      default: 0,
    },
    income: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Schema for the checking account
const checkingAccountsSchema = new Schema<CheckingAccount>(
  {
    name: {
      type: String,
      required: true,
    },
    public: {
      type: Boolean,
      default: false,
    },
    movements: {
      type: [dailyMovementSchema],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Schema for the company
const companySchema = new Schema<Company>(
  {
    name: {
      type: String,
      required: true,
    },
    checkingAccounts: {
      type: [checkingAccountsSchema],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<Company>("Company", companySchema);
