import React, { useState } from 'react';
import { LeaveAPI } from '../../services/api';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LeaveApply() {
    const EMPLOYEE_ID = 1;
    const navigate = useNavigate();

    const [form, setForm] = useState({
        employeeId: EMPLOYEE_ID,
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        attachmentUrl: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const leaveTypes = ['Casual Leave', 'Sick Leave', 'Paid Leave', 'Unpaid Leave', 'Work From Home'];

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.leaveType || !form.startDate || !form.endDate) {
            setError('Please fill all required fields.');
            return;
        }
        if (form.endDate < form.startDate) {
            setError('End date must be on or after start date.');
            return;
        }

        try {
            setLoading(true);
            await LeaveAPI.apply(form);
            setSuccess('Leave request submitted successfully!');
            setTimeout(() => navigate('/leave'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || err.message || 'Failed to submit leave request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content">
            <div style={{ marginBottom: 24 }}>
                <button className="btn btn-secondary" onClick={() => navigate('/leave')} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={28} />
                    Apply Leave
                </h1>
            </div>

            {error && (
                <div style={{ background: 'rgba(247,37,133,0.08)', border: '1px solid rgba(247,37,133,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 20, color: 'var(--danger)', fontWeight: 500 }}>
                    {typeof error === 'string' ? error : JSON.stringify(error)}
                </div>
            )}
            {success && (
                <div style={{ background: 'rgba(76,201,240,0.08)', border: '1px solid rgba(76,201,240,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 20, color: 'var(--success)', fontWeight: 500 }}>
                    {success}
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <span className="card-title">Leave Application Form</span>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Leave Type *</label>
                                <select name="leaveType" className="form-select" value={form.leaveType} onChange={handleChange}>
                                    <option value="">Select Leave Type</option>
                                    {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Start Date *</label>
                                <input type="date" name="startDate" className="form-input" value={form.startDate} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date *</label>
                                <input type="date" name="endDate" className="form-input" value={form.endDate} onChange={handleChange} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Reason</label>
                                <textarea name="reason" className="form-input" rows="3" value={form.reason} onChange={handleChange}
                                    style={{ resize: 'vertical' }} placeholder="Enter reason for leave..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Attachment URL (optional)</label>
                                <input type="text" name="attachmentUrl" className="form-input" value={form.attachmentUrl} onChange={handleChange}
                                    placeholder="Link to supporting document" />
                            </div>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Leave Request'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => navigate('/leave')}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
