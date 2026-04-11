import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    LineChart, Line
} from 'recharts';
import { fetchWeeklyReport } from '../services/api';
import { BarChart2, Cpu, Leaf, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';
import './ReportsPage.css';

/* ─────── Types ─────── */
interface WeeklyReport {
    total_scans: number;
    ewaste_count: number;
    non_ewaste_count: number;
    most_frequent_device: string;
    device_distribution: Record<string, number>;
    prediction_distribution: {
        strong: number;
        moderate: number;
        weak: number;
        unknown_ewaste: number;
        non_ewaste: number;
    };
    daily_scans: Record<string, number>;
}

/* ─────── Colours ─────── */
const PRED_COLORS: Record<string, string> = {
    strong:        '#10b981',
    moderate:      '#0ea5e9',
    weak:          '#f59e0b',
    unknown_ewaste:'#a78bfa',
    non_ewaste:    '#f43f5e',
};

const BAR_COLORS = [
    '#10b981','#0ea5e9','#f59e0b','#a78bfa','#f43f5e',
    '#34d399','#38bdf8','#fbbf24','#c084fc','#fb7185',
];

/* ─────── Summary Card ─────── */
const SummaryCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
    delay?: number;
}> = ({ icon, label, value, color, delay = 0 }) => (
    <div className="report-summary-card glass-card" style={{ animationDelay: `${delay}ms` }}>
        <div className="report-card-icon" style={{ background: color + '22', color }}>
            {icon}
        </div>
        <div className="report-card-text">
            <span className="report-card-label">{label}</span>
            <span className="report-card-value">{value}</span>
        </div>
    </div>
);

/* ─────── Custom Pie Label ─────── */
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

/* ─────── Page ─────── */
const ReportsPage: React.FC = () => {
    const [report, setReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchWeeklyReport();
            if (data.success) setReport(data);
            else setError('Failed to load report data.');
        } catch {
            setError('Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    /* ── derived chart data ── */
    const pieData = report
        ? Object.entries(report.prediction_distribution)
              .filter(([, v]) => v > 0)
              .map(([name, value]) => ({ name: name.replace('_', ' '), value, key: name }))
        : [];

    const barData = report
        ? Object.entries(report.device_distribution)
              .sort((a, b) => b[1] - a[1])
              .map(([device, count]) => ({ device, count }))
        : [];

    const lineData = report
        ? Object.entries(report.daily_scans).map(([date, scans]) => ({
              date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              scans
          }))
        : [];

    /* ── Render ── */
    if (loading) {
        return (
            <div className="reports-loading">
                <div className="reports-spinner" />
                <p>Loading weekly report…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reports-error glass-card">
                <AlertCircle size={32} color="#ef4444" />
                <p>{error}</p>
                <button className="btn btn-primary" onClick={load}>Retry</button>
            </div>
        );
    }

    return (
        <div className="reports-page animate-fade-in">
            {/* Header */}
            <div className="reports-header">
                <div>
                    <h1 className="reports-title">Weekly Report</h1>
                    <p className="text-secondary">Last 7 days · System-wide scan insights</p>
                </div>
                <button className="btn btn-outline reports-refresh-btn" onClick={load} id="reports-refresh-btn">
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="reports-summary-grid">
                <SummaryCard
                    icon={<TrendingUp size={22} />}
                    label="Total Scans"
                    value={report!.total_scans}
                    color="#10b981"
                    delay={0}
                />
                <SummaryCard
                    icon={<Cpu size={22} />}
                    label="E-Waste Detected"
                    value={report!.ewaste_count}
                    color="#0ea5e9"
                    delay={60}
                />
                <SummaryCard
                    icon={<Leaf size={22} />}
                    label="Non E-Waste"
                    value={report!.non_ewaste_count}
                    color="#f59e0b"
                    delay={120}
                />
                <SummaryCard
                    icon={<BarChart2 size={22} />}
                    label="Top Device"
                    value={report!.most_frequent_device}
                    color="#a78bfa"
                    delay={180}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="reports-charts-row">
                {/* Bar Chart – Device Distribution */}
                <div className="reports-chart-card glass-card">
                    <h2 className="reports-chart-title">Device Distribution</h2>
                    {barData.length === 0 ? (
                        <p className="reports-no-data text-muted">No device data this week.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis
                                    dataKey="device"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    angle={-30}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'rgba(16,185,129,0.05)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                    {barData.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pie Chart – Prediction Distribution */}
                <div className="reports-chart-card glass-card">
                    <h2 className="reports-chart-title">Prediction Breakdown</h2>
                    {pieData.length === 0 ? (
                        <p className="reports-no-data text-muted">No prediction data this week.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={PRED_COLORS[entry.key] ?? BAR_COLORS[i]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value, name]}
                                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Legend
                                    formatter={(value) => <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Line Chart – Daily Activity */}
            <div className="reports-chart-card glass-card reports-line-card">
                <h2 className="reports-chart-title">Daily Scan Activity</h2>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="scans"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#059669' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ReportsPage;
