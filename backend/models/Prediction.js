const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({

    prediction_type: String,

    prediction: {
        device: String,
        confidence: Number,

        hazard: {
            level: String,
            reason: String
        },

        metals: {
            dominant: String,
            composition: Object
        },

        recyclability: {
            status: String,
            method: String
        },

        environmental_impact: String,
        reuse: String,
        user_guidance: String
    },

    alternatives: Array,

    imageName: String,

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Prediction", predictionSchema);