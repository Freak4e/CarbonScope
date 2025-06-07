require('dotenv').config({ path: './config.env' }); // Load config.env explicitly
const express = require("express");
const path = require("path");
const pagesRouter = require("./routes/pages");
const dataRouter = require("./routes/data"); 

const app = express();

// Serve static files (unchanged)
app.use(express.static(path.join(__dirname, "../public")));

// Routes (unchanged)
app.use("/", pagesRouter);
app.use("/", dataRouter); 

// Start server (Render-compatible)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});