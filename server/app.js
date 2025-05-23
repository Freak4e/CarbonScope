const express = require("express");
const path = require("path");
const pagesRouter = require("./routes/pages");

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Use the pages router
app.use("/", pagesRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});