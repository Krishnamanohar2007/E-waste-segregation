const express = require("express");
const router = express.Router();
const multer = require("multer");

const controller = require("../controllers/predictController");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/predict", upload.single("image"), controller.predictDevice);

module.exports = router;