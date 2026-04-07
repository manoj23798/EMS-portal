import React, { useState } from 'react';
import { PermissionAPI } from '../../services/api';
import { 
    Clock, ArrowLeft, Send, AlertCircle, Info, 
    Calendar, CheckCircle, HelpCircle, Briefcase, XCircle
} from 'lucide-react';
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
            setError('Please fill in all timestamp fields marked with *');
            return;
        }

        try {
            setLoading(true);
            await PermissionAPI.apply(form);
            setSuccess('Permission request successfully transmitted for management review.');
            setTimeout(() => navigate('/leave'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'A network error occurred during transmission.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '0 24px 24px 24px', background: '#ffffff', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <style>{`
                .node-card { background: white; border-radius: 24px; border: 1.5px solid #cbd5e1; box-shadow: 0 10px 40px rgba(0,0,0,0.04); overflow: hidden; width: 100%; max-width: 650px; margin-top: 24px; }
                .input-group { margin-bottom: 20px; }
                .input-label { font-size: 10px; fontWeight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
                .styled-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #cbd5e1; background: #f8fafc; font-size: 14px; fontWeight: 700; color: #1e293b; outline: none; transition: 0.2s; }
                .styled-input:focus { border-color: #f97316; background: white; box-shadow: 0 0 0 4px rgba(249,115,22,0.1); }
                .btn-submit { display: flex; width: 100%; justify-content: center; align-items: center; gap: 8px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; border: none; padding: 14px; border-radius: 12px; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; box-shadow: 0 4px 14px rgba(249,115,22,0.3); transition: 0.2s; margin-top: 10px; }
                .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(249,115,22,0.4); }
            `}</style>
            
            <div className="node-card">
                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                        <button onClick={() => navigate('/leave')} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', padding: '8px', border: '1.5px solid #fed7aa', borderRadius: '12px' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 950, color: '#431407', textTransform: 'uppercase', letterSpacing: '-0.8px' }}>Apply Permission</h1>
                            <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Gate Pass / Early Exit Request</p>
                        </div>
                    </div>

                    {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '14px 20px', borderRadius: '12px', border: '1.5px solid #fee2e2', fontSize: '12px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><XCircle size={16}/> {error}</div>}
                    {success && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '14px 20px', borderRadius: '12px', border: '1.5px solid #dcfce3', fontSize: '12px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle size={16}/> {success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Scheduled Date *</label>
                            <input type="date" name="date" className="styled-input" value={form.date} onChange={handleChange} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div className="input-group">
                                <label className="input-label">Start Time *</label>
                                <input type="time" name="startTime" className="styled-input" value={form.startTime} onChange={handleChange} />
                            </div>

                            <div className="input-group">
                                <label className="input-label">End Time *</label>
                                <input type="time" name="endTime" className="styled-input" value={form.endTime} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Contextual Reason</label>
                            <textarea name="reason" className="styled-input" rows="4" value={form.reason} onChange={handleChange}
                                placeholder="State the reason for temporal leave context (e.g. Personal Work, Medical Emergency)..." style={{ resize: 'none' }} />
                        </div>

                        <div style={{ padding: '16px', background: '#fff7ed', borderRadius: '16px', border: '1.5px solid #fed7aa', marginBottom: '24px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 950, color: '#f97316', textTransform: 'uppercase' }}>Attention Note</h4>
                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#7c2d12' }}>Permissions are limited to 2 hours per month. Excessive usage may impact performance metrics.</p>
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Transmitting Pipeline...' : <><Send size={16}/> Dispatch Request</>}
                        </button>
                    </form>
                </div>
            </div>
            
            <p style={{ marginTop: '24px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Secure Gate Pass Authorization System • EMS v2.4
            </p>
        </div>
    );
}
