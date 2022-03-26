import server from "./server";
import * as db from "./db";

const PORT = process.env.PORT || 3000;

// Startup the server
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Establish a connection to the database
db.connectToDB();
