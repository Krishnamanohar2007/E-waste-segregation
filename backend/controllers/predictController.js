const Prediction = require("../models/Prediction");
const mlService = require("../services/mlService");

exports.predictDevice = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded"
            });
        }

        const result = await mlService.getPrediction(req.file);

        // ⭐ SAVE HISTORY
        try {
            await Prediction.create({
                prediction_type: result.prediction_type,
                prediction: result.prediction,
                alternatives: result.alternatives || [],
                imageName: req.file.originalname
            });
        } catch (dbErr) {
            console.log("DB Save Error:", dbErr.message);
        }

        return res.json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Prediction failed"
        });
    }
};