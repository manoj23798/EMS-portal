import React, { useState, useEffect } from 'react';
import { LeaveAPI } from '../../services/api';
import { 
    FileText, ArrowLeft, Send, AlertCircle, Info, 
    Calendar, CheckCircle, HelpCircle, Briefcase,
    XCircle, ShieldCheck, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tokenManager } from '../../utils/tokenManager';

export default function LeaveApply() {
    const userData = tokenManager.getUserData();
    const EMPLOYEE_ID = userData?.employeeId;
    const navigate = useNavigate();

    const [balances, setBalances] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [form, setForm] = useState({
        employeeId: EMPLOYEE_ID,
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        attachmentUrl: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dateWarning, setDateWarning] = useState('');

    const normalizeTypeName = (name) => (name || '').trim().toLowerCase();
    const formatLeaveTypeLabel = (name) => (normalizeTypeName(name) === 'urgent leave' ? 'Unplanned Leave' : name);
    const isPlannedType = (name) => normalizeTypeName(name) === 'planned leave';
    const isUnplannedType = (name) => {
        const normalized = normalizeTypeName(name);
        return normalized === 'unplanned leave' || normalized === 'urgent leave';
    };

    useEffect(() => {
        if (EMPLOYEE_ID) {
            fetchInitialData();
        }
    }, [EMPLOYEE_ID]);

    const fetchInitialData = async () => {
        try {
            const [balanceRes, typesRes] = await Promise.all([
                LeaveAPI.getBalance(EMPLOYEE_ID),
                import('../../services/api').then(m => m.LeaveConfigAPI.getTypes())
            ]);
            setBalances(Array.isArray(balanceRes.data) ? balanceRes.data : []);
            const allowedTypes = (typesRes.data || []).filter(t => isPlannedType(t.name) || isUnplannedType(t.name));
            setLeaveTypes(allowedTypes);
        } catch (err) {
            console.error("Initialization failure", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        // Real-time validation for date warning
        if (name === 'startDate' || name === 'leaveTypeId') {
            validateDateWarning({ ...form, [name]: value });
        }
    };

    const validateDateWarning = (formData) => {
        const selectedType = leaveTypes.find(t => t.id === parseInt(formData.leaveTypeId, 10));
        
        if (isPlannedType(selectedType?.name) && formData.startDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const start = new Date(formData.startDate);
            start.setHours(0, 0, 0, 0);
            const leadDays = Math.floor((start - today) / (1000 * 60 * 60 * 24));

            if (leadDays >= 0 && leadDays < 5) {
                setDateWarning(`⚠ Planned Leave requires 5 days advance notice. You have only ${leadDays} day${leadDays !== 1 ? 's' : ''} remaining.`);
            } else if (leadDays < 0) {
                setDateWarning('⚠ Cannot select a date in the past.');
            } else {
                setDateWarning('');
            }
        } else {
            setDateWarning('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.leaveTypeId || !form.startDate || !form.endDate) {
            setError('Please fill in all required fields.');
            return;
        }
        if (new Date(form.endDate) < new Date(form.startDate)) {
            setError('End date cannot be earlier than start date.');
            return;
        }

        const selectedType = leaveTypes.find(t => t.id === parseInt(form.leaveTypeId, 10));
        if (!selectedType) {
            setError('Please select a valid leave type.');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(form.startDate);
        start.setHours(0, 0, 0, 0);


        if (!isPlannedType(selectedType.name) && !isUnplannedType(selectedType.name)) {
            setError('Only Planned Leave and Unplanned Leave are available.');
            return;
        }

        try {
            setLoading(true);
            await LeaveAPI.apply(form);
            setSuccess('Leave request submitted successfully!');
            setTimeout(() => navigate('/leave'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const selectedType = leaveTypes.find(t => t.id === parseInt(form.leaveTypeId, 10));
    const selectedBalance = selectedType
        ? balances.find((b) => b.leaveType === selectedType.name) || balances[0] || null
        : balances[0] || null;

    return (
        <div className="leave-apply-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .leave-apply-container {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 24px;
                    padding: 24px;
                    background: #f8fafc;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    box-sizing: border-box;
                }

                .main-form-card {
                    background: white;
                    border-radius: 24px;
                    border: 1.5px solid #e2e8f0;
                    padding: 28px;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.03);
                    height: fit-content;
                }

                .header-flex {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .btn-icon-nav {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    color: #ea580c;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .btn-icon-nav:hover {
                    border-color: #ea580c;
                    transform: translateX(-4px);
                    box-shadow: 0 10px 20px rgba(234, 88, 12, 0.1);
                }

                .title-stack h1 {
                    font-size: 24px;
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: -0.5px;
                    color: #0f172a;
                }

                .subtitle-stack {
                    font-size: 10px;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    margin-top: 4px;
                }

                .form-grid-layout {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .input-block-premium {
                    margin-bottom: 5px;
                }

                .label-premium-ui {
                    font-size: 10px;
                    font-weight: 900;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                    display: block;
                }

                .input-premium-ui {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: 14px;
                    border: 2px solid #f1f5f9;
                    background: #f8fafc;
                    font-family: inherit;
                    font-size: 13px;
                    font-weight: 800;
                    color: #1e293b;
                    outline: none;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                }

                .input-premium-ui:focus {
                    border-color: #ea580c;
                    background: white;
                    box-shadow: 0 10px 25px rgba(234, 88, 12, 0.05);
                }

                .textarea-premium-ui {
                    resize: none;
                    height: 110px;
                }

                .btn-submit-premium {
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    color: white;
                    padding: 14px 20px;
                    border-radius: 16px;
                    font-weight: 900;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 100%;
                    margin-top: 24px;
                    box-shadow: 0 15px 35px rgba(234, 88, 12, 0.25);
                }

                .btn-submit-premium:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 20px 45px rgba(234, 88, 12, 0.35);
                }

                .btn-submit-premium:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                /* RIGHT SIDEBAR */
                .sidebar-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .info-premium-card {
                    background: white;
                    border-radius: 24px;
                    border: 1.5px solid #e2e8f0;
                    padding: 24px;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.02);
                }

                .balance-display-box {
                    border-left: 5px solid #ea580c;
                    padding-left: 16px;
                    margin: 18px 0;
                }

                .balance-label {
                    font-size: 10px;
                    font-weight: 900;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                }

                .balance-value-big {
                    font-size: 36px;
                    font-weight: 900;
                    color: #0f172a;
                    letter-spacing: -1px;
                }

                .balance-unit {
                    font-size: 12px;
                    color: #64748b;
                    margin-left: 8px;
                }

                .entitlement-row-ui {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 0;
                    border-bottom: 1.5px solid #f8fafc;
                }

                .entitlement-label-ui {
                    font-size: 12px;
                    font-weight: 900;
                    color: #64748b;
                }

                .entitlement-val-ui {
                    font-size: 12px;
                    font-weight: 900;
                    color: #0f172a;
                }

                .guideline-item {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 12px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #64748b;
                    line-height: 1.5;
                }

                .alert-ui-premium {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 14px 16px;
                    border-radius: 14px;
                    font-size: 12px;
                    font-weight: 800;
                    margin-bottom: 20px;
                    border: 1.5px solid;
                }

                .alert-success { background: #f0fdf4; color: #166534; border-color: #dcfce3; }
                .alert-error { background: #fef2f2; color: #991b1b; border-color: #fee2e2; }
                .alert-warning { background: #fffbeb; color: #92400e; border-color: #fef3c7; }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Main Application Interface */}
            <main className="main-form-card">
                <header className="header-flex">
                    <button onClick={() => navigate('/leave')} className="btn-icon-nav">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="title-stack">
                        <h1>APPLY FOR LEAVE</h1>
                    </div>
                </header>

                {error && <div className="alert-ui-premium alert-error"> <XCircle size={22} /> {error} </div>}
                {success && <div className="alert-ui-premium alert-success"> <CheckCircle size={22} /> {success} </div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid-layout">
                        <div className="input-block-premium" style={{ gridColumn: 'span 2' }}>
                            <label className="label-premium-ui">Leave Type *</label>
                            <select name="leaveTypeId" className="input-premium-ui" value={form.leaveTypeId} onChange={handleChange}>
                                <option value="">Select leave type...</option>
                                {leaveTypes.map(t => <option key={t.id} value={t.id}>{formatLeaveTypeLabel(t.name)}</option>)}
                            </select>
                        </div>

                        <div className="input-block-premium">
                            <label className="label-premium-ui">Start Date *</label>
                            {dateWarning && (
                                <div className="alert-ui-premium alert-warning" style={{ marginBottom: '12px' }}>
                                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                                    {dateWarning}
                                </div>
                            )}
                            <input type="date" name="startDate" className="input-premium-ui" value={form.startDate} onChange={handleChange} />
                        </div>

                        <div className="input-block-premium">
                            <label className="label-premium-ui">End Date *</label>
                            <input type="date" name="endDate" className="input-premium-ui" value={form.endDate} onChange={handleChange} />
                        </div>

                        <div className="input-block-premium" style={{ gridColumn: 'span 2' }}>
                            <label className="label-premium-ui">Reason for Leave</label>
                            <textarea name="reason" className="input-premium-ui textarea-premium-ui" value={form.reason} onChange={handleChange}
                                placeholder="Why are you taking leave?" />
                        </div>

                        <div className="input-block-premium" style={{ gridColumn: 'span 2' }}>
                            <label className="label-premium-ui">Attachment (Google Drive/Dropbox Link)</label>
                            <input type="text" name="attachmentUrl" className="input-premium-ui" value={form.attachmentUrl} onChange={handleChange}
                                placeholder="Link to your document..." />
                        </div>
                    </div>

                    <button type="submit" className="btn-submit-premium" disabled={loading}>
                        {loading ? (
                            <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                        ) : (
                            <><Send size={20}/> Submit Request</>
                        )}
                    </button>
                </form>
            </main>

            {/* Information Architecture Sidebar */}
            <aside className="sidebar-stack">
                <section className="info-premium-card">
                    <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldCheck size={20} style={{ color: '#ea580c' }} /> LEAVE BALANCE
                    </h2>
                    
                    {form.leaveTypeId ? (
                        <div style={{ animation: 'fadeIn 0.4s ease forwards' }}>
                            <div className="balance-display-box">
                                <span className="balance-label">Remaining Balance</span>
                                <div className="balance-value-big">
                                    {selectedBalance ? selectedBalance.remainingLeaves : '0'}
                                    <span className="balance-unit">DAYS</span>
                                </div>
                            </div>
                            
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '28px 0', color: '#64748b' }}>
                            <HelpCircle size={42} style={{ opacity: 0.2, marginBottom: '12px' }} />
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Select leave type to see details</p>
                        </div>
                    )}
                </section>

                <section className="info-premium-card" style={{ background: '#f8fafc', borderStyle: 'dashed', borderColor: '#94a3b8' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '12px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Briefcase size={18} style={{ color: '#ea580c' }} /> REMINDERS
                    </h3>
                    <div className="guideline-item">
                        <CheckCircle size={16} style={{ color: '#ea580c', flexShrink: 0 }} />
                        <span>Planned Leave must be requested at least 5 days before the start date.</span>
                    </div>
                    <div className="guideline-item">
                        <CheckCircle size={16} style={{ color: '#ea580c', flexShrink: 0 }} />
                        <span>Unplanned Leave can be requested on the same day or any day.</span>
                    </div>
                    <div className="guideline-item">
                        <CheckCircle size={16} style={{ color: '#ea580c', flexShrink: 0 }} />
                        <span>Only Planned Leave and Unplanned Leave are available.</span>
                    </div>
                </section>
            </aside>
        </div>
    );
}
