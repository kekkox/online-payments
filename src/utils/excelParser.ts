import ExcelJS from "exceljs";
import { CreateCompanyDto } from "../types/dto/companies";

interface RowData {
  date: Date;
  balance: number;
  incomes: number;
  expenses: number;
}

// Function that parses the excel file and returns the data
export const parseExcel = async (fileBuffer: Buffer): Promise<CreateCompanyDto[]> => {
  const workbook = new ExcelJS.Workbook();

  // Parse the file
  const data = await workbook.xlsx.load(fileBuffer);

  const [ACMECorp, technologyARC]: CreateCompanyDto[] = [
    {
      name: "ACME Corporation",
      checkingAccounts: [],
    },
    {
      name: "Technology ARC",
      checkingAccounts: [],
    },
  ];

  let movements: RowData[] = [];

  // Get the sheets
  const firstSheet = data.getWorksheet(1);
  const secondSheet = data.getWorksheet(2);
  const thirdSheet = data.getWorksheet(3);

  // Get the first worksheet (The one that belongs to company 'ACME Corporation' and its private)
  firstSheet.eachRow((row) => {
    // Extract the data from the row
    const data = extractData(row);
    // If the data is not valid, skip the row
    if (!data) return;

    movements.push(data);
  });

  if (movements.length > 0) {
    ACMECorp.checkingAccounts.push({
      name: firstSheet.name,
      movements: [...movements],
      public: false,
      createdAt: new Date(),
    });
  }

  // Reset the movements
  movements = [];

  // Get the second worksheet (The one that belongs to company 'ACME Corporation' and its public)
  secondSheet.eachRow((row) => {
    // Extract the data from the row
    const data = extractData(row);
    // If the data is not valid, skip the row
    if (!data) return;

    movements.push(data);
  });

  if (movements.length > 0) {
    ACMECorp.checkingAccounts.push({
      name: secondSheet.name,
      movements: [...movements],
      public: true,
      createdAt: new Date(),
    });
  }

  // Reset the movements
  movements = [];

  // Get the third worksheet (The one that belongs to company 'Technology ARC' and its public)
  thirdSheet.eachRow((row) => {
    // Extract the data from the row
    const data = extractData(row, true);
    // If the data is not valid, skip the row
    if (!data) return;

    movements.push(data);
  });

  if (movements.length > 0) {
    technologyARC.checkingAccounts.push({
      name: thirdSheet.name,
      movements: [...movements],
      public: true,
      createdAt: new Date(),
    });
  }

  return [ACMECorp, technologyARC];
};

// Extract data from an excel row
const extractData = (row: ExcelJS.Row, log = false): RowData | null => {
  // Get the columns
  const firstColumn = row.getCell(1);
  const secondColumn = row.getCell(2);
  const thirdColumn = row.getCell(3);
  const fourthColumn = row.getCell(4);

  // Get the formula values from some cells
  // This is required since the library doesn't give 0 as result of the formula
  const secondColumnValue = secondColumn.formula ? secondColumn.result || "0" : secondColumn.value;
  const thirdColumnValue = thirdColumn.formula ? thirdColumn.result || "0" : thirdColumn.value;
  const fourthColumnValue = fourthColumn.formula ? fourthColumn.result || "0" : fourthColumn.value;

  // Parse the columns
  const dateValue = firstColumn.value?.toString();
  const balanceValue = secondColumnValue?.toString();
  const incomesValue = thirdColumnValue?.toString();
  const expensesValue = fourthColumnValue?.toString();

  // Check that all the fields are present
  if (!dateValue || !balanceValue || !incomesValue || !expensesValue) {
    return null;
  }

  // Get the date
  const date = new Date(dateValue);
  // Get the balance
  const balance = parseFloat(balanceValue);
  // Get the incomes
  const incomes = parseFloat(incomesValue);
  // Get the expenses
  const expenses = parseFloat(expensesValue);

  // Check if all the fields are valid
  if (isNaN(date.getTime()) || isNaN(balance) || isNaN(incomes) || isNaN(expenses)) {
    return null;
  }

  // Return the data
  return {
    date,
    balance: +balance.toFixed(2),
    incomes: +incomes.toFixed(2),
    expenses: Math.abs(+expenses.toFixed(2)),
  };
};
