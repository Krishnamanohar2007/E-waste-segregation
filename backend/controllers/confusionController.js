const Prediction = require("../models/Prediction");

exports.getConfusionTrend = async (req, res) => {

    try {

        const weakCases = await Prediction.find({
            prediction_type: "weak"
        });

        const confusionMap = {};

        weakCases.forEach(p => {

            if (!p.alternatives || p.alternatives.length < 2) return;

            const main = p.alternatives[0].device;
            const alt = p.alternatives[1].device;

            const key = main + " ↔ " + alt;

            confusionMap[key] = (confusionMap[key] || 0) + 1;

        });

        return res.json({
            success: true,
            confusion_trends: confusionMap
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Confusion analytics failed"
        });

    }

};