import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Network, Lightbulb } from 'lucide-react';
import { fetchConfusionInsights } from '../services/api';
import './ConfusionInsightsPage.css';

const ConfusionInsightsPage: React.FC = () => {
    const [confusionData, setConfusionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchConfusionInsights();
            const trendsObj = data?.confusion_trends || {};
            const mappedArray = Object.entries(trendsObj).map(([pair, count]) => ({
                pair,
                count
            }));
            setConfusionData(mappedArray);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="confusion-page animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ width: 40, height: 40, border: '4px solid rgba(16,185,129,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    const MOCK_CONFUSION_DATA = confusionData;

    return (
        <div className="confusion-page animate-fade-in">
            <div className="page-header">
                <h1>Model Confusion Insights</h1>
                <p className="text-secondary text-lg">Analysis of frequently misclassified e-waste pairs to guide dataset improvements.</p>
            </div>

            <div className="insights-layout">
                <div className="glass-panel chart-section">
                    <h3 className="section-title">Most Confused Device Pairs</h3>
                    <p className="text-muted text-sm mb-6">Bar chart representing the number of times the model predicted the wrong device within a known pair.</p>

                    <div className="bar-chart-container">
                        <ResponsiveContainer width="100%" height={360}>
                            <BarChart data={MOCK_CONFUSION_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="pair"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    angle={-35}
                                    textAnchor="end"
                                />
                                <YAxis
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                />
                                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="insights-sidebar">
                    <div className="glass-card insight-card priority-high">
                        <div className="insight-icon"><Network size={24} /></div>
                        <div className="insight-content">
                            <h4>Primary Confusion Vector</h4>
                            <p>The model struggles significantly to differentiate between <strong>Tablets</strong> and <strong>Smartphones</strong> due to similar rectangular form factors and screen-to-body ratios.</p>
                        </div>
                    </div>

                    <div className="glass-card insight-card direction-card">
                        <div className="insight-icon"><Lightbulb size={24} /></div>
                        <div className="insight-content">
                            <h4>Dataset Improvement Direction</h4>
                            <p>1. Inject images showing scale (e.g., objects next to human hands).<br />2. Add annotations for physical buttons and camera modules.<br />3. Augment data with multi-angle shots exposing device thickness.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfusionInsightsPage;
