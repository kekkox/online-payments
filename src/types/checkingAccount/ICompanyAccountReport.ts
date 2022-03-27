export interface ICompanyReport {
  _id: string;
  name: string;
  balance: number;
  incomes: number;
  expenses: number;
}

interface ICheckingAccountReport extends ICompanyReport {
  firstAccess: Date;
}

export interface ICompanyAccountReport {
  _id: string;
  name: string;
  companyBalance: number;
  companyIncomes: number;
  companyExpenses: number;
  accountReports: ICheckingAccountReport[];
}

export interface IMonthReport extends ICompanyReport {
  date: string;
}

export type ICompanyMonthlyReport = IMonthReport & { accountReports: IMonthReport[] };

export interface ICompanyAccountReportOptions {
  onlyPublic?: boolean;
}

interface CompanyAccountReportByDateRangeOptions {
  startDate: Date;
  endDate: Date;
}

export type ICompanyAccountReportByDateRangeOptions = ICompanyAccountReportOptions &
  CompanyAccountReportByDateRangeOptions;
