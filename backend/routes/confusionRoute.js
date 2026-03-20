const express = require("express");
const router = express.Router();

const confusionController = require("../controllers/confusionController");

router.get("/", confusionController.getConfusionTrend);

module.exports = router;