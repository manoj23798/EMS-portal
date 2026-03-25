import { useState, useEffect } from 'react';
import { OnboardingAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Send, Star } from 'lucide-react';

export default function InductionFeedback() {
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [rating, setRating] = useState(5);
    const [feedbackText, setFeedbackText] = useState('');
    const [suggestions, setSuggestions] = useState('');

    const navigate = useNavigate();
    const employeeId = 1; // HARDCODED

    useEffect(() => {
        checkExistingFeedback();
    }, []);

    const checkExistingFeedback = async () => {
        try {
            const res = await OnboardingAPI.getMyFeedback(employeeId);
            setFeedback(res.data);
            setLoading(false);
        } catch (err) {
            // 404 means no feedback sumitted yet, which is fine
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await OnboardingAPI.submitFeedback({
                employeeId,
                rating,
                feedback: feedbackText,
                suggestions
            });
            checkExistingFeedback(); // Refresh view to show submitted state
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit feedback. Ensure all checklist tasks are completed first.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ fontSize: '2.2rem', background: 'linear-gradient(45deg, #10b981, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Induction Feedback
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '1.1rem' }}>Shape the future of our onboarding experience.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/onboarding')} style={{ transition: 'all 0.3s ease' }}>
                    ← Back to Dashboard
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <div className="spin text-primary" style={{ width: 40, height: 40, border: '4px solid', borderRadius: '50%', borderTopColor: 'transparent' }}></div>
                </div>
            ) : feedback ? (
                <div className="card text-center hover-lift" style={{
                    padding: '60px 40px',
                    background: 'linear-gradient(145deg, var(--bg-primary), rgba(16, 185, 129, 0.05))',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    boxShadow: '0 20px 40px -20px rgba(16, 185, 129, 0.15)'
                }}>
                    <div style={{
                        display: 'inline-flex', background: 'linear-gradient(135deg, #34d399, #10b981)', color: 'white',
                        padding: '24px', borderRadius: '50%', marginBottom: '24px',
                        boxShadow: '0 10px 20px -10px #10b981',
                        animation: 'bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <Send size={40} />
                    </div>
                    <h3 style={{ fontSize: '1.8rem', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Feedback Confirmed!</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                        Thank you for sharing your experience. We review every submission to constantly improve our induction process for future rockstars like you.
                    </p>

                    <div style={{
                        background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', textAlign: 'left',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed var(--border)' }}>
                            <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Your Rating:</span>
                            <div style={{ display: 'flex', color: '#fbbf24', gap: '4px' }}>
                                {[...Array(feedback.rating)].map((_, i) => <Star key={i} size={24} fill="currentColor" style={{ filter: 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3))' }} />)}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Your Thoughts:</span>
                            <p style={{ margin: '8px 0 0 0', color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: '1.6' }}>"{feedback.feedback}"</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{
                    padding: '40px',
                    background: 'linear-gradient(145deg, var(--bg-primary), var(--bg-secondary))',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    boxShadow: '0 20px 40px -20px rgba(0,0,0,0.1)'
                }}>
                    {error && <div className="alert error" style={{ animation: 'slideIn 0.3s ease', marginBottom: '24px' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'block', textAlign: 'center', marginBottom: '16px' }}>
                                How would you rate your onboarding experience? *
                            </label>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        className={`rating-btn ${rating === num ? 'active' : ''}`}
                                        onClick={() => setRating(num)}
                                        style={{
                                            width: '60px', height: '60px', borderRadius: '16px',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.2rem', fontWeight: 'bold', gap: '4px',
                                            border: rating === num ? 'none' : '1px solid var(--border)',
                                            background: rating === num ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'var(--bg-secondary)',
                                            color: rating === num ? 'white' : 'var(--text-secondary)',
                                            boxShadow: rating === num ? '0 10px 20px -10px #f59e0b' : 'none',
                                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            transform: rating === num ? 'scale(1.1)' : 'scale(1)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Star size={20} fill={rating >= num ? "currentColor" : "none"} />
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>What went well? What could be improved? *</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                required
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Please be as honest and detailed as possible..."
                                style={{ padding: '16px', fontSize: '1.05rem', lineHeight: '1.6', background: 'var(--card-bg)', borderRadius: '12px', resize: 'vertical' }}
                            ></textarea>
                        </div>

                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Any other suggestions? (Optional)</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                value={suggestions}
                                onChange={(e) => setSuggestions(e.target.value)}
                                placeholder="E.g. The IT setup could be faster, documentation was great..."
                                style={{ padding: '16px', fontSize: '1.05rem', lineHeight: '1.6', background: 'var(--card-bg)', borderRadius: '12px', resize: 'vertical' }}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                width: '100%', padding: '16px', fontSize: '1.2rem', fontWeight: 600,
                                borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '12px',
                                background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                                boxShadow: '0 10px 20px -10px rgba(99, 102, 241, 0.5)'
                            }}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <><div className="spin" style={{ width: 24, height: 24, border: '3px solid', borderRadius: '50%', borderTopColor: 'transparent' }}></div> Submitting...</>
                            ) : (
                                <><Send size={24} /> Submit Experience</>
                            )}
                        </button>
                    </form>
                </div>
            )}

            <style>{`
                .rating-btn:hover:not(.active) {
                    transform: scale(1.05) !important;
                    border-color: #fbbf24 !important;
                    color: #fbbf24 !important;
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.1); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
