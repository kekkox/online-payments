import fs from "fs";
import fsAsync from "fs/promises";
import path from "path";

import { connectToDB } from "../../db";
import { parseExcel } from "../excelParser";
import { Company, User } from "../../model";
import { CreateCompanyDto } from "../../types/dto/companies";

// Init db file path
const FILE_PATH = path.join(__dirname, "../../../db.xlsx");

const initializeDB = async () => {
  console.log(`[${new Date().toISOString()}] Initializing database...`);

  const dbConnection = await connectToDB();
  if (!dbConnection) {
    throw new Error("[ERROR] Could not connect to database");
  }

  // Check if the file exists
  if (!fs.existsSync(FILE_PATH)) {
    throw new Error(
      `[${new Date().toISOString()}] File ${FILE_PATH} not found. Database not initialized.`
    );
  }

  // Delete all the data from the database
  await Company.deleteMany({});
  await User.deleteMany({});

  // Create a default admin
  const admin = new User({
    email: "francesco@onlinepayments.com",
    password: "my-secure-password",
    role: "admin",
  });

  // Save the admin
  await admin.save();

  // Get the file buffer
  const fileBuffer = await fsAsync.readFile(FILE_PATH);

  // Parse the file
  const companies: CreateCompanyDto[] = await parseExcel(fileBuffer);

  // Save the companies
  await Company.insertMany(companies);

  console.log(`[${new Date().toISOString()}] Database initialized`);

  await dbConnection.connection.close();

  process.exit(0);
};

initializeDB();
