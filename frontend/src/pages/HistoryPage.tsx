import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Inbox } from 'lucide-react';
import { fetchPredictionHistory } from '../services/api';
import Toast, { useToast } from '../components/Toast';
import './HistoryPage.css';

const HistoryPage: React.FC = () => {
    const { toasts, addToast, dismissToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('');

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, selectedType, history]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await fetchPredictionHistory();
            const rawHistory = data?.history || [];

            const mappedHistory = rawHistory.map((h: any) => {
                const p = typeof h.prediction === 'object' ? h.prediction : {};

                return {
                    id: h._id,
                    device: p?.device || 'Unknown Device',
                    type: h.prediction_type || 'unknown',
                    confidence: p?.confidence ? p.confidence * 100 : 0,
                    date: h.createdAt || new Date().toISOString(),
                    image: h.imageName || 'N/A'
                };
            });

            setHistory(mappedHistory);
            setSearchTerm('');
            setSelectedType('');

        } catch (err) {
            console.error(err);
            addToast('Failed to load history. Please refresh.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let temp = [...history];
        if (searchTerm) {
            temp = temp.filter(item =>
                item.device.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (selectedType) {
            temp = temp.filter(item => item.type === selectedType);
        }
        setFilteredHistory(temp);
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString();
    };

    const getBadgeClass = (type: string) => {
        if (type === 'strong') return 'badge success';
        if (type === 'moderate') return 'badge warning';
        return 'badge danger';
    };

    return (
        <div className="history-page animate-fade-in">
            <Toast toasts={toasts} onDismiss={dismissToast} />

            <div className="page-header header-with-actions">
                <div>
                    <h1>Prediction History</h1>
                    <p className="text-secondary text-lg">
                        Review past e-waste classifications and confidence scores.
                    </p>
                </div>
                <button className="btn btn-outline" onClick={loadHistory}>
                    <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            <div className="history-cards-container">

                <div className="table-controls">
                    <div className="search-box">
                        <Search size={18} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Search device..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="filter-btn"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="strong">Strong</option>
                        <option value="moderate">Moderate</option>
                        <option value="weak">Weak</option>
                    </select>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner-large"></div>
                        <p className="text-secondary">Loading history...</p>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon-wrap">
                            <Inbox size={40} />
                        </div>
                        <h3>No records found</h3>
                        <p className="text-secondary">
                            {searchTerm || selectedType
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Upload your first e-waste image to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="history-cards-grid">
                        {filteredHistory.map((item, idx) => (
                            <div
                                key={item.id}
                                className="history-card glass-card anim-row"
                                style={{ animationDelay: `${idx * 60}ms` }}
                            >
                                <div className="history-card-image-bg"></div>
                                <div className="history-card-header">
                                    <div className="device-info">
                                        <div className="device-icon-wrap">
                                            <Inbox size={20} />
                                        </div>
                                        <div>
                                            <h3>{item.device}</h3>
                                            <span className="card-meta">{formatDate(item.date)}</span>
                                        </div>
                                    </div>
                                    <span className={getBadgeClass(item.type)}>
                                        {item.type}
                                    </span>
                                </div>
                                <div className="history-card-body">
                                    <div className="history-stat-row">
                                        <span className="history-stat-label">Confidence Score</span>
                                        <strong className={`history-stat-value text-${getBadgeClass(item.type).split(' ')[1]}`}>
                                            {item.confidence.toFixed(1)}%
                                        </strong>
                                    </div>
                                    <div className="history-stat-row">
                                        <span className="history-stat-label">Image File</span>
                                        <span className="history-stat-value text-muted">{item.image}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default HistoryPage;

