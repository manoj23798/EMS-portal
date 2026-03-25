import React, { useState } from 'react';
import { PermissionAPI } from '../../services/api';
import { Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tokenManager } from '../../utils/tokenManager';

export default function PermissionApply() {
    const userData = tokenManager.getUserData();
    const EMPLOYEE_ID = userData?.employeeId;
    const navigate = useNavigate();

    const [form, setForm] = useState({
        employeeId: EMPLOYEE_ID,
        date: '',
        startTime: '',
        endTime: '',
        reason: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.date || !form.startTime || !form.endTime) {
            setError('Please fill all required fields.');
            return;
        }
        if (form.endTime <= form.startTime) {
            setError('End time must be after start time.');
            return;
        }

        try {
            setLoading(true);
            await PermissionAPI.apply(form);
            setSuccess('Permission request submitted successfully!');
            setTimeout(() => navigate('/leave'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || err.message || 'Failed to submit permission request.');
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
                    <Clock size={28} />
                    Apply Permission
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Request short-term time off (e.g. personal work, medical visit)</p>
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
                    <span className="card-title">Permission Application Form</span>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Date *</label>
                                <input type="date" name="date" className="form-input" value={form.date} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Start Time *</label>
                                <input type="time" name="startTime" className="form-input" value={form.startTime} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Time *</label>
                                <input type="time" name="endTime" className="form-input" value={form.endTime} onChange={handleChange} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Reason</label>
                                <textarea name="reason" className="form-input" rows="3" value={form.reason} onChange={handleChange}
                                    style={{ resize: 'vertical' }} placeholder="Enter reason for permission..." />
                            </div>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Permission Request'}
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
