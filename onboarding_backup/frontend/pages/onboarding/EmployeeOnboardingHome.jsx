import { useState, useEffect } from 'react';
import { OnboardingAPI } from '../../services/api';
import { FileText, CheckSquare, MessageSquare, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmployeeOnboardingHome() {
    const [onboarding, setOnboarding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const employeeId = 1; // HARDCODED for now

    useEffect(() => {
        fetchOnboardingData();
    }, []);

    const fetchOnboardingData = async () => {
        try {
            const res = await OnboardingAPI.getMyOnboarding(employeeId);
            setOnboarding(res.data);
            setLoading(false);
        } catch (err) {
            setError('Onboarding data not found. Please contact HR to initiate your onboarding process.');
            setLoading(false);
        }
    };

    if (loading) return <div className="page-container"><p>Loading...</p></div>;
    if (error) return <div className="page-container"><div className="alert error"><AlertCircle size={20} /> {error}</div></div>;

    const cards = [
        {
            title: 'Welcome Documents',
            desc: 'Upload required joining documents like Aadhaar, PAN, and signed NDAs.',
            icon: <FileText size={32} className="text-blue" />,
            link: '/onboarding/documents',
            status: 'Action Required',
            color: 'var(--primary)'
        },
        {
            title: 'Onboarding Checklist',
            desc: 'Track and complete your mandatory IT and HR induction tasks.',
            icon: <CheckSquare size={32} className="text-orange" />,
            link: '/onboarding/checklist',
            status: 'In Progress',
            color: '#f59e0b'
        },
        {
            title: 'Induction Feedback',
            desc: 'Share your onboarding experience once all tasks are completed.',
            icon: <MessageSquare size={32} className="text-green" />,
            link: '/onboarding/feedback',
            status: onboarding.status === 'Completed' ? 'Submitted' : 'Locked',
            color: '#10b981'
        }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Welcome to Your Onboarding Journey</h2>
                <span className={`status-badge ${onboarding.status.replace(' ', '').toLowerCase()}`}>
                    {onboarding.status === 'Completed' ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {onboarding.status}
                </span>
            </div>

            <div className="card" style={{ marginBottom: '24px', padding: '24px', background: 'linear-gradient(135deg, var(--primary) 0%, #312e81 100%)', color: 'white' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem' }}>Hello, {onboarding.employeeName}! 👋</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>
                    Your onboarding is currently <strong>{onboarding.status}</strong>. Please complete the document uploads and checklist items below to finalize your induction into the {onboarding.departmentName} department as a {onboarding.designationTitle}.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {cards.map((card, idx) => (
                    <Link to={card.link} key={idx} className="card hover-lift" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', background: `${card.color}15`, borderRadius: '12px', color: card.color }}>
                                {card.icon}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                {card.status}
                            </span>
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{card.title}</h3>
                        <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1 }}>{card.desc}</p>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', fontWeight: 500, fontSize: '0.9rem', marginTop: 'auto' }}>
                            Open Module <ChevronRight size={16} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
