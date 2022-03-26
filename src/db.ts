import mongoose from "mongoose";

// Retrieve the connection info from the environment variables
const { DB_CONNECTION_STRING } = process.env;

// Validate the connection info
if (!DB_CONNECTION_STRING) {
  throw new Error("Missing database connection info");
}

// Build the connection string
const DATABASE_URI = `${DB_CONNECTION_STRING}?authSource=admin`;

// Handle connection error then disconnect all connections
mongoose.connection.on("error", (error) => {
  // Get the error message from the error object
  const { message } = error;

  // Check for errors that cannot be handled
  if (message.includes("Authentication failed")) {
    throw new Error(
      "Wrong credentials. Please check your username and password used to access the database."
    );
  }
  if (message.includes("URI must include hostname"))
    throw new Error("Wrong uri configuration. Please check the database connection info");

  // If the error can be handled, disconnect all connections and try to reconnect
  console.error("Error in MongoDb connection:", error);
  mongoose.disconnect();
});

// Handle mongoose disconnections. Then try to reconnect
mongoose.connection.on("disconnected", function () {
  // Don't reconnect on test environment
  if (process.env.NODE_ENV == "test") return;

  console.log(
    `[${new Date().toISOString()}] MongoDB disconnected! Trying to reconnect after 5 sec...`
  );
  // After 5 seconds try to reconnect to db
  setTimeout(connectToDB, 5000);
});

/**
 * @function connectToDB
 * @description Utility function that estabilish a connection to to the database
 */
export const connectToDB = async () => {
  const connection = await mongoose.connect(DATABASE_URI).catch(console.error);

  // Don't init db and don't logs on test environment
  if (process.env.NODE_ENV == "test") return connection;

  console.log(`[${new Date().toISOString()}] Database connection established`);

  return connection;
};
