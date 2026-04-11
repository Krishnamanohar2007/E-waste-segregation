import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, RefreshCw, Inbox, X, Info, Image as ImageIcon, AlertTriangle, Recycle } from 'lucide-react';
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

    // Modal state
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, selectedType, history]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (selectedItem) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [selectedItem]);

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
                    image: h.imageName || 'N/A',
                    imageBase64: h.imageBase64 || null,
                    hazard: p?.hazard || {},
                    metals: p?.metals || {},
                    recyclability: p?.recyclability || {},
                    environmentalImpact: p?.environmental_impact || 'No data',
                    reuse: p?.reuse || 'No data',
                    userGuidance: p?.user_guidance || 'No data',
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

    const handleCardClick = (item: any) => {
        setSelectedItem(item);
    };

    const closeModal = () => {
        setSelectedItem(null);
    };

    return (
        <div className="history-page animate-fade-in">
            <Toast toasts={toasts} onDismiss={dismissToast} />

            <div className="page-header header-with-actions">
                <div>
                    <h1>Prediction History</h1>
                    <p className="text-secondary text-lg">
                        Review past e-waste classifications and confidence scores. Click on an item for precise details.
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
                                onClick={() => handleCardClick(item)}
                            >
                                <div className="history-card-image-bg"></div>
                                <div className="history-card-header">
                                    <div className="device-info">
                                        <div className="device-icon-wrap">
                                            {item.imageBase64 ? (
                                                 <img src={`data:image/jpeg;base64,${item.imageBase64}`} alt="thumb" className="mini-thumb" />
                                            ) : (
                                                 <Inbox size={20} />
                                            )}
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
                                        <span className="history-stat-value text-muted truncate-text">{item.image}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* History Details Modal via Portal */}
            {selectedItem && createPortal(
                <div className="modal-overlay animate-fade-in" onClick={closeModal}>
                    <div className="modal-content glass-panel bounce-in" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={closeModal}>
                            <X size={24} />
                        </button>
                        
                        <div className="modal-header">
                            <div>
                                <h2>{selectedItem.device}</h2>
                                <span className={getBadgeClass(selectedItem.type)}>{selectedItem.type} Confidence ({selectedItem.confidence.toFixed(1)}%)</span>
                            </div>
                        </div>
                        
                        <div className="modal-body-scrollable new-clumsy-fix">
                            
                            <div className="modal-top-section">
                                <div className="modal-image-container">
                                    {selectedItem.imageBase64 ? (
                                        <img 
                                            src={`data:image/jpeg;base64,${selectedItem.imageBase64}`} 
                                            alt={selectedItem.device} 
                                            className="modal-preview-img"
                                        />
                                    ) : (
                                        <div className="no-image-placeholder">
                                            <ImageIcon size={48} className="text-muted mb-2" />
                                            <p className="text-secondary">Image not available</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="modal-quick-stats">
                                    <div className="stat-box">
                                        <span className="stat-label">Date Captured</span>
                                        <strong className="stat-value">{formatDate(selectedItem.date)}</strong>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Hazard Level</span>
                                        <strong className={`stat-value hazard-${selectedItem.hazard?.level?.toLowerCase() || 'unknown'}`}>
                                            {selectedItem.hazard?.level || 'N/A'}
                                        </strong>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Recyclability</span>
                                        <strong className="stat-value">{selectedItem.recyclability?.status || 'N/A'}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-details-grid sleek-grid">
                                
                                <div className="detail-section sleek">
                                    <h4><Info size={18}/> About & Impact</h4>
                                    <div className="detail-row vertical">
                                        <span>Environmental Impact</span>
                                        <p>{selectedItem.environmentalImpact}</p>
                                    </div>
                                    <div className="detail-row vertical mt-2">
                                        <span>User Guidance</span>
                                        <p className="text-highlight">{selectedItem.userGuidance}</p>
                                    </div>
                                </div>

                                <div className="detail-section sleek">
                                    <h4><AlertTriangle size={18}/> Hazards & Metals</h4>
                                    <div className="detail-row vertical">
                                        <span>Why is this hazardous?</span>
                                        <p>{selectedItem.hazard?.reason || 'No specific hazard identified.'}</p>
                                    </div>
                                    
                                    <div className="detail-row vertical mt-2">
                                        <span>Material Composition ({selectedItem.metals?.dominant || 'N/A'})</span>
                                        {selectedItem.metals?.composition && (
                                            <div className="composition-bars mt-2">
                                                {Object.entries(selectedItem.metals.composition).map(([key, val]: any) => (
                                                    <div key={key} className="comp-item">
                                                        <div className="comp-label"><span>{key}</span><span>{val}%</span></div>
                                                        <div className="comp-bar-bg">
                                                            <div className="comp-bar-fill" style={{width: `${val}%`}}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-section sleek full-width">
                                    <h4><Recycle size={18}/> Recycling Methodology</h4>
                                    <div className="detail-row vertical">
                                        <span>Process</span>
                                        <p>{selectedItem.recyclability?.method || 'Method not specified'}</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default HistoryPage;

