import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { fetchPredictionHistory } from '../services/api';
import './HistoryPage.css';



const HistoryPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await fetchPredictionHistory();
            const rawHistory = data?.history || [];
            const mappedHistory = rawHistory.map((h: any) => {
                const p = typeof h.prediction === 'object' ? h.prediction : {};
                const pName = typeof h.prediction === 'string' ? h.prediction : (p?.device || 'Unknown Device');
                const pConf = p?.confidence ? p.confidence * 100 : (h.prediction_type === 'strong' ? 95 : h.prediction_type === 'moderate' ? 65 : 45);

                return {
                    id: h._id,
                    device: pName,
                    type: h.prediction_type || 'Unknown Type',
                    confidence: pConf,
                    date: h.createdAt || new Date().toISOString(),
                    image: h.imageName || 'N/A'
                };
            });
            setHistory(mappedHistory);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item =>
        item.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString();
    };

    const getConfidenceBadgeColor = (conf: number) => {
        if (conf >= 80) return 'success';
        if (conf >= 50) return 'warning';
        return 'danger';
    };

    return (
        <div className="history-page animate-fade-in">
            <div className="page-header header-with-actions">
                <div>
                    <h1>Prediction History</h1>
                    <p className="text-secondary text-lg">Review past e-waste classifications and confidence scores.</p>
                </div>
                <button className="btn btn-outline" onClick={loadHistory}>
                    <RefreshCw size={18} className={loading ? "spin" : ""} /> Refresh
                </button>
            </div>

            <div className="glass-panel history-table-container">
                <div className="table-controls">
                    <div className="search-box">
                        <Search size={18} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Search by device type or material..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-outline filter-btn">
                        <Filter size={18} /> Filters
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner-large"></div>
                        <p>Loading history...</p>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="empty-state">
                        <AlertTriangle size={36} className="text-muted" />
                        <h3>No records found</h3>
                        <p className="text-secondary">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Device</th>
                                    <th>Material Type</th>
                                    <th>Confidence</th>
                                    <th>Date</th>
                                    <th>Image Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.map((item) => (
                                    <tr key={item.id} className="table-row-hover">
                                        <td className="font-medium text-main">{item.device}</td>
                                        <td className="text-secondary">{item.type}</td>
                                        <td>
                                            <span className={`badge ${getConfidenceBadgeColor(item.confidence)}`}>
                                                {item.confidence.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="text-muted text-sm">{formatDate(item.date)}</td>
                                        <td className="text-muted text-sm">{item.image}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div >
    );
};

export default HistoryPage;
