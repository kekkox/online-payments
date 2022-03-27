import { Schema, model, Types, PipelineStage } from "mongoose";
import { ICompanyAccountReport, ICompanyAccountReportOptions } from "../types/checkingAccount";

import { CheckingAccount, Company, DailyMovement, ICompanyModel } from "../types/model";

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
    incomes: {
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
const companySchema: Schema<Company, ICompanyModel> = new Schema<Company>(
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

companySchema.statics.getCompanyReport = async function (
  this: ICompanyModel,
  companyId: Types.ObjectId,
  options: ICompanyAccountReportOptions
): Promise<ICompanyAccountReport> {
  // Destructure options
  const { onlyPublic } = options;

  // Aggregation steps
  const filterByCompany: PipelineStage = { $match: { _id: companyId } };
  const unwindCheckingAccounts: PipelineStage = {
    $unwind: { path: "$checkingAccounts", preserveNullAndEmptyArrays: true },
  };
  const filterOnlyPublicAccounts: PipelineStage = {
    $match: { "checkingAccounts.public": true },
  };
  const calculateExpensesAndIncomes: PipelineStage = {
    $addFields: {
      // Reduce the array of daily movements to a single object
      "checkingAccounts.report": {
        $reduce: {
          input: "$checkingAccounts.movements",
          initialValue: { expenses: 0, incomes: 0 },
          in: {
            expenses: { $add: ["$$value.expenses", "$$this.expenses"] },
            incomes: { $add: ["$$value.incomes", "$$this.incomes"] },
          },
        },
      },
      // Get the first movement
      "checkingAccounts.firstMovement": { $first: "$checkingAccounts.movements" },
    },
  };
  const getBalanceAndFirstAccess: PipelineStage = {
    $project: {
      name: "$name",
      // Give to checkingAccounts the desired shape
      accountReport: {
        _id: "$checkingAccounts._id",
        name: "$checkingAccounts.name",
        firstAccess: "$checkingAccounts.firstMovement.date",
        balance: {
          $add: [
            "$checkingAccounts.firstMovement.balance",
            "$checkingAccounts.report.incomes",
            { $multiply: ["$checkingAccounts.report.expenses", -1] },
          ],
        },
        incomes: "$checkingAccounts.report.incomes",
        expenses: "$checkingAccounts.report.expenses",
      },
    },
  };
  const regroupCheckingAccounts: PipelineStage = {
    $group: {
      _id: { companyId: "$_id", companyName: "$name" },
      accountReports: {
        $push: "$accountReport",
      },
    },
  };
  const calculateCompanyReport: PipelineStage = {
    $project: {
      _id: "$_id.companyId",
      name: "$_id.companyName",
      accountReports: "$accountReports",
      // Iterate over the account reports and sum the balance, incomes and expenses
      companyReport: {
        $reduce: {
          input: "$accountReports",
          initialValue: { companyBalance: 0, companyIncomes: 0, companyExpenses: 0 },
          in: {
            companyBalance: { $add: ["$$value.companyBalance", "$$this.balance"] },
            companyIncomes: { $add: ["$$value.companyIncomes", "$$this.incomes"] },
            companyExpenses: { $add: ["$$value.companyExpenses", "$$this.expenses"] },
          },
        },
      },
    },
  };
  const prettifyResult: PipelineStage = {
    $project: {
      name: "$name",
      companyBalance: "$companyReport.companyBalance",
      companyIncomes: "$companyReport.companyIncomes",
      companyExpenses: "$companyReport.companyExpenses",
      accountReports: "$accountReports",
    },
  };

  // Execute the aggregation and extract the first result
  // This works since we always get the results for one company
  const [result] = await this.aggregate<ICompanyAccountReport>([
    filterByCompany,
    unwindCheckingAccounts,
    // If we want to retrieve only the public accounts
    // we remove the private ones
    ...(onlyPublic ? [filterOnlyPublicAccounts] : []),
    calculateExpensesAndIncomes,
    getBalanceAndFirstAccess,
    regroupCheckingAccounts,
    calculateCompanyReport,
    prettifyResult,
  ]);

  return result;
};

export default model<Company, ICompanyModel>("Company", companySchema);
