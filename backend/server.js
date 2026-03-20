const connectDB = require("./config/db");
connectDB();

const express = require("express");
const cors = require("cors");

const predictRoute = require("./routes/predictRoute");
const historyRoute = require("./routes/historyRoute");
const analyticsRoute = require("./routes/analyticsRoute");
const confusionRoute = require("./routes/confusionRoute");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", predictRoute);
app.use("/api", historyRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/confusion", confusionRoute);

app.get("/", (req, res) => {
    res.send("E-Waste Backend Running");
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log("🚀 Node backend running on port", PORT);
});