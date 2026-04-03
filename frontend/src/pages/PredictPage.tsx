import React, { useState, useRef } from 'react';
import { UploadCloud, Search } from 'lucide-react';
import { predictEWaste } from '../services/api';
import PredictionCard from '../components/PredictionCard';
import Toast, { useToast } from '../components/Toast';
import './PredictPage.css';

const PredictPage: React.FC = () => {
    const { toasts, addToast, dismissToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isLoading) setIsHovering(true);
    };

    const handleDragLeave = () => {
        setIsHovering(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
        if (isLoading) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            handleFileSelection(selectedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isLoading) return;

        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const handleFileSelection = (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            addToast('Please select a valid image file (JPG, PNG, JPEG).', 'error');
            return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setResult(null);
    };

    const onAnalyze = async () => {
        if (!file) return;

        setResult(null);   // clear old result
        setIsLoading(true);

        try {
            const data = await predictEWaste(file);
            const p = data.prediction || {};

            const pConf = p.confidence !== undefined ? p.confidence : data.confidence;

            let confidence = pConf
                ? (pConf <= 1 ? pConf * 100 : pConf)
                : (data.prediction_type === 'strong'
                    ? 95
                    : data.prediction_type === 'moderate'
                        ? 65
                        : 45);

            setResult({
                device: p.device || data.device || 'Unknown Device',
                confidence: confidence,
                prediction_type: data.prediction_type || 'weak',

                hazard: {
                    level: p.hazard?.level || 'Medium',
                    reason: p.hazard?.reason || ''
                },

                metals: {
                    dominant: p.metals?.dominant || 'Mixed',
                    composition: p.metals?.composition
                        ? Object.entries(p.metals.composition).map(([name, pct]) => ({
                            name,
                            percentage: parseFloat(String(pct)) || 0
                        }))
                        : [{ name: 'Mixed Materials', percentage: 100 }]
                },

                recyclability: {
                    status: p.recyclability?.status || 'Moderate',
                    method: p.recyclability?.method || 'Standard e-waste processing.'
                },

                environmental_impact:
                    p.environmental_impact ||
                    'Improper disposal may lead to soil contamination with toxic metals.',

                reuse:
                    p.reuse ||
                    'Extractable components may be reused if functional.',

                user_guidance:
                    p.user_guidance ||
                    'Do NOT throw in regular trash. Take to a certified e-waste recycling center.',

                alternatives: p.alternatives || data.alternatives || []
            });
            addToast('Analysis complete! Review the prediction details below.', 'success');

        } catch (err: any) {
            addToast('Analysis failed. Please check your connection and try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="predict-page animate-fade-in">
            <Toast toasts={toasts} onDismiss={dismissToast} />

            <div className="page-header">
                <h1>Analyze E-Waste</h1>
                <p className="text-secondary text-lg">
                    Upload an image of an electronic device to determine its environmental impact,
                    composition, and segregation guidelines.
                </p>
            </div>

            <div className="layout-grid">

                {/* Upload Section */}
                <div className="glass-panel upload-card">
                    <div
                        className={`drop-zone ${isHovering ? 'hover' : ''} ${isLoading ? 'disabled' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isLoading && fileInputRef.current?.click()}
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
                                <div className="file-formats">
                                    Supports: JPG, PNG, WEBP (Max 5MB)
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="action-row">
                        <button
                            className="btn btn-outline"
                            onClick={() => {
                                setFile(null);
                                setPreview(null);
                                setResult(null);
                            }}
                            disabled={isLoading}
                        >
                            Reset
                        </button>

                        <button
                            className={`btn btn-primary analyze-btn ${isLoading ? 'loading' : ''}`}
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
                    <PredictionCard data={result} />
                )}

            </div>
        </div>
    );


};

export default PredictPage;
