import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, ShieldAlert, Cpu, Recycle, ArrowRight, Search } from 'lucide-react';
import { predictEWaste } from '../services/api';
import './PredictPage.css';

const PredictPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(true);
    };

    const handleDragLeave = () => {
        setIsHovering(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            handleFileSelection(selectedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const handleFileSelection = (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please select a valid image file within formats (jpg, png, jpeg).');
            return;
        }
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setError(null);
        setResult(null);
    };

    const onAnalyze = async () => {
        if (!file) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await predictEWaste(file);
            const p = data.prediction || {};
            setResult({
                device: p.device || 'Unknown Device',
                confidence: p.confidence ? p.confidence * 100 : (data.prediction_type === 'strong' ? 95 : data.prediction_type === 'moderate' ? 65 : 45),
                hazardLevel: p.hazard?.level || 'Medium',
                impact: p.environmental_impact || 'Improper disposal may lead to soil contamination with toxic metals.',
                guidance: p.user_guidance || 'Do NOT throw in regular trash. Take to a certified e-waste recycling center.',
                dominantMetal: p.metals?.dominant || 'Mixed',
                composition: p.metals?.composition
                    ? Object.entries(p.metals.composition).map(([name, pct]) => ({ name, percentage: parseFloat(String(pct)) || 0 }))
                    : [{ name: 'Mixed Materials', percentage: 100 }],
                recyclingStatus: p.recyclability?.status || 'Moderate',
                recyclingMethod: p.recyclability?.method || 'Standard e-waste processing.',
                reuse: p.reuse || 'Extractable components may be reused if functional.',
                alternatives: data.alternatives || []
            });
        } catch (err: any) {
            setError('Analysis failed. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const getConfidenceBadgeColor = (conf: number) => {
        if (conf >= 80) return 'success';
        if (conf >= 50) return 'warning';
        return 'danger';
    };

    const getHazardBadgeColor = (level: string) => {
        if (level === 'High') return 'danger';
        if (level === 'Medium') return 'warning';
        return 'success';
    };

    return (
        <div className="predict-page animate-fade-in">

            <div className="page-header">
                <h1>Analyze E-Waste</h1>
                <p className="text-secondary text-lg">Upload an image of an electronic device to determine its environmental impact, composition, and segregation guidelines.</p>
            </div>

            {error && (
                <div className="error-banner">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="layout-grid">

                {/* Upload Section */}
                <div className="glass-panel upload-card">
                    <div
                        className={`drop-zone ${isHovering ? 'hover' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                        {preview ? (
                            <div className="preview-container">
                                <img src={preview} alt="Upload preview" className="image-preview" />
                                <div className="preview-overlay">
                                    <span>Click to change image</span>
                                </div>
                            </div>
                        ) : (
                            <div className="upload-placeholder">
                                <div className="upload-icon-wrapper">
                                    <UploadCloud size={48} color="var(--color-primary)" />
                                </div>
                                <h3>Drag & Drop Image Here</h3>
                                <p className="text-muted">or click to browse from your computer</p>
                                <div className="file-formats">Supports: JPG, PNG, WEBP (Max 5MB)</div>
                            </div>
                        )}
                    </div>

                    <div className="action-row">
                        <button className="btn btn-outline" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                            Reset
                        </button>
                        <button
                            className="btn btn-primary analyze-btn"
                            onClick={onAnalyze}
                            disabled={!file || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div> Analyzing...
                                </>
                            ) : (
                                <>
                                    <Search size={20} /> Analyze E-Waste
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {result && (
                    <div className="glass-panel result-card animate-fade-in">
                        <div className="result-header">
                            <h2>{result.device}</h2>
                            <div className="badges">
                                <span className={`badge ${getConfidenceBadgeColor(result.confidence)}`}>
                                    Confidence: {result.confidence}%
                                </span>
                                <span className={`badge ${getHazardBadgeColor(result.hazardLevel)}`}>
                                    {result.hazardLevel} Hazard
                                </span>
                            </div>
                        </div>

                        <div className="confidence-bar-container">
                            <div
                                className={`confidence-bar ${getConfidenceBadgeColor(result.confidence)}`}
                                style={{ width: `${result.confidence}%` }}
                            ></div>
                        </div >

                        <div className="result-grid">

                            <div className="result-block guidance-block">
                                <div className="block-icon success"><CheckCircle size={20} /></div>
                                <div>
                                    <h4>User Disposal Guidance</h4>
                                    <p>{result.guidance}</p>
                                </div>
                            </div>

                            <div className="result-block impact-block">
                                <div className="block-icon warning"><ShieldAlert size={20} /></div>
                                <div>
                                    <h4>Environmental Impact</h4>
                                    <p>{result.impact}</p>
                                </div>
                            </div>

                        </div>

                        <div className="details-grid">

                            <div className="detail-card glass-card">
                                <div className="detail-card-header">
                                    <Cpu size={18} />
                                    <h4>Composition Map</h4>
                                </div>
                                <div className="dominant-metal highlight-box">
                                    Dominant: <strong>{result.dominantMetal}</strong>
                                </div>
                                <table className="composition-table">
                                    <tbody>
                                        {result.composition.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td>{item.name}</td>
                                                <td className="text-right font-medium">{item.percentage}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="detail-card glass-card">
                                <div className="detail-card-header">
                                    <Recycle size={18} />
                                    <h4>Recycling & Reuse</h4>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Status</span>
                                    <span className="info-value font-medium text-primary">{result.recyclingStatus}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Method</span>
                                    <span className="info-value">{result.recyclingMethod}</span>
                                </div>
                                <div className="reuse-box mt-3">
                                    <span className="info-label">Reuse Possibility</span>
                                    <p className="text-sm mt-1">{result.reuse}</p>
                                </div>
                            </div>

                        </div>

                        {
                            result.confidence < 90 && (
                                <div className="alternatives-panel">
                                    <h4><ArrowRight size={16} /> Confidence Alternatives</h4>
                                    <div className="chips-row">
                                        {result.alternatives.map((alt: any, idx: number) => (
                                            <div key={idx} className="alt-chip">
                                                {alt.device} <span>{alt.confidence}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        }

                    </div >
                )}

            </div >
        </div >
    );
};

export default PredictPage;
