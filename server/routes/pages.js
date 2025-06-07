const express = require("express");
const path = require("path");
const router = express.Router();

// Define routes for serving HTML files
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../views/dashboard.html"));
});

router.get("/future", (req, res) => {
  res.sendFile(path.join(__dirname, "../../views/future.html"));
});

router.get("/slovenia", (req, res) => {
  res.sendFile(path.join(__dirname, "../../views/slovenia.html"));
});
router.get("/data", (req, res) => {
  res.sendFile(path.join(__dirname, "../../data/co2-data.csv"));
});

module.exports = router;