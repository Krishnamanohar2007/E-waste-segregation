const Prediction = require("../models/Prediction");

exports.getWeeklyReport = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const predictions = await Prediction.find({
            createdAt: { $gte: sevenDaysAgo }
        }).lean();

        const total_scans = predictions.length;

        // Counts for ewaste vs non-ewaste
        const non_ewaste_types = ["non_ewaste", "unknown_ewaste"];
        const ewaste_count = predictions.filter(
            (p) => !non_ewaste_types.includes(p.prediction_type)
        ).length;
        const non_ewaste_count = predictions.filter(
            (p) => non_ewaste_types.includes(p.prediction_type)
        ).length;

        // Device distribution (only for valid ewaste predictions)
        const device_distribution = {};
        for (const p of predictions) {
            const device = p.prediction?.device;
            if (device && device !== "Unknown" && !non_ewaste_types.includes(p.prediction_type)) {
                device_distribution[device] = (device_distribution[device] || 0) + 1;
            }
        }

        // Most frequent device
        const most_frequent_device = Object.keys(device_distribution).length > 0
            ? Object.entries(device_distribution).sort((a, b) => b[1] - a[1])[0][0]
            : "N/A";

        // Prediction type distribution
        const prediction_distribution = {
            strong: 0,
            moderate: 0,
            weak: 0,
            unknown_ewaste: 0,
            non_ewaste: 0
        };
        for (const p of predictions) {
            const pt = p.prediction_type;
            if (pt in prediction_distribution) {
                prediction_distribution[pt]++;
            }
        }

        // Daily scan counts (last 7 days, grouped by date)
        const daily_scans = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
            daily_scans[key] = 0;
        }
        for (const p of predictions) {
            const key = new Date(p.createdAt).toISOString().slice(0, 10);
            if (key in daily_scans) {
                daily_scans[key]++;
            }
        }

        return res.json({
            success: true,
            total_scans,
            ewaste_count,
            non_ewaste_count,
            most_frequent_device,
            device_distribution,
            prediction_distribution,
            daily_scans
        });

    } catch (err) {
        console.error("Weekly report error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to generate weekly report"
        });
    }
};
