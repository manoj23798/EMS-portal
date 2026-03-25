import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommunicationAPI } from '../../services/api';
import { MessageSquare, Bell, Search, Inbox, ChevronRight } from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';

export default function EmployeeCommunicationDashboard() {
    const navigate = useNavigate();
    const [communications, setCommunications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Get employee ID from auth context
    const currentEmployeeId = tokenManager.getUserData()?.employeeId;

    useEffect(() => {
        const fetchMyCommunications = async () => {
            try {
                const res = await CommunicationAPI.getMyCommunications(currentEmployeeId);
                // Sort by issue date descending
                const sorted = res.data.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
                setCommunications(sorted);
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : "Failed to fetch your communications.");
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchMyCommunications();
    }, []);

    const filteredComms = communications.filter(com => {
        return com.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (com.subject && com.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    return (
        <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)', padding: '16px', borderRadius: '16px' }}>
                        <Bell size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-primary)' }}>My Inbox</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '1.1rem' }}>
                            Official letters, memos, and enterprise announcements.
                        </p>
                    </div>
                </div>
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search your communications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '48px', paddingRight: '16px', height: '48px', fontSize: '1.05rem', borderRadius: '12px' }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center" style={{ padding: '60px' }}>Loading...</div>
            ) : filteredComms.length === 0 ? (
                <div className="card text-center" style={{ padding: '80px 20px', background: 'var(--bg-secondary)', borderStyle: 'dashed' }}>
                    <Inbox size={64} style={{ opacity: 0.2, marginBottom: '24px', margin: '0 auto' }} />
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>You're all caught up!</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No communications or letters have been assigned to you yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredComms.map(com => (
                        <div
                            key={com.id}
                            className="card hover-lift"
                            style={{
                                padding: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '24px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderLeft: '4px solid var(--primary)'
                            }}
                            onClick={() => navigate(`/communications/${com.id}`)}
                        >
                            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', color: 'var(--primary)' }}>
                                <MessageSquare size={24} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.5px' }}>{com.communicationTypeName}</span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{com.issueDate}</span>
                                </div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>{com.title}</h3>
                                {com.subject && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{com.subject}</p>}
                            </div>

                            <div style={{ padding: '12px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '50%' }}>
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
