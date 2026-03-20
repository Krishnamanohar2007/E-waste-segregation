const Prediction = require("../models/Prediction");

exports.getAnalytics = async (req, res) => {

    try {

        const total = await Prediction.countDocuments();

        const weak = await Prediction.countDocuments({
            prediction_type: "weak"
        });

        const moderate = await Prediction.countDocuments({
            prediction_type: "moderate"
        });

        const strong = await Prediction.countDocuments({
            prediction_type: "strong"
        });

        const weakRate = total === 0 ? 0 : (weak / total) * 100;

        return res.json({
            success: true,
            total_predictions: total,
            weak_predictions: weak,
            moderate_predictions: moderate,
            strong_predictions: strong,
            weak_prediction_rate: weakRate.toFixed(2) + " %",
            model_reliability_score: (100 - weakRate).toFixed(2)
        });

    } catch (err) {

        console.log(err);
        res.status(500).json({
            success: false,
            message: "Analytics failed"
        });

    }

};