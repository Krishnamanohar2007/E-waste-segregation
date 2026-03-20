const Prediction = require("../models/Prediction");

exports.getHistory = async (req, res) => {
    try {
        const data = await Prediction
            .find()
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            count: data.length,
            history: data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch history"
        });
    }
};