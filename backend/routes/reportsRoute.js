const express = require("express");
const router = express.Router();
const { getWeeklyReport } = require("../controllers/reportsController");

router.get("/weekly", getWeeklyReport);

module.exports = router;
