import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Calendar, Globe, 
    ArrowLeft, AlertCircle, CheckCircle, Search, 
    Filter, X, Clock, MapPin
} from 'lucide-react';
import { LeaveConfigAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const HolidayManagement = () => {
    const navigate = useNavigate();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [viewType, setViewType] = useState('ALL'); // ALL, GOVERNMENT, COMPANY

    const [formData, setFormData] = useState({
        name: '',
        date: '',
        type: 'GOVERNMENT' // GOVERNMENT, COMPANY
    });

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const res = await LeaveConfigAPI.getHolidays();
            setHolidays(res.data || []);
            setError(null);
        } catch (err) {
            setError("Failed to load holidays. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await LeaveConfigAPI.createHoliday(formData);
            setSuccess("Holiday added successfully!");
            setShowModal(false);
            setFormData({ name: '', date: '', type: 'GOVERNMENT' });
            fetchHolidays();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to add holiday.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this holiday?")) return;
        try {
            await LeaveConfigAPI.deleteHoliday(id);
            setSuccess("Holiday deleted.");
            fetchHolidays();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Could not delete holiday.");
        }
    };

    const filteredHolidays = (holidays || []).filter(h => viewType === 'ALL' || h.type === viewType);

    return (
        <div className="holiday-manager-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .holiday-manager-page {
                    padding: 40px;
                    min-height: 100vh;
                    background: #f8fafc;
                    font-family: 'Outfit', sans-serif;
                    color: #1e293b;
                }

                .header-flex-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }

                .admin-nav-back {
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

                .admin-nav-back:hover {
                    border-color: #ea580c;
                    color: #ea580c;
                    transform: translateX(-4px);
                    box-shadow: 0 10px 20px rgba(234, 88, 12, 0.1);
                }

                .registry-title-group h1 {
                    font-size: 32px;
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: -1px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #0f172a;
                }

                .registry-subtitle {
                    font-size: 11px;
                    font-weight: 800;
                    color: #ea580c;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    margin-top: 4px;
                }

                .filter-pill-container {
                    display: flex;
                    gap: 8px;
                    background: #f1f5f9;
                    padding: 6px;
                    border-radius: 18px;
                }

                .filter-pill {
                    padding: 10px 20px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #64748b;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: 0.2s;
                    border: none;
                }

                .filter-pill.active {
                    background: white;
                    color: #ea580c;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                .btn-add-primary {
                    background: #ea580c;
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

                .btn-add-primary:hover {
                    background: #c2410c;
                    transform: translateY(-2px);
                    box-shadow: 0 15px 35px rgba(234, 88, 12, 0.35);
                }

                .registry-glass-panel {
                    background: white;
                    border-radius: 32px;
                    border: 1.5px solid #e2e8f0;
                    padding: 35px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.03);
                    position: relative;
                }

                .registry-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                .registry-table th {
                    padding: 20px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 2px;
                    border-bottom: 2px solid #f8fafc;
                }

                .registry-table td {
                    padding: 24px 20px;
                    border-bottom: 1.5px solid #f8fafc;
                    font-size: 14px;
                    font-weight: 800;
                    color: #1e293b;
                }

                .event-name-cell {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .category-badge {
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .btn-action-purged {
                    padding: 12px;
                    border-radius: 14px;
                    border: 1.5px solid #fee2e2;
                    background: #fef2f2;
                    color: #dc2626;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .btn-action-purged:hover {
                    background: #dc2626;
                    color: white;
                    transform: scale(1.05);
                }

                /* MODAL ANIMATION */
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .modal-overlay-registry {
                    position: fixed;
                    inset: 0;
                    z-index: 2000;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .modal-box-registry {
                    background: white;
                    width: 100%;
                    max-width: 550px;
                    border-radius: 40px;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.2);
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .input-group-premium {
                    margin-bottom: 25px;
                }

                .label-premium {
                    font-size: 11px;
                    font-weight: 900;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 10px;
                    display: block;
                }

                .input-premium {
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

                .input-premium:focus {
                    border-color: #ea580c;
                    background: white;
                    box-shadow: 0 10px 20px rgba(234, 88, 12, 0.05);
                }

                .alert-premium {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 20px 30px;
                    border-radius: 24px;
                    font-size: 13px;
                    font-weight: 800;
                    margin-bottom: 30px;
                    border: 1.5px solid;
                    animation: slideUp 0.3s ease forwards;
                }

                .alert-success { background: #f0fdf4; color: #166534; border-color: #dcfce3; }
                .alert-error { background: #fef2f2; color: #991b1b; border-color: #fee2e2; }
            `}</style>

            <header className="header-flex-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <button onClick={() => navigate(-1)} className="admin-nav-back">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="registry-title-group">
                        <h1>PUBLIC HOLIDAYS <Globe size={28} style={{ color: '#ea580c' }} /></h1>
                        <div className="registry-subtitle">View and manage company holidays</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <div className="filter-pill-container">
                        <button className={`filter-pill ${viewType === 'ALL' ? 'active' : ''}`} onClick={() => setViewType('ALL')}>All</button>
                        <button className={`filter-pill ${viewType === 'GOVERNMENT' ? 'active' : ''}`} onClick={() => setViewType('GOVERNMENT')}>Govt</button>
                        <button className={`filter-pill ${viewType === 'COMPANY' ? 'active' : ''}`} onClick={() => setViewType('COMPANY')}>Company</button>
                    </div>

                    <button onClick={() => setShowModal(true)} className="btn-add-primary">
                        <Plus size={20} /> Add Holiday
                    </button>
                </div>
            </header>

            {success && <div className="alert-premium alert-success"> <CheckCircle size={22} /> {success} </div>}
            {error && <div className="alert-premium alert-error"> <AlertCircle size={22} /> {error} </div>}

            <main className="registry-glass-panel">
                <div style={{ marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#475569', margin: 0 }}>Upcoming Holidays ({filteredHolidays.length})</h3>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input className="input-premium" style={{ width: '300px', padding: '14px 20px 14px 50px', borderRadius: '16px', fontSize: '13px' }} placeholder="Search holiday..." />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '120px 0', textAlign: 'center' }}>
                        <div style={{ width: '50px', height: '50px', border: '6px solid #f1f5f9', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>Loading holidays...</div>
                    </div>
                ) : (
                    <table className="registry-table">
                        <thead>
                            <tr>
                                <th>Holiday Name</th>
                                <th>Date</th>
                                <th>Type</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHolidays.map(hol => (
                                <tr key={hol.id}>
                                    <td>
                                        <div className="event-name-cell">
                                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '14px', color: '#64748b', border: '1px solid #e2e8f0' }}> <Calendar size={20} /> </div>
                                            <span style={{ fontSize: '15px' }}>{hol.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#64748b' }}>
                                        {new Date(hol.date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </td>
                                    <td>
                                        <span className="category-badge" style={{ 
                                            background: hol.type === 'GOVERNMENT' ? '#f0f9ff' : '#f0fdf4', 
                                            color: hol.type === 'GOVERNMENT' ? '#0369a1' : '#15803d',
                                            border: `1.5px solid ${hol.type === 'GOVERNMENT' ? '#bae6fd' : '#bbf7d0'}`
                                        }}>
                                            {hol.type}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button onClick={() => handleDelete(hol.id)} className="btn-action-purged">
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredHolidays.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '150px 0', textAlign: 'center' }}>
                                        <div style={{ color: '#e2e8f0', marginBottom: '20px' }}> <Globe size={80} /> </div>
                                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '4px' }}>No holidays found</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </main>

            {showModal && (
                <div className="modal-overlay-registry">
                    <div className="modal-box-registry">
                        <div style={{ padding: '40px', background: '#fcfcfc', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px' }}>ADD NEW HOLIDAY</h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>Add a new holiday to the calendar</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'white', border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}> <X size={22} /> </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '40px' }}>
                            <div className="input-group-premium">
                                <label className="label-premium">Holiday Name</label>
                                <input required className="input-premium" placeholder="e.g. New Year's Day" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="input-group-premium">
                                <label className="label-premium">Date</label>
                                <input type="date" required className="input-premium" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div className="input-group-premium" style={{ marginBottom: '40px' }}>
                                <label className="label-premium">Type</label>
                                <select className="input-premium" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    <option value="GOVERNMENT">Government Holiday</option>
                                    <option value="COMPANY">Company Holiday</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '20px', borderRadius: '20px', background: 'white', border: '2px solid #f1f5f9', color: '#64748b', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 2, padding: '20px', borderRadius: '20px', background: '#ea580c', border: 'none', color: 'white', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(234, 88, 12, 0.2)' }}>Save Holiday</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayManagement;
