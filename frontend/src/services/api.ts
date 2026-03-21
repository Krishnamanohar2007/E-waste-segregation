import axios from 'axios';

// Update with your actual backend URL or rely on proxy/vite setup
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const predictEWaste = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/predict', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const fetchPredictionHistory = async () => {
    const response = await api.get('/history');
    return response.data;
};

export const fetchAnalytics = async () => {
    const response = await api.get('/analytics');
    return response.data;
};

export const fetchConfusionInsights = async () => {
    const response = await api.get('/confusion');
    return response.data;
};

export default api;
