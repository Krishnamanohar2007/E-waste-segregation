import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Activity, CheckCircle, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { fetchAnalytics } from '../services/api';
import './AnalyticsPage.css';

// Animated counter hook — counts from 0 to target with eased animation
const useCountUp = (target: number, duration = 1200, start = false) => {
    const [value, setValue] = useState(0);
    const frame = useRef<number | null>(null);

    const animate = useCallback(() => {
        const startTime = performance.now();
        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setValue(parseFloat((target * ease).toFixed(1)));
            if (progress < 1) frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
    }, [target, duration]);

    useEffect(() => {
        if (!start) return;
        animate();
        return () => { if (frame.current) cancelAnimationFrame(frame.current); };
    }, [start, animate]);

    return value;
};

// Separated into StatCards to allow useCountUp hooks per-render
const StatCards: React.FC<{ targets: any; distribution: any[]; animateStats: boolean }> = ({
    targets, distribution, animateStats
}) => {
    const accuracy = useCountUp(targets.accuracy, 1200, animateStats);
    const total    = useCountUp(targets.total, 1200, animateStats);
    const weakRate = useCountUp(targets.weakRate, 1200, animateStats);

    return (
        <div className="analytics-page animate-fade-in">
            <div className="page-header">
                <h1>Model Analytics</h1>
                <p className="text-secondary text-lg">
                    Performance insights and reliability metrics for the ML prediction engine.
                </p>
            </div>

            <div className="metrics-grid">
                <div className="glass-card stat-card stat-card-anim" style={{ animationDelay: '0ms' }}>
                    <div className="stat-header">
                        <span className="stat-title">Overall Accuracy</span>
                        <div className="stat-icon success"><Target size={20} /></div>
                    </div>
                    <div className="stat-value">{accuracy.toFixed(1)}%</div>
                    <div className="stat-trend text-success"><TrendingUp size={14} /> +2.4% this week</div>
                </div>

                <div className="glass-card stat-card stat-card-anim" style={{ animationDelay: '80ms' }}>
                    <div className="stat-header">
                        <span className="stat-title">Total Predictions</span>
                        <div className="stat-icon primary"><Activity size={20} /></div>
                    </div>
                    <div className="stat-value">{Math.round(total).toLocaleString()}</div>
                    <div className="stat-trend text-secondary">Across all categories</div>
                </div>

                <div className="glass-card stat-card stat-card-anim" style={{ animationDelay: '160ms' }}>
                    <div className="stat-header">
                        <span className="stat-title">Weak Prediction Rate</span>
                        <div className="stat-icon danger"><AlertTriangle size={20} /></div>
                    </div>
                    <div className="stat-value">{weakRate.toFixed(1)}%</div>
                    <div className="progress-container">
                        <div
                            className="progress-bar bg-danger"
                            style={{
                                width: `${weakRate}%`,
                                transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        ></div>
                    </div>
                    <div className="stat-desc mt-1">Predictions below 50% confidence</div>
                </div>

                <div className="glass-card stat-card stat-card-anim" style={{ animationDelay: '240ms' }}>
                    <div className="stat-header">
                        <span className="stat-title">System Uptime</span>
                        <div className="stat-icon success"><CheckCircle size={20} /></div>
                    </div>
                    <div className="stat-value">99.9%</div>
                    <div className="stat-trend text-success">API is operational</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="glass-panel chart-card">
                    <h3>Prediction Confidence Distribution</h3>
                    <p className="text-muted text-sm mb-4">Breakdown of model confidence across all queries</p>
                    <div className="pie-chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    isAnimationActive={true}
                                    animationBegin={300}
                                    animationDuration={1200}
                                >
                                    {distribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel chart-card">
                    <h3>Reliability Score Card</h3>
                    <div className="score-card-content">
                        <div className="large-score">A-</div>
                        <p className="score-desc">
                            The model is performing at an optimal level for most common household e-waste
                            categories. Primary area for improvement is distinguishing between similarly
                            shaped mobile devices.
                        </p>
                        <div className="action-items mt-3">
                            <h4 className="text-sm font-medium mb-2 uppercase text-muted">Recommended Actions</h4>
                            <ul className="action-list">
                                <li>Retrain model with more oblique-angle Tablet dataset.</li>
                                <li>Add synthetic noise to Lithium battery images for robustness.</li>
                                <li>Update classification threshold from 50% to 55%.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnalyticsPage: React.FC = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [animateStats, setAnimateStats] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchAnalytics();
            setAnalytics(data);
            // small delay so card entry animation finishes before count-up starts
            setTimeout(() => setAnimateStats(true), 350);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="analytics-page animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ width: 40, height: 40, border: '4px solid rgba(16,185,129,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    if (!analytics) return <div className="analytics-page">No analytics data available</div>;

    const targets = {
        accuracy: analytics.model_reliability_score || 0,
        total: analytics.total_predictions || 0,
        weakRate: parseFloat(String(analytics.weak_prediction_rate || '0').replace('%', '')),
    };

    const distribution = [
        { name: 'Strong (≥80%)', value: analytics.strong_predictions || 0, color: 'var(--success)' },
        { name: 'Moderate (50-79%)', value: analytics.moderate_predictions || 0, color: 'var(--warning)' },
        { name: 'Weak (<50%)',  value: analytics.weak_predictions || 0, color: 'var(--danger)' },
    ];

    return (
        <StatCards targets={targets} distribution={distribution} animateStats={animateStats} />
    );
};

export default AnalyticsPage;
