import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { PerformanceAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';

export default function PerformanceDashboard() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        completedReviews: 0,
        pendingReviews: 0,
        averageScore: 0
    });
    const [recentReviews, setRecentReviews] = useState([]);
    const [recentService, setRecentService] = useState([]);
    const role = tokenManager.getUserRole();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const { data } = await PerformanceAPI.getDashboardStats();
            setStats({
                totalEmployees: data.totalEmployees || 0,
                completedReviews: data.completedReviews || 0,
                pendingReviews: data.pendingReviews || 0,
                averageScore: data.averageScore ? data.averageScore.toFixed(1) : 0
            });
            
            // Mocking chart data and recent tables for now to match UI requirements
            // In a real scenario, backend would return these
            setRecentReviews([
                { id: 1, empName: 'Ramesh Kumar', empId: 'EMP102', month: 'Feb 2026', score: 4.2, status: 'SUBMITTED' },
                { id: 2, empName: 'Suresh', empId: 'EMP118', month: 'Feb 2026', score: 3.8, status: 'DRAFT' },
            ]);
            
            setRecentService([
                { id: 1, empName: 'Ramesh Kumar', date: '15-02-2026', nature: 'Client Appreciation', category: 'Good' },
                { id: 2, empName: 'Suresh', date: '20-02-2026', nature: 'Late Reporting', category: 'Bad' },
            ]);
        } catch (error) {
            console.error("Failed to load dashboard", error);
        }
    };

    const StatCard = ({ title, value, icon, color, bg }) => (
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 24, color: '#0f172a', fontWeight: 800 }}>{value}</div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Performance Dashboard</h1>
                <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Overview of monthly performance and service records.</p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                <StatCard title="Total Employees" value={stats.totalEmployees} icon={<Users size={28} />} bg="#eff6ff" color="#3b82f6" />
                <StatCard title="Completed Reviews" value={stats.completedReviews} icon={<CheckCircle size={28} />} bg="#f0fdf4" color="#16a34a" />
                <StatCard title="Pending Reviews" value={stats.pendingReviews} icon={<Clock size={28} />} bg="#fefce8" color="#eab308" />
                <StatCard title="Average MPR Score" value={`${stats.averageScore} / 5.0`} icon={<TrendingUp size={28} />} bg="#f5f3ff" color="#8b5cf6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
                {/* Recent Reviews Table */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Recent Reviews</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: 12, textAlign: 'left' }}>
                                <th style={{ padding: '12px 8px' }}>EMPLOYEE</th>
                                <th style={{ padding: '12px 8px' }}>MONTH</th>
                                <th style={{ padding: '12px 8px' }}>SCORE</th>
                                <th style={{ padding: '12px 8px' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReviews.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{r.empName} <span style={{color:'#94a3b8', fontSize:12}}>({r.empId})</span></td>
                                    <td style={{ padding: '12px 8px' }}>{r.month}</td>
                                    <td style={{ padding: '12px 8px', fontWeight: 800, color: r.score >= 4 ? '#16a34a' : '#ea580c' }}>{r.score}</td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                            background: r.status === 'SUBMITTED' ? '#dcfce7' : '#fef3c7',
                                            color: r.status === 'SUBMITTED' ? '#166534' : '#92400e'
                                        }}>{r.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Recent Service Register */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Recent Service Register Entries</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: 12, textAlign: 'left' }}>
                                <th style={{ padding: '12px 8px' }}>DATE</th>
                                <th style={{ padding: '12px 8px' }}>EMPLOYEE</th>
                                <th style={{ padding: '12px 8px' }}>ACTION</th>
                                <th style={{ padding: '12px 8px' }}>CATEGORY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentService.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                                    <td style={{ padding: '12px 8px', color: '#64748b' }}>{r.date}</td>
                                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{r.empName}</td>
                                    <td style={{ padding: '12px 8px' }}>{r.nature}</td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                            background: r.category === 'Good' ? '#dcfce7' : '#fee2e2',
                                            color: r.category === 'Good' ? '#166534' : '#991b1b'
                                        }}>{r.category}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Charts Placeholder for UI matching */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                [ Analytics Charts Placeholder - Integrates with Chart.js / Recharts ]
            </div>
        </div>
    );
}
