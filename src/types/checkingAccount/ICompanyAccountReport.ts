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

export interface ICompanyAccountReportOptions {
  onlyPublic?: boolean;
}
