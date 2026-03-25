import { useState, useEffect } from 'react';
import { OnboardingAPI } from '../../services/api';
import { CheckSquare, Square, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingChecklist() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const employeeId = 1; // HARDCODED for now

    useEffect(() => {
        fetchChecklist();
    }, []);

    const fetchChecklist = async () => {
        try {
            const res = await OnboardingAPI.getMyChecklist(employeeId);
            setTasks(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const toggleTask = async (task) => {
        if (task.status === 'Completed') return; // Immutable once completed for this demo

        const newStatus = task.status === 'Not Started' ? 'In Progress' : 'Completed';

        try {
            await OnboardingAPI.updateChecklistTask(task.id, employeeId, newStatus);
            fetchChecklist(); // Refresh
        } catch (err) {
            console.error('Failed to update task', err);
        }
    };

    const getTaskIcon = (status) => {
        if (status === 'Completed') return <CheckSquare size={24} className="text-green" />;
        if (status === 'In Progress') return <Clock size={24} className="text-orange" />;
        return <Square size={24} className="text-secondary" style={{ color: 'var(--text-secondary)' }} />;
    };

    const completedCount = tasks.filter(t => t.status === 'Completed').length;
    const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Induction Checklist</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Complete these tasks to finish your onboarding.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/onboarding')}>Back to Dashboard</button>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600 }}>Overall Progress</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{progress}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                </div>
                {progress === 100 && (
                    <div style={{ marginTop: '16px', padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>🎉 All tasks completed! You can now submit your induction feedback.</span>
                        <button className="btn btn-primary" onClick={() => navigate('/onboarding/feedback')}>
                            Give Feedback <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="card">
                {loading ? <p>Loading checklist...</p> : tasks.length === 0 ? (
                    <p>No checklist tasks found.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => toggleTask(task)}
                                className="hover-lift"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: task.status !== 'Completed' ? 'pointer' : 'default',
                                    background: task.status === 'Completed' ? 'var(--bg-secondary)' : 'transparent',
                                    borderRadius: '8px'
                                }}
                            >
                                {getTaskIcon(task.status)}
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 4px 0', textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                        {task.taskName}
                                    </h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Status: <strong>{task.status}</strong>
                                        {task.completedAt && ` • Completed on ${new Date(task.completedAt).toLocaleDateString()}`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
