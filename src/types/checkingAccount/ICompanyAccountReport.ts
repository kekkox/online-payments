interface ICheckingAccountReport {
  _id: string;
  name: string;
  firstAccess: Date;
  balance: number;
  incomes: number;
  expenses: number;
}

export interface ICompanyAccountReport {
  _id: string;
  name: string;
  companyBalance: number;
  companyIncomes: number;
  companyExpenses: number;
  accountReports: ICheckingAccountReport[];
}

export interface IMonthReport {
  _id: string;
  name: string;
  date: string;
  incomes: number;
  expenses: number;
  balance: number;
}

export type ICompanyMonthlyReport = IMonthReport & { accountReports: IMonthReport[] };

export interface ICompanyAccountReportOptions {
  onlyPublic?: boolean;
}
