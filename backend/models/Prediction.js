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
    top3: Array,

    imageName: String,
    imageBase64: String, // Store image as base64 to show in history

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Prediction", predictionSchema);