const axios = require("axios");
const FormData = require("form-data");

exports.getPrediction = async (file) => {

    const form = new FormData();
    form.append("file", file.buffer, file.originalname);

    const response = await axios.post(
        process.env.ML_SERVICE_URL || "http://127.0.0.1:8000/predict",
        form,
        { headers: form.getHeaders() }
    );

    return response.data;
};