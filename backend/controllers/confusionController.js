const Prediction = require("../models/Prediction");

exports.getConfusionTrend = async (req, res) => {

    try {

        const allCases = await Prediction.find({});

        const confusionMap = {};

        allCases.forEach(p => {
            // We need at least the top 2 predictions to compare
            if (!p.top3 || p.top3.length < 2) return;

            const top1 = p.top3[0];
            const top2 = p.top3[1];

            const gap = top1.confidence - top2.confidence;
            
            // If the confidence gap is tight (e.g. less than 0.2), the model was confused
            if (gap < 0.2) {
                // Ensure consistent pair key regardless of order
                const devices = [top1.device, top2.device].sort();
                const key = devices[0] + " ↔ " + devices[1];
                
                confusionMap[key] = (confusionMap[key] || 0) + 1;
            }
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