import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Search, Info, Trash2 } from 'lucide-react';
import { assetService } from '../../../services/assetService';
import LogHistoryTable, { addTableLog } from '../components/LogHistoryTable';
import Pagination from '../components/Pagination';

export default function NOCTeamTab({ canEdit, data, onViewHistory }) {
    const [safetyRows, setSafetyRows] = useState([]);
    const [toolRows, setToolRows] = useState([]);

    useEffect(() => {
        if (data && data.length > 0) {
            const safety = data.filter(item => item.assetClass === 'NOC Safety' || (item.assetClass === 'NOC Team' && (item.productName?.toLowerCase().includes('safety') || item.type?.toLowerCase().includes('safety'))));
            const tools = data.filter(item => item.assetClass === 'NOC Tools' || item.assetClass === 'NOC Team' || (item.assetClass === 'NOC Team' && (item.productName?.toLowerCase().includes('tool') || item.type?.toLowerCase().includes('tool'))));
            
            if (safety.length > 0) setSafetyRows(safety);
            if (tools.length > 0) setToolRows(tools);
        }
    }, [data]);

    const [newSafetyRows, setNewSafetyRows] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ems_noc_safety_drafts')) || []; } catch { return []; }
    });

    const [newToolRows, setNewToolRows] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ems_noc_tools_drafts')) || []; } catch { return []; }
    });

    const [editingSafetyId, setEditingSafetyId] = useState(null);
    const [editSafetyData, setEditSafetyData] = useState({});

    const [editingToolId, setEditingToolId] = useState(null);
    const [editToolData, setEditToolData] = useState({});

    // Pagination
    const [safetyPage, setSafetyPage] = useState(1);
    const [toolPage, setToolPage] = useState(1);
    const pageSize = 8;

    // Sync with backend data if provided
    const effectiveSafety = safetyRows;
    const effectiveTools = toolRows;


    const emptySafetyRow = { particulers: '', brand: '', qty: 0 };
    const emptyToolRow = { name: '', using: '', stock: '' };

    const [searchSafety, setSearchSafety] = useState('');
    const [searchTools, setSearchTools] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const applyFilters = (row, search) => {
        const matchesSearch = !search || Object.values(row).some(val => (val || '').toString().toLowerCase().includes(search.toLowerCase()));
        
        const rowDate = row.createdAt ? new Date(row.createdAt) : null;
        let matchesDateRange = true;
        if (rowDate) {
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (rowDate < start) matchesDateRange = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (rowDate > end) matchesDateRange = false;
            }
        } else if (startDate || endDate) {
            matchesDateRange = false;
        }

        return matchesSearch && matchesDateRange;
    };

    const filteredTools = useMemo(() => {
        return effectiveTools.filter(row => applyFilters(row, searchTools));
    }, [effectiveTools, searchTools, startDate, endDate]);

    const filteredSafety = useMemo(() => {
        return effectiveSafety.filter(row => applyFilters(row, searchSafety));
    }, [effectiveSafety, searchSafety, startDate, endDate]);

    const paginatedSafety = useMemo(() => {
        const start = (safetyPage - 1) * pageSize;
        return filteredSafety.slice(start, start + pageSize);
    }, [filteredSafety, safetyPage]);

    const paginatedTools = useMemo(() => {
        const start = (toolPage - 1) * pageSize;
        return filteredTools.slice(start, start + pageSize);
    }, [filteredTools, toolPage]);

    useEffect(() => { setSafetyPage(1); }, [searchSafety, startDate, endDate]);
    useEffect(() => { setToolPage(1); }, [searchTools, startDate, endDate]);

    const saveSafetyDrafts = async () => {
        if (newSafetyRows.length === 0) return;
        const validRows = newSafetyRows.filter(r => r.particulers);
        if (validRows.length === 0) return;
        try {
            const savedRows = [];
            for (const row of validRows) {
                const payload = { ...row, assetClass: 'NOC Safety', productName: row.particulers, make: row.brand, quantity: Number(row.qty || 0) };
                const created = await assetService.createCategoryAsset(payload);
                savedRows.push(created);
            }
            setSafetyRows(prev => [...savedRows, ...prev]);
            addTableLog('NOC Team', 'CREATED', `Multiple Safety (${savedRows.length})`, `Added ${savedRows.length} new Safety Equipments.`);
            setNewSafetyRows([]);
        } catch (error) {
            console.error('Failed to save safety drafts', error);
        }
    };

    const saveToolsDrafts = async () => {
        if (newToolRows.length === 0) return;
        const validRows = newToolRows.filter(r => r.name);
        if (validRows.length === 0) return;
        try {
            const savedRows = [];
            for (const row of validRows) {
                const payload = { ...row, assetClass: 'NOC Tools', productName: row.name, responsibility: row.using, quantity: row.stock };
                const created = await assetService.createCategoryAsset(payload);
                savedRows.push(created);
            }
            setToolRows(prev => [...savedRows, ...prev]);
            addTableLog('NOC Team', 'CREATED', `Multiple Tools (${savedRows.length})`, `Added ${savedRows.length} new NOC Tools.`);
            setNewToolRows([]);
        } catch (error) {
            console.error('Failed to save tools drafts', error);
        }
    };

    const startEditSafety = (row, index) => {
        setEditingSafetyId(row.id || index);
        setEditSafetyData(row);
    };

    const saveEditSafety = async (index) => {
        const oldRow = safetyRows.find((r, i) => (r.id && r.id === editingSafetyId) || i === index);
        if (!oldRow) return;

        const updatedRow = { ...editSafetyData, assetClass: 'NOC Safety', productName: editSafetyData.particulers, make: editSafetyData.brand, quantity: Number(editSafetyData.qty || 0) };
        try {
            let result;
            if (oldRow.id) {
                result = await assetService.updateCategoryAsset(oldRow.id, updatedRow);
            } else {
                result = await assetService.createCategoryAsset(updatedRow);
            }

            const changes = [];
            Object.keys(updatedRow).forEach(key => {
                if (['id', 'tempId', 'createdAt', 'updatedAt'].includes(key)) return;
                const oldVal = (oldRow[key] || '').toString();
                const newVal = (updatedRow[key] || '').toString();
                if (oldVal !== newVal) {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase().trim();
                    changes.push({ field: label, old: oldVal, new: newVal });
                }
            });
            if (changes.length > 0) {
                addTableLog('NOC Team', 'MODIFIED', updatedRow.particulers || 'Safety Record', `Updated ${changes.length} fields.`, oldRow.id || result.id, changes);
            }
            setSafetyRows(prev => prev.map((r) => ((r.id && r.id === oldRow.id) || r === oldRow) ? result : r));
            setEditingSafetyId(null);
        } catch (error) {
            console.error('Failed to update safety record', error);
        }
    };

    const deleteSafety = async (row, index) => {
        if (!window.confirm("Delete safety record?")) return;
        try {
            if (row.id) {
                await assetService.deleteCategoryAsset(row.id);
            }
            setSafetyRows(prev => prev.filter((r) => r.id ? r.id !== row.id : r !== row));
            addTableLog('NOC Team', 'DELETED', row.particulers || 'Unknown', 'Deleted Safety Equipment record.');
        } catch (error) {
            console.error('Failed to delete safety record', error);
        }
    };

    const startEditTool = (row, index) => {
        setEditingToolId(row.id || index);
        setEditToolData(row);
    };

    const saveEditTool = async (index) => {
        const oldRow = toolRows.find((r, i) => (r.id && r.id === editingToolId) || i === index);
        if (!oldRow) return;

        const updatedRow = { ...editToolData, assetClass: 'NOC Tools', productName: editToolData.name, responsibility: editToolData.using, quantity: editToolData.stock };
        try {
            let result;
            if (oldRow.id) {
                result = await assetService.updateCategoryAsset(oldRow.id, updatedRow);
            } else {
                result = await assetService.createCategoryAsset(updatedRow);
            }

            const changes = [];
            Object.keys(updatedRow).forEach(key => {
                if (['id', 'tempId', 'createdAt', 'updatedAt'].includes(key)) return;
                const oldVal = (oldRow[key] || '').toString();
                const newVal = (updatedRow[key] || '').toString();
                if (oldVal !== newVal) {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase().trim();
                    changes.push({ field: label, old: oldVal, new: newVal });
                }
            });
            if (changes.length > 0) {
                addTableLog('NOC Team', 'MODIFIED', updatedRow.name || 'Tool Record', `Updated ${changes.length} fields.`, oldRow.id || result.id, changes);
            }
            setToolRows(prev => prev.map((r) => ((r.id && r.id === oldRow.id) || r === oldRow) ? result : r));
            setEditingToolId(null);
        } catch (error) {
            console.error('Failed to update tool record', error);
        }
    };

    const deleteTool = async (row, index) => {
        if (!window.confirm("Delete tool record?")) return;
        try {
            if (row.id) {
                await assetService.deleteCategoryAsset(row.id);
            }
            setToolRows(prev => prev.filter((r) => r.id ? r.id !== row.id : r !== row));
            addTableLog('NOC Team', 'DELETED', row.name || 'Unknown', 'Deleted NOC Tool record.');
        } catch (error) {
            console.error('Failed to delete tool record', error);
        }
    };

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            {/* Date Filters Header */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '12px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 4px 20px rgba(156,163,175,0.1)' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date Range Filter:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>FROM</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ height: 34, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>TO</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ height: 34, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }} />
                </div>
                {(startDate || endDate) && (
                    <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ height: 34, padding: '0 12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Clear Date Filter</button>
                )}
            </div>
            {/* Safety Equipments */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(156,163,175,0.4)' }}>
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 900, color: '#0f172a' }}>Safety Equipements</div>
                    <div style={{ position: 'relative', width: '100%', maxWidth: 260 }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                        <input value={searchSafety} onChange={(e) => setSearchSafety(e.target.value)} placeholder="Search safety equipements..." style={{ height: 38, width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px 0 36px', fontSize: 13 }} />
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 900, color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                        Total Records: <span style={{ color: '#0f172a' }}>{filteredSafety.length}</span>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="asset-dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>S.No</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Created At</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Particulers</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Brand</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Qty</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {canEdit && newSafetyRows.map((row, draftIndex) => (
                                <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f97316' }}>{draftIndex + 1}</td>
                                    <td style={{ padding: '10px 12px' }}><div className="asset-data-cell" style={{ background: '#fffaf5', color: '#ea580c', fontWeight: 700 }}>New Row</div></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.particulers} onChange={(e) => setNewSafetyRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, particulers: e.target.value } : r))} style={{ width: '100%', height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.brand} onChange={(e) => setNewSafetyRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, brand: e.target.value } : r))} style={{ width: '100%', height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input type="number" value={row.qty} onChange={(e) => setNewSafetyRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, qty: Number(e.target.value) } : r))} style={{ width: 100, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><button onClick={() => setNewSafetyRows(prev => prev.filter(r => r.tempId !== row.tempId))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button></td>
                                </tr>
                            ))}
                            {paginatedSafety.map((row, index) => {
                                const globalIndex = (safetyPage - 1) * pageSize + index;
                                return (
                                <tr key={globalIndex} style={{ borderBottom: '1px solid #edf2f7' }}>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell">{canEdit ? newSafetyRows.length + globalIndex + 1 : globalIndex + 1}</div></td>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ border: 'none', background: '#f8fafc', color: '#64748b' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</div></td>
                                    {editingSafetyId === globalIndex ? (
                                        <>
                                            <td style={{ padding: '8px' }}><input value={editSafetyData.particulers} onChange={e => setEditSafetyData({...editSafetyData, particulers: e.target.value})} style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editSafetyData.brand} onChange={e => setEditSafetyData({...editSafetyData, brand: e.target.value})} style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input type="number" value={editSafetyData.qty} onChange={e => setEditSafetyData({...editSafetyData, qty: Number(e.target.value)})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => saveEditSafety(index)} style={{ padding: '4px 8px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>Save</button>
                                                    <button onClick={() => setEditingSafetyId(null)} style={{ padding: '4px 8px', borderRadius: 6, background: '#94a3b8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>X</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.particulers || row.productName || '-'}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.brand || row.make || '-'}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.qty || row.quantity || 0}</div></td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <button onClick={() => onViewHistory && onViewHistory(row)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }} title="View row history"><Info size={14} /></button>
                                                    {canEdit && (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button onClick={() => startEditSafety(row, index)} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }}>Edit</button>
                                                            <button onClick={() => deleteSafety(row, globalIndex)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }}>Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {canEdit && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                        <button onClick={() => setNewSafetyRows(prev => [...prev, { tempId: Date.now() + Math.random(), ...emptySafetyRow }])} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <Plus size={14} /> ADD ROW
                        </button>
                        
                        <Pagination 
                            currentPage={safetyPage}
                            totalItems={filteredSafety.length}
                            pageSize={pageSize}
                            onPageChange={setSafetyPage}
                        />

                        {newSafetyRows.length > 0 && (
                            <button onClick={saveSafetyDrafts} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#fff', color: '#16a34a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <Save size={14} /> Save All
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* NOC Usage / Stock Tools */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(156,163,175,0.4)' }}>
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 900, color: '#0f172a' }}>NOC Team Tools & Usage</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative', width: 260 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                            <input value={searchTools} onChange={(e) => setSearchTools(e.target.value)} placeholder="Search tools..." style={{ height: 38, width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px 0 36px', fontSize: 13 }} />
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 900, color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                            Total Records: <span style={{ color: '#0f172a' }}>{filteredTools.length}</span>
                        </div>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="asset-dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>SNO</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Created At</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Using</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Stock</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {canEdit && newToolRows.map((row, draftIndex) => (
                                <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f97316' }}>{draftIndex + 1}</td>
                                    <td style={{ padding: '10px 12px' }}><div className="asset-data-cell" style={{ background: '#fffaf5', color: '#ea580c', fontWeight: 700 }}>New Row</div></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.name} onChange={(e) => setNewToolRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, name: e.target.value } : r))} style={{ width: '100%', height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.using} onChange={(e) => setNewToolRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, using: e.target.value } : r))} style={{ width: '100%', height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.stock} onChange={(e) => setNewToolRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, stock: e.target.value } : r))} style={{ width: '100%', height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><button onClick={() => setNewToolRows(prev => prev.filter(r => r.tempId !== row.tempId))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button></td>
                                </tr>
                            ))}
                            {paginatedTools.map((row, index) => {
                                const globalIndex = (toolPage - 1) * pageSize + index;
                                return (
                                <tr key={globalIndex} style={{ borderBottom: '1px solid #edf2f7' }}>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell">{canEdit ? newToolRows.length + globalIndex + 1 : globalIndex + 1}</div></td>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ border: 'none', background: '#f8fafc', color: '#64748b' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</div></td>
                                    {editingToolId === globalIndex ? (
                                        <>
                                            <td style={{ padding: '8px' }}><input value={editToolData.name} onChange={e => setEditToolData({...editToolData, name: e.target.value})} style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editToolData.using} onChange={e => setEditToolData({...editToolData, using: e.target.value})} style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editToolData.stock} onChange={e => setEditToolData({...editToolData, stock: e.target.value})} style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => saveEditTool(index)} style={{ padding: '4px 8px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>Save</button>
                                                    <button onClick={() => setEditingToolId(null)} style={{ padding: '4px 8px', borderRadius: 6, background: '#94a3b8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>X</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.name || row.productName || '-'}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.using || row.responsibility || '-'}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.stock || row.quantity || '-'}</div></td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <button onClick={() => onViewHistory && onViewHistory(row)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }} title="View row history"><Info size={14} /></button>
                                                    {canEdit && (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button onClick={() => startEditTool(row, index)} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }}>Edit</button>
                                                            <button onClick={() => deleteTool(row, globalIndex)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }}>Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {canEdit && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                        <button onClick={() => setNewToolRows(prev => [...prev, { tempId: Date.now() + Math.random(), ...emptyToolRow }])} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <Plus size={14} /> ADD ROW
                        </button>
                        
                        <Pagination 
                            currentPage={toolPage}
                            totalItems={filteredTools.length}
                            pageSize={pageSize}
                            onPageChange={setToolPage}
                        />

                        {newToolRows.length > 0 && (
                            <button onClick={saveToolsDrafts} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#fff', color: '#16a34a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <Save size={14} /> Save All
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
