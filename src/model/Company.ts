import { Schema, model, Types, PipelineStage } from "mongoose";
import {
  ICompanyAccountReport,
  ICompanyAccountReportByDateRangeOptions,
  ICompanyAccountReportOptions,
  ICompanyMonthlyReport,
  ICompanyReport,
} from "../types/checkingAccount";

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

  // Check if we got a result
  if (!result) {
    // Get the name of the company since is required on the result
    const company = await this.findById(companyId).select("name");

    // Return a default result
    return {
      _id: companyId.toString(),
      name: company?.name || "",
      companyBalance: 0,
      companyIncomes: 0,
      companyExpenses: 0,
      accountReports: [],
    };
  }

  return result;
};

companySchema.statics.getMonthlyReport = async function (
  this: ICompanyModel,
  companyId: Types.ObjectId,
  options: ICompanyAccountReportOptions
): Promise<ICompanyMonthlyReport[]> {
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
  const unwindMovements: PipelineStage = {
    $unwind: { path: "$checkingAccounts.movements", preserveNullAndEmptyArrays: true },
  };
  const addMonthField: PipelineStage = {
    $addFields: {
      "checkingAccounts.movements.month": {
        $dateToString: {
          date: "$checkingAccounts.movements.date",
          format: "%m/%Y",
        },
      },
    },
  };
  const groupByMonth: PipelineStage = {
    $group: {
      _id: {
        date: "$checkingAccounts.movements.month",
        accountId: "$checkingAccounts._id",
        accountName: "$checkingAccounts.name",
        companyId: "$_id",
        companyName: "$name",
      },
      incomes: { $sum: "$checkingAccounts.movements.incomes" },
      expenses: { $sum: "$checkingAccounts.movements.expenses" },
      movements: { $push: "$checkingAccounts.movements" },
    },
  };
  const getFirstMovement: PipelineStage = {
    $addFields: {
      firstMovement: { $first: "$movements" },
    },
  };
  const calculateBalance: PipelineStage = {
    $project: {
      date: "$_id.date",
      accountReport: {
        _id: "$_id.accountId",
        name: "$_id.accountName",
        incomes: "$incomes",
        expenses: "$expenses",
        balance: { $add: ["$firstMovement.balance", "$incomes", { $multiply: ["$expenses", -1] }] },
      },
    },
  };
  const groupByAccount: PipelineStage = {
    $group: {
      _id: { date: "$date", _id: "$_id.companyId", name: "$_id.companyName" },
      accountReports: { $push: "$accountReport" },
    },
  };
  const calculateCompanyReport: PipelineStage = {
    $project: {
      _id: "$_id._id",
      name: "$_id.name",
      date: "$_id.date",
      accountReports: "$accountReports",
      aggregatedResult: {
        $reduce: {
          input: "$accountReports",
          initialValue: { incomes: 0, expenses: 0, balance: 0 },
          in: {
            incomes: { $add: ["$$value.incomes", "$$this.incomes"] },
            expenses: { $add: ["$$value.expenses", "$$this.expenses"] },
            balance: { $add: ["$$value.balance", "$$this.balance"] },
          },
        },
      },
    },
  };
  const prettifyResult: PipelineStage = {
    $project: {
      _id: "$_id",
      name: "$name",
      date: "$date",
      incomes: "$aggregatedResult.incomes",
      expenses: "$aggregatedResult.expenses",
      balance: "$aggregatedResult.balance",
      accountReports: "$accountReports",
    },
  };

  const result = await this.aggregate<ICompanyMonthlyReport>([
    filterByCompany,
    unwindCheckingAccounts,
    // If we want to retrieve only the public accounts
    // we remove the private ones
    ...(onlyPublic ? [filterOnlyPublicAccounts] : []),
    unwindMovements,
    addMonthField,
    groupByMonth,
    getFirstMovement,
    calculateBalance,
    groupByAccount,
    calculateCompanyReport,
    prettifyResult,
  ]);

  return result;
};

companySchema.statics.getReportBetweenDates = async function (
  this: ICompanyModel,
  companyId: Types.ObjectId,
  options: ICompanyAccountReportByDateRangeOptions
): Promise<ICompanyReport> {
  // Destructure options
  const { startDate, endDate, onlyPublic } = options;

  // Aggregation steps
  const filterByCompany: PipelineStage = { $match: { _id: companyId } };
  const unwindCheckingAccounts: PipelineStage = {
    $unwind: { path: "$checkingAccounts", preserveNullAndEmptyArrays: true },
  };
  const filterOnlyPublicAccounts: PipelineStage = {
    $match: { "checkingAccounts.public": true },
  };
  const unwindMovements: PipelineStage = {
    $unwind: { path: "$checkingAccounts.movements", preserveNullAndEmptyArrays: true },
  };
  const filterByDate: PipelineStage = {
    $match: {
      $and: [
        { "checkingAccounts.movements.date": { $gte: startDate } },
        { "checkingAccounts.movements.date": { $lte: endDate } },
      ],
    },
  };
  const groupByCheckingAccount: PipelineStage = {
    $group: {
      _id: {
        accountId: "$checkingAccounts._id",
        accountName: "$checkingAccounts.name",
        companyId: "$_id",
        companyName: "$name",
      },
      incomes: { $sum: "$checkingAccounts.movements.incomes" },
      expenses: { $sum: "$checkingAccounts.movements.expenses" },
      movements: { $push: "$checkingAccounts.movements" },
    },
  };
  const getFirstMovement: PipelineStage = {
    $addFields: {
      firstMovement: { $first: "$movements" },
    },
  };
  const calculateBalance: PipelineStage = {
    $project: {
      incomes: "$incomes",
      expenses: "$expenses",
      balance: { $add: ["$firstMovement.balance", "$incomes", { $multiply: ["$expenses", -1] }] },
    },
  };
  const groupByCompany: PipelineStage = {
    $group: {
      _id: { companyId: "$_id.companyId", companyName: "$_id.companyName" },
      incomes: { $sum: "$incomes" },
      expenses: { $sum: "$expenses" },
      balance: { $sum: "$balance" },
    },
  };
  const prettifyResult: PipelineStage = {
    $project: {
      _id: "$_id.companyId",
      name: "$_id.companyName",
      incomes: "$incomes",
      expenses: "$expenses",
      balance: "$balance",
    },
  };

  const [result] = await this.aggregate<ICompanyReport>([
    filterByCompany,
    unwindCheckingAccounts,
    // If we want to retrieve only the public accounts
    // we remove the private ones
    ...(onlyPublic ? [filterOnlyPublicAccounts] : []),
    unwindMovements,
    filterByDate,
    groupByCheckingAccount,
    getFirstMovement,
    calculateBalance,
    groupByCompany,
    prettifyResult,
  ]);

  // Check if we got a result
  if (!result) {
    // Get the name of the company since is required on the result
    const company = await this.findById(companyId).select("name");

    // Return a default result
    return {
      _id: companyId.toString(),
      name: company?.name || "",
      balance: 0,
      incomes: 0,
      expenses: 0,
    };
  }

  return result;
};

export default model<Company, ICompanyModel>("Company", companySchema);
