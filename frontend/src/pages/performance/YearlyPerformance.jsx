import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { PerformanceAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';

export default function YearlyPerformance() {
    const role = tokenManager.getUserRole();
    const canSelectEmployee = role === 'ADMIN' || role === 'HR' || role === 'PROJECT_MANAGER';
    
    const [year, setYear] = useState(new Date().getFullYear());
    const [employeeId, setEmployeeId] = useState('EMP101');
    const [data, setData] = useState([]);
    
    useEffect(() => {
        loadYearlyData();
    }, [year, employeeId]);

    const loadYearlyData = async () => {
        try {
            // const response = await PerformanceAPI.getMPRsByEmployeeAndYear(employeeId, year);
            // setData(response.data);
            
            // Mocking for UI
            const mockData = [
                { month: 1, score: 3.5, status: 'SUBMITTED' },
                { month: 2, score: 4.2, status: 'SUBMITTED' },
                { month: 3, score: 4.5, status: 'SUBMITTED' },
                { month: 4, score: 3.8, status: 'SUBMITTED' },
                { month: 5, score: 4.0, status: 'SUBMITTED' },
            ];
            setData(mockData);
        } catch (error) {
            console.error("Failed to load yearly data");
        }
    };

    const months = Array.from({length: 12}, (_, i) => new Date(2000, i).toLocaleString('default', { month: 'short' }));
    
    // Fill missing months for the chart/table
    const chartData = months.map((m, i) => {
        const found = data.find(d => d.month === i + 1);
        return { month: m, score: found ? found.score : null };
    });

    const validScores = data.filter(d => d.score != null).map(d => d.score);
    const avgScore = validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : 0;
    const bestScore = validScores.length ? Math.max(...validScores) : 0;
    const lowestScore = validScores.length ? Math.min(...validScores) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Yearly Performance Aggregation</h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>View annual trends and average scores.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {canSelectEmployee && (
                        <input 
                            value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                            placeholder="Employee ID"
                            style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1', width: 120 }}
                        />
                    )}
                    <select 
                        value={year} onChange={e => setYear(parseInt(e.target.value))}
                        style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 600 }}
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart2 size={24} /></div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>YTD AVERAGE</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{avgScore}</div>
                    </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={24} /></div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>BEST MONTH SCORE</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{bestScore}</div>
                    </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingDown size={24} /></div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>LOWEST MONTH SCORE</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{lowestScore}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Data Table */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Monthly Breakdown</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, textAlign: 'left' }}>
                                <th style={{ padding: '12px 20px' }}>Month</th>
                                <th style={{ padding: '12px 20px' }}>Score</th>
                                <th style={{ padding: '12px 20px' }}>Performance Band</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chartData.map((d, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#334155' }}>{d.month} {year}</td>
                                    <td style={{ padding: '12px 20px', fontWeight: 800, color: !d.score ? '#cbd5e1' : (d.score >= 4 ? '#16a34a' : '#ea580c') }}>
                                        {d.score ? d.score.toFixed(1) : '-'}
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        {!d.score ? '-' : (
                                            <span style={{ 
                                                padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                                background: d.score >= 4 ? '#dcfce7' : (d.score >= 3 ? '#eff6ff' : '#fee2e2'),
                                                color: d.score >= 4 ? '#166534' : (d.score >= 3 ? '#1e40af' : '#991b1b')
                                            }}>
                                                {d.score >= 4 ? 'Excellent / Good' : (d.score >= 3 ? 'Average' : 'Needs Improvement')}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Trend Chart Placeholder */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Performance Trend</h3>
                    <div style={{ flex: 1, border: '1px dashed #cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: '#f8fafc' }}>
                        [ Line Chart Placeholder (Month vs Score) ]
                    </div>
                </div>
            </div>
        </div>
    );
}
