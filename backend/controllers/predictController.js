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
        console.log("ML RESPONSE:", result);

        // ⭐ SAVE HISTORY
        try {
            await Prediction.create({
                prediction_type: result.prediction_type,
                prediction: result.prediction,
                alternatives: result.alternatives || [],
                top3: result.top3 || [],
                imageName: req.file.originalname,
                imageBase64: req.file.buffer.toString('base64')
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