const express = require("express");
const path = require("path");
const pagesRouter = require("./routes/pages");
const dataRouter = require("./routes/data"); // Add this line

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Use the routers
app.use("/", pagesRouter);
app.use("/", dataRouter); // Add this line

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});