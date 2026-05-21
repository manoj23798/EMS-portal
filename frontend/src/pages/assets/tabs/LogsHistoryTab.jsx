import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Search, History } from 'lucide-react';

export default function LogsHistoryTab({ canEdit }) {
    const [logs, setLogs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ems_logs_history_data')) || []; } catch { return []; }
    });
    const [newLogs, setNewLogs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ems_logs_history_data_drafts')) || []; } catch { return []; }
    });

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        localStorage.setItem('ems_logs_history_data', JSON.stringify(logs));
    }, [logs]);

    useEffect(() => {
        localStorage.setItem('ems_logs_history_data_drafts', JSON.stringify(newLogs));
    }, [newLogs]);

    const emptyRow = { date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), tableId: 'Asset Inventory', details: '', remarks: '' };

    const saveAll = () => {
        if (newLogs.length === 0) return;
        const validRows = newLogs.filter(r => r.details);
        if (validRows.length === 0) return;
        setLogs(prev => [...validRows, ...prev]);
        setNewLogs([]);
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(row => {
            if (!searchQuery) return true;
            return Object.values(row).some(val => (val || '').toString().toLowerCase().includes(searchQuery.toLowerCase()));
        });
    }, [logs, searchQuery]);

    const availableTables = ['Asset Inventory', 'Server', 'IT Asset', 'Fixtures', 'Stock Maintenance', 'NOC Team', 'Maintenance Schedule', 'Others'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 200px' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search logs..." style={{ height: 38, width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px 0 36px', fontSize: 14 }} />
                    </div>
                </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <div style={{ overflowX: 'auto' }}>
                    <table className="asset-dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                            <tr style={{ background: '#f8fafc' }}>
                                {['SL No', 'Date', 'Time', 'Category / Table', 'Event / Item Details', 'Remarks', 'Actions'].map(head => (
                                    <th key={head} style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>{head}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {canEdit && newLogs.map((row, draftIndex) => (
                                <tr key={row.tempId} style={{ borderBottom: '1px solid #dbeafe', background: '#f8fbff' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#2563eb' }}>{draftIndex + 1}</td>
                                    <td style={{ padding: '10px 12px' }}><input type="date" value={row.date} onChange={(e) => setNewLogs(prev => prev.map(r => r.tempId === row.tempId ? { ...r, date: e.target.value } : r))} style={{ width: 130, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input type="time" value={row.time} onChange={(e) => setNewLogs(prev => prev.map(r => r.tempId === row.tempId ? { ...r, time: e.target.value } : r))} style={{ width: 110, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <select value={row.tableId} onChange={(e) => setNewLogs(prev => prev.map(r => r.tempId === row.tempId ? { ...r, tableId: e.target.value } : r))} style={{ height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px', minWidth: 150 }}>
                                            {availableTables.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.details} onChange={(e) => setNewLogs(prev => prev.map(r => r.tempId === row.tempId ? { ...r, details: e.target.value } : r))} placeholder="Log details (e.g. Added 5 laptops)" style={{ width: '100%', height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.remarks} onChange={(e) => setNewLogs(prev => prev.map(r => r.tempId === row.tempId ? { ...r, remarks: e.target.value } : r))} placeholder="Remarks" style={{ width: '100%', minWidth: 150, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <button onClick={() => setNewLogs(prev => prev.filter(r => r.tempId !== row.tempId))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.map((row, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #edf2f7' }}>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell">{canEdit ? newLogs.length + index + 1 : index + 1}</div></td>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ fontWeight: 900 }}>{row.date || '-'}</div></td>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.time || '-'}</div></td>
                                    <td style={{ padding: '12px' }}>
                                        <div className="asset-data-cell" style={{ fontWeight: 800, color: '#334155' }}>
                                            <span style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>{row.tableId || '-'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.details || '-'}</div></td>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.remarks || '-'}</div></td>
                                    <td style={{ padding: '12px' }}>
                                        {canEdit && <button onClick={() => setLogs(prev => prev.filter((_, i) => i !== index))} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Delete</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {canEdit && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                        <button onClick={() => setNewLogs(prev => [...prev, { tempId: Date.now() + Math.random(), ...emptyRow }])} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <Plus size={14} /> NEW RECORD
                        </button>
                        {newLogs.length > 0 && (
                            <button onClick={saveAll} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#fff', color: '#16a34a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <Save size={14} /> Save All
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
