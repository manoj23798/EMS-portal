import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PerformanceAPI, EmployeeAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';

export default function ServiceRegisterList() {
    const role = tokenManager.getUserRole();
    const canCreate = role === 'ADMIN' || role === 'HR' || role === 'PROJECT_MANAGER';
    
    const [entries, setEntries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    
    const [filters, setFilters] = useState({
        category: '',
        startDate: '',
        endDate: '',
        reportedBy: ''
    });
    
    const [newEntry, setNewEntry] = useState({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        natureOfAction: '',
        description: '',
        category: 'GOOD',
        reportedBy: tokenManager.getUserData()?.username || '',
        remarks: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [regRes, empRes] = await Promise.all([
                PerformanceAPI.getAllServiceRegisters(),
                EmployeeAPI.getAll()
            ]);
            const sortedEntries = (regRes.data || []).sort((a, b) => b.id - a.id);
            setEntries(sortedEntries);
            setEmployees(empRes.data);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await PerformanceAPI.createServiceRegister(newEntry);
            setShowModal(false);
            loadData();
            setNewEntry({
                employeeId: '',
                date: new Date().toISOString().split('T')[0],
                natureOfAction: '',
                description: '',
                category: 'GOOD',
                reportedBy: tokenManager.getUserData()?.username || '',
                remarks: ''
            });
        } catch (error) {
            console.error("Failed to save entry", error);
            alert("Failed to save entry. Please check the details.");
        }
    };

    const getEmployeeName = (id) => {
        const emp = employees.find(e => e.id === Number(id));
        return emp ? `${emp.firstName} ${emp.lastName}` : `EMP-${id}`;
    };

    const filteredEntries = entries.filter(entry => {
        const name = getEmployeeName(entry.employeeId).toLowerCase();
        const matchesSearch = name.includes(search.toLowerCase());
        const matchesCategory = !filters.category || entry.category === filters.category;
        const matchesReportedBy = !filters.reportedBy || entry.reportedBy.toLowerCase().includes(filters.reportedBy.toLowerCase());
        
        const entryDate = new Date(entry.date);
        const matchesStartDate = !filters.startDate || entryDate >= new Date(filters.startDate);
        const matchesEndDate = !filters.endDate || entryDate <= new Date(filters.endDate);

        return matchesSearch && matchesCategory && matchesReportedBy && matchesStartDate && matchesEndDate;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>Service Register</h1>
                </div>
                {canCreate && (
                    <button 
                        onClick={() => setShowModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}
                    >
                        <Plus size={18} /> Add Entry
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8' }} />
                        <input 
                            value={search} onChange={e => setSearch(e.target.value)} 
                            placeholder="Search by Employee Name..." 
                            style={{ width: '100%', height: 38, padding: '0 12px 0 36px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} 
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ padding: '0 16px', height: 38, background: showFilters ? '#fff7ed' : '#f8fafc', border: `1px solid ${showFilters ? '#f97316' : '#cbd5e1'}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: showFilters ? '#f97316' : '#475569', cursor: 'pointer' }}
                    >
                        <Filter size={16} /> {showFilters ? 'Hide Filters' : 'Filters'}
                    </button>
                    {(filters.category || filters.startDate || filters.endDate || filters.reportedBy) && (
                        <button 
                            onClick={() => setFilters({ category: '', startDate: '', endDate: '', reportedBy: '' })}
                            style={{ padding: '0 12px', height: 38, background: '#fff', border: '1px solid #fee2e2', color: '#ef4444', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >Clear</button>
                    )}
                </div>

                {showFilters && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: '12px 0', borderTop: '1px solid #f1f5f9', marginBottom: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>CATEGORY</label>
                            <select 
                                value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}
                                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 13 }}
                            >
                                <option value="">All Categories</option>
                                <option value="GOOD">Good (Appreciation)</option>
                                <option value="BAD">Bad (Issue)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>START DATE</label>
                            <input 
                                type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})}
                                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 13 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>END DATE</label>
                            <input 
                                type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})}
                                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 13 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>REPORTED BY</label>
                            <input 
                                value={filters.reportedBy} onChange={e => setFilters({...filters, reportedBy: e.target.value})}
                                placeholder="Search reporter..."
                                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 13 }}
                            />
                        </div>
                    </div>
                )}

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, width: 50 }}>#</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Employee</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Date</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Nature</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, width: 250 }}>Description</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800 }}>Category</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Reported By</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Created At</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading entries...</td></tr>
                            ) : filteredEntries.length === 0 ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No entries found.</td></tr>
                            ) : filteredEntries.map((entry, index) => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: 13, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '10px 16px', color: '#64748b' }}>{index + 1}</td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{getEmployeeName(entry.employeeId)}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>ID: {entry.employeeId}</div>
                                    </td>
                                    <td style={{ padding: '10px 16px', color: '#475569' }}>{entry.date}</td>
                                    <td style={{ padding: '10px 16px', fontStyle: 'italic', color: '#1e293b' }}>{entry.natureOfAction}</td>
                                    <td style={{ padding: '10px 16px', color: '#475569' }}>{entry.description}</td>
                                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 800,
                                            background: entry.category === 'GOOD' ? '#dcfce7' : '#fee2e2',
                                            color: entry.category === 'GOOD' ? '#166534' : '#991b1b',
                                            display: 'inline-flex', alignItems: 'center', gap: 4
                                        }}>
                                            {entry.category === 'GOOD' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {entry.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 16px', color: '#475569', fontWeight: 500 }}>{entry.reportedBy}</td>
                                    <td style={{ padding: '10px 16px', color: '#64748b', fontSize: 12 }}>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '-'}</td>
                                    <td style={{ padding: '10px 16px', color: '#64748b' }}>{entry.remarks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Entry Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: 550, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Add Service Register Entry</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Employee</label>
                                    <select 
                                        required
                                        value={newEntry.employeeId} 
                                        onChange={e => setNewEntry({...newEntry, employeeId: e.target.value})}
                                        style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} (ID: {emp.id})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Date</label>
                                    <input 
                                        type="date" required
                                        value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                                        style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Nature of Action</label>
                                <input 
                                    required placeholder="e.g. Client Appreciation, Late Reporting..."
                                    value={newEntry.natureOfAction} onChange={e => setNewEntry({...newEntry, natureOfAction: e.target.value})}
                                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Category</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {['GOOD', 'BAD'].map(cat => (
                                        <label key={cat} style={{ 
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 8, cursor: 'pointer',
                                            border: `2px solid ${newEntry.category === cat ? (cat === 'GOOD' ? '#22c55e' : '#ef4444') : '#e2e8f0'}`,
                                            background: newEntry.category === cat ? (cat === 'GOOD' ? '#f0fdf4' : '#fef2f2') : '#fff',
                                            color: newEntry.category === cat ? (cat === 'GOOD' ? '#166534' : '#991b1b') : '#64748b',
                                            fontWeight: 700, transition: 'all 0.2s'
                                        }}>
                                            <input 
                                                type="radio" name="category" value={cat} checked={newEntry.category === cat}
                                                onChange={() => setNewEntry({...newEntry, category: cat})}
                                                style={{ display: 'none' }}
                                            />
                                            {cat === 'GOOD' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                            {cat === 'GOOD' ? 'Good Performance' : 'Bad / Issue'}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Description</label>
                                <textarea 
                                    required rows={3} placeholder="Provide details about the behavior or action..."
                                    value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})}
                                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', resize: 'vertical' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Reported By</label>
                                <input 
                                    required
                                    value={newEntry.reportedBy} onChange={e => setNewEntry({...newEntry, reportedBy: e.target.value})}
                                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Remarks (Optional)</label>
                                <input 
                                    value={newEntry.remarks} onChange={e => setNewEntry({...newEntry, remarks: e.target.value})}
                                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, height: 44, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 2, height: 44, borderRadius: 8, border: 'none', background: '#f97316', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                                    <Save size={18} /> Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

