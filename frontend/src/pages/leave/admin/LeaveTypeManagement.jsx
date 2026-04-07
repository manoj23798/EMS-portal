import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit3, Save, X, CheckCircle, 
    AlertCircle, Settings, Palette, Users, Calendar, 
    ArrowLeft, ShieldCheck, FilePlus, Filter, Clock
} from 'lucide-react';
import { LeaveConfigAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const LeaveTypeManagement = () => {
    const navigate = useNavigate();
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    
    const initialFormState = {
        name: '',
        paid: true,
        totalDays: 12,
        color: '#34d399',
        requireApproval: true,
        requireAttachment: false,
        isCarryForward: false,
        monthlyLimit: '',
        applicableAfterMonths: 0,
        genderRestriction: ''
    };
    
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            setLoading(true);
            const res = await LeaveConfigAPI.getTypes();
            setLeaveTypes(res.data || []);
            setError(null);
        } catch (err) {
            setError("Failed to load leave types. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const dataToSubmit = {
                ...formData,
                monthlyLimit: formData.monthlyLimit ? parseInt(formData.monthlyLimit) : null
            };
            
            if (editingType) {
                await LeaveConfigAPI.updateType(editingType.id, dataToSubmit);
                setSuccess("Leave type updated!");
            } else {
                await LeaveConfigAPI.createType(dataToSubmit);
                setSuccess("New leave type added!");
            }
            
            setShowModal(false);
            setEditingType(null);
            setFormData(initialFormState);
            fetchLeaveTypes();
            
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save. Check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type) => {
        setEditingType(type);
        setFormData({
            ...type,
            monthlyLimit: type.monthlyLimit || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave type?")) return;
        try {
            await LeaveConfigAPI.deleteType(id);
            setSuccess("Leave type deleted.");
            fetchLeaveTypes();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to delete. This type might be in use.");
        }
    };

    return (
        <div className="leave-type-config-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .leave-type-config-page {
                    padding: 40px;
                    min-height: 100vh;
                    background: #f8fafc;
                    font-family: 'Outfit', sans-serif;
                    color: #1e293b;
                }

                .config-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }

                .btn-nav-square {
                    width: 52px;
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 16px;
                    color: #1e293b;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .btn-nav-square:hover {
                    border-color: #ea580c;
                    color: #ea580c;
                    transform: translateX(-4px);
                    box-shadow: 0 10px 20px rgba(234, 88, 12, 0.1);
                }

                .title-unit h1 {
                    font-size: 32px;
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: -1px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #0f172a;
                }

                .subtitle-unit {
                    font-size: 11px;
                    font-weight: 800;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    margin-top: 4px;
                }

                .btn-create-premium {
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    color: white;
                    padding: 14px 28px;
                    border-radius: 18px;
                    font-weight: 900;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 10px 25px rgba(234, 88, 12, 0.25);
                }

                .btn-create-premium:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 35px rgba(234, 88, 12, 0.35);
                    background: #ea580c;
                }

                .policy-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 30px;
                }

                .policy-premium-card {
                    background: white;
                    border-radius: 35px;
                    border: 1.5px solid #e2e8f0;
                    padding: 35px;
                    position: relative;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }

                .policy-premium-card:hover {
                    border-color: #fbd5b0;
                    transform: translateY(-8px);
                    box-shadow: 0 25px 60px rgba(0,0,0,0.05);
                }

                .policy-icon-box {
                    width: 56px;
                    height: 56px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-family: 'Outfit';
                    font-weight: 900;
                    font-size: 24px;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                }

                .type-status-badge {
                    padding: 6px 14px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .card-data-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 0;
                    border-bottom: 2px solid #f8fafc;
                }

                .card-data-label {
                    font-size: 11px;
                    font-weight: 900;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                }

                .card-data-value {
                    font-size: 15px;
                    font-weight: 900;
                    color: #1e293b;
                }

                .feature-pill-wrap {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 25px;
                }

                .feature-pill {
                    padding: 8px 14px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: 1.5px solid;
                }

                /* MODAL */
                .modal-backdrop-premium {
                    position: fixed;
                    inset: 0;
                    z-index: 2000;
                    background: rgba(15, 23, 42, 0.45);
                    backdrop-filter: blur(15px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .modal-container-premium {
                    background: white;
                    width: 100%;
                    max-width: 700px;
                    border-radius: 45px;
                    box-shadow: 0 50px 100px rgba(0,0,0,0.25);
                    overflow: hidden;
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .input-premium-wrap {
                    margin-bottom: 25px;
                }

                .label-premium-ui {
                    font-size: 11px;
                    font-weight: 900;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 10px;
                    display: block;
                }

                .input-premium-ui {
                    width: 100%;
                    padding: 18px 24px;
                    border-radius: 20px;
                    border: 2px solid #f1f5f9;
                    background: #f8fafc;
                    font-family: inherit;
                    font-size: 14px;
                    font-weight: 800;
                    color: #1e293b;
                    outline: none;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                }

                .input-premium-ui:focus {
                    border-color: #ea580c;
                    background: white;
                    box-shadow: 0 10px 20px rgba(234, 88, 12, 0.05);
                }

                .toggle-pill-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-top: 30px;
                }

                .toggle-pill-ui {
                    padding: 16px;
                    border-radius: 18px;
                    border: 2px solid #f1f5f9;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #64748b;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .toggle-pill-ui.active {
                    background: #fff7ed;
                    border-color: #ea580c;
                    color: #ea580c;
                    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.1);
                }

                .alert-premium-ui {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 20px 30px;
                    border-radius: 25px;
                    font-size: 13px;
                    font-weight: 800;
                    margin-bottom: 30px;
                    border: 1.5px solid;
                }

                .alert-success { background: #f0fdf4; color: #166534; border-color: #dcfce3; }
                .alert-error { background: #fef2f2; color: #991b1b; border-color: #fee2e2; }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <header className="config-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <button onClick={() => navigate(-1)} className="btn-nav-square">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="title-unit">
                        <h1>LEAVE TYPES <Settings size={28} style={{ color: '#ea580c' }} /></h1>
                        <div className="subtitle-unit">Manage company leave rules</div>
                    </div>
                </div>

                <button onClick={() => { setEditingType(null); setFormData(initialFormState); setShowModal(true); }} className="btn-create-premium">
                    <Plus size={20} /> Add Leave Type
                </button>
            </header>

            {success && <div className="alert-premium-ui alert-success"> <CheckCircle size={22} /> {success} </div>}
            {error && <div className="alert-premium-ui alert-error"> <AlertCircle size={22} /> {error} </div>}

            {loading && !leaveTypes.length ? (
                <div style={{ padding: '150px 0', textAlign: 'center' }}>
                    <div style={{ width: '50px', height: '50px', border: '6px solid #f1f5f9', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>Loading types...</div>
                </div>
            ) : (
                <div className="policy-cards-grid">
                    {leaveTypes.map(type => (
                        <article key={type.id} className="policy-premium-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                    <div className="policy-icon-box" style={{ background: type.color || '#ea580c' }}>
                                        {type.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{type.name}</h3>
                                        <div className="type-status-badge" style={{ 
                                            background: type.paid ? '#f0fdf4' : '#f8fafc', 
                                            color: type.paid ? '#16a34a' : '#64748b',
                                            border: `1.5px solid ${type.paid ? '#dcfce3' : '#e2e8f0'}`,
                                            marginTop: '8px',
                                            display: 'inline-block'
                                        }}>
                                            {type.paid ? 'Paid Policy' : 'Unpaid Class'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleEdit(type)} style={{ padding: '10px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', color: '#64748b' }}> <Edit3 size={18} /> </button>
                                    <button onClick={() => handleDelete(type.id)} style={{ padding: '10px', background: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: '12px', cursor: 'pointer', color: '#dc2626' }}> <Trash2 size={18} /> </button>
                                </div>
                            </div>

                            <div style={{ borderTop: '2px solid #f8fafc', paddingTop: '10px' }}>
                                <div className="card-data-row"><span className="card-data-label">Days Per Year</span> <span className="card-data-value">{type.totalDays} Days</span></div>
                                <div className="card-data-row"><span className="card-data-label">Monthly Limit</span> <span className="card-data-value">{type.monthlyLimit ? `${type.monthlyLimit} Days` : 'N/A'}</span></div>
                                <div className="card-data-row"><span className="card-data-label">Min. Tenure</span> <span className="card-data-value">{type.applicableAfterMonths} Months</span></div>
                            </div>

                            <div className="feature-pill-wrap">
                                {type.requireApproval && <span className="feature-pill" style={{ background: '#eff6ff', color: '#2563eb', borderColor: '#dbeafe' }}>Approval Req</span>}
                                {type.requireAttachment && <span className="feature-pill" style={{ background: '#fff7ed', color: '#ea580c', borderColor: '#ffedd5' }}>Attach Req</span>}
                                {type.isCarryForward && <span className="feature-pill" style={{ background: '#fdf2f8', color: '#be185d', borderColor: '#fce7f3' }}>Carry Fwd</span>}
                                {type.genderRestriction && <span className="feature-pill" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}>{type.genderRestriction}</span>}
                            </div>
                        </article>
                    ))}
                    
                    {leaveTypes.length === 0 && !loading && (
                         <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '120px', background: 'white', borderRadius: '45px', border: '2px dashed #e2e8f0' }}>
                            <Settings size={80} style={{ color: '#e2e8f0', marginBottom: '30px' }} />
                            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>Empty Policy Registry</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 800 }}>Bootstrap your enterprise leave system by initializing policies.</p>
                         </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="modal-backdrop-premium">
                    <div className="modal-container-premium">
                        <div style={{ padding: '40px', background: '#fcfcfc', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>{editingType ? 'EDIT LEAVE TYPE' : 'NEW LEAVE TYPE'}</h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>Settings and rules</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'white', border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}> <X size={22} /> </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ padding: '40px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '35px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-premium-ui">Policy Identity</label>
                                    <input required className="input-premium-ui" placeholder="e.g. Annual Vacation, Professional Development" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                
                                <div>
                                    <label className="label-premium-ui">Color Recognition</label>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                         <input type="color" style={{ width: '60px', height: '60px', border: 'none', borderRadius: '18px', background: 'none', padding: 0, cursor: 'pointer' }} value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                                         <input className="input-premium-ui" value={formData.color.toUpperCase()} readOnly style={{ flex: 1, fontFamily: 'monospace', fontSize: '15px', color: '#ea580c' }} />
                                    </div>
                                </div>

                                <div>
                                    <label className="label-premium-ui">Days Per Year</label>
                                    <input type="number" required className="input-premium-ui" value={formData.totalDays} onChange={e => setFormData({...formData, totalDays: parseInt(e.target.value)})} />
                                </div>

                                <div>
                                    <label className="label-premium-ui">Monthly Max</label>
                                    <input type="number" className="input-premium-ui" placeholder="No limit" value={formData.monthlyLimit} onChange={e => setFormData({...formData, monthlyLimit: e.target.value})} />
                                </div>

                                <div>
                                    <label className="label-premium-ui">Wait Period (Months)</label>
                                    <input type="number" className="input-premium-ui" value={formData.applicableAfterMonths} onChange={e => setFormData({...formData, applicableAfterMonths: parseInt(e.target.value)})} />
                                </div>
                                
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label-premium-ui">Who can apply?</label>
                                    <select className="input-premium-ui" value={formData.genderRestriction} onChange={e => setFormData({...formData, genderRestriction: e.target.value})}>
                                        <option value="">Everyone</option>
                                        <option value="MALE">Male Only</option>
                                        <option value="FEMALE">Female Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="toggle-pill-grid">
                                <div className={`toggle-pill-ui ${formData.paid ? 'active' : ''}`} onClick={() => setFormData({...formData, paid: !formData.paid})}> Paid </div>
                                <div className={`toggle-pill-ui ${formData.requireApproval ? 'active' : ''}`} onClick={() => setFormData({...formData, requireApproval: !formData.requireApproval})}> Needs Approval </div>
                                <div className={`toggle-pill-ui ${formData.requireAttachment ? 'active' : ''}`} onClick={() => setFormData({...formData, requireAttachment: !formData.requireAttachment})}> Needs Attachment </div>
                            </div>

                             <div style={{ marginTop: '45px', display: 'flex', gap: '20px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '20px', borderRadius: '22px', background: '#f8fafc', color: '#94a3b8', border: 'none', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Cancel</button>
                                <button type="submit" disabled={loading} style={{ flex: 2, padding: '20px', borderRadius: '22px', background: '#ea580c', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', boxShadow: '0 10px 25px rgba(234, 88, 12, 0.2)' }}>
                                    {loading ? 'Processing...' : (editingType ? 'Save Changes' : 'Add Leave Type')} <CheckCircle size={22} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveTypeManagement;
