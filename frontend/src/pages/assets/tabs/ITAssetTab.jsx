import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Search, Filter, ChevronDown, Trash2, Info } from 'lucide-react';
import { assetService } from '../../../services/assetService';
import LogHistoryTable, { addTableLog } from '../components/LogHistoryTable';
import Pagination from '../components/Pagination';

export default function ITAssetTab({ canEdit, data, onViewHistory }) {
    const [itAssets, setItAssets] = useState([]);

    useEffect(() => {
        if (data && data.length > 0) {
            const filtered = data.filter(item => (item.assetClass === 'IT Asset' || item.type === 'IT Asset'));
            if (filtered.length > 0) {
                setItAssets(filtered);
            }
        }
    }, [data]);

    const [newItAssetRows, setNewItAssetRows] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ems_itassets_drafts')) || []; } catch { return []; }
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [assetClassFilter, setAssetClassFilter] = useState('All');
    const [makeFilter, setMakeFilter] = useState('All');
    const [assetCodeFilter, setAssetCodeFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    // Source of truth is itAssets (which is synced with data)
    const effectiveAssets = itAssets;

    const departments = ['All', ...new Set(effectiveAssets.map(item => item.department).filter(Boolean).sort())];
    const assetClasses = ['All', ...new Set(effectiveAssets.map(item => item.assetClass).filter(Boolean).sort())];
    const makes = ['All', ...new Set(effectiveAssets.map(item => item.make).filter(Boolean).sort())];

    const filteredItAssets = useMemo(() => {
        return effectiveAssets.filter(row => {
            const matchesSearch = !searchQuery || Object.values(row).some(value => (value || '').toString().toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesDepartment = departmentFilter === 'All' || row.department === departmentFilter;
            const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
            const matchesAssetClass = assetClassFilter === 'All' || row.assetClass === assetClassFilter;
            const matchesMake = makeFilter === 'All' || row.make === makeFilter;
            const matchesAssetCode = !assetCodeFilter || (row.assetCode || '').toLowerCase().includes(assetCodeFilter.toLowerCase());
            const matchesUser = !userFilter || (row.user || '').toLowerCase().includes(userFilter.toLowerCase());

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

            return matchesSearch && matchesDepartment && matchesStatus && matchesAssetClass && matchesMake && matchesAssetCode && matchesUser && matchesDateRange;
        });
    }, [effectiveAssets, searchQuery, departmentFilter, statusFilter, assetClassFilter, makeFilter, assetCodeFilter, userFilter, startDate, endDate]);

    const paginatedAssets = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredItAssets.slice(start, start + pageSize);
    }, [filteredItAssets, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, departmentFilter, statusFilter, assetClassFilter, makeFilter, assetCodeFilter, userFilter, startDate, endDate]);


    const emptyRow = { assetClass: 'IT Asset', productName: '', assetCode: '', user: '', department: '', responsibility: '', make: '', model: '', description: '', status: 'Working', lastMaintenance: '', additionalSupport: '', remarks: '' };

    const saveAll = async () => {
        if (newItAssetRows.length === 0) return;
        const validRows = newItAssetRows.filter(r => r.assetCode);
        if (validRows.length === 0) return;
        
        try {
            const savedRows = [];
            for (const row of validRows) {
                const payload = { ...row, assetClass: 'IT Asset' };
                const created = await assetService.createCategoryAsset(payload);
                savedRows.push(created);
            }
            setItAssets(prev => [...savedRows, ...prev]);
            addTableLog('IT Asset', 'CREATED', `Multiple (${savedRows.length})`, `Added ${savedRows.length} new IT Assets.`);
            setNewItAssetRows([]);
        } catch (error) {
            console.error('Failed to save IT assets', error);
        }
    };

    const startEdit = (row, index) => {
        setEditingId(row.id || index); // Use ID if possible
        setEditFormData(row);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const saveEdit = async (index) => {
        const oldRow = itAssets.find((r, i) => (r.id && r.id === editingId) || i === index);
        if (!oldRow) return;

        const updatedRow = { ...editFormData, assetClass: 'IT Asset' };
        
        try {
            let result;
            if (oldRow.id) {
                result = await assetService.updateCategoryAsset(oldRow.id, updatedRow);
            } else {
                result = await assetService.createCategoryAsset(updatedRow);
            }

            // Calculate changes for logs
            const changes = [];
            const ignoreFields = ['id', 'tempId', 'createdAt', 'updatedAt'];

            Object.keys(updatedRow).forEach(key => {
                if (ignoreFields.includes(key)) return;
                const oldVal = (oldRow[key] || '').toString();
                const newVal = (updatedRow[key] || '').toString();
                if (oldVal !== newVal) {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase().trim();
                    changes.push({ field: label, old: oldVal, new: newVal });
                }
            });

            if (changes.length > 0) {
                addTableLog('IT Assets', 'MODIFIED', updatedRow.assetCode || 'Record', `Updated ${changes.length} fields.`, oldRow.id || result.id, changes);
            }

            setItAssets(prev => prev.map((r) => ((r.id && r.id === oldRow.id) || r === oldRow) ? result : r));
            setEditingId(null);
        } catch (error) {
            console.error('Failed to update IT asset', error);
        }
    };

    const deleteAsset = async (row, index) => {
        if (!window.confirm("Delete IT Asset record?")) return;
        try {
            if (row.id) {
                await assetService.deleteCategoryAsset(row.id);
            }
            setItAssets(prev => prev.filter((r) => r.id ? r.id !== row.id : r !== row));
            addTableLog('IT Asset', 'DELETED', row.assetCode || 'Unknown', 'Deleted IT Asset record.');
        } catch (error) {
            console.error('Failed to delete IT asset', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter Section */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, boxShadow: '0 8px 30px rgba(156,163,175,0.4)' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 200px' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search IT assets..." style={{ height: 38, width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px 0 36px', fontSize: 14 }} />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={{ height: 38, minWidth: 160, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', padding: '0 32px 0 12px', fontSize: 13, fontWeight: 600, appearance: 'none', color: '#334155' }}>
                            <option value="All">All Departments</option>
                            {departments.filter(d => d !== 'All').map(dep => <option key={dep} value={dep}>{dep}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 12, color: '#94a3b8', pointerEvents: 'none' }} />
                    </div>
                    <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{ height: 38, padding: '0 16px', background: showAdvancedFilters ? '#e2e8f0' : '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <Filter size={16} /> Filters
                    </button>
                    <div style={{ marginLeft: 'auto', background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 900, color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                        Total Records: <span style={{ color: '#0f172a' }}>{filteredItAssets.length}</span>
                    </div>
                </div>
                {showAdvancedFilters && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <input value={assetCodeFilter} onChange={(e) => setAssetCodeFilter(e.target.value)} placeholder="Asset Code..." style={{ height: 34, width: 140, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }} />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input value={userFilter} onChange={(e) => setUserFilter(e.target.value)} placeholder="User..." style={{ height: 34, width: 140, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }} />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <select value={assetClassFilter} onChange={(e) => setAssetClassFilter(e.target.value)} style={{ height: 34, minWidth: 140, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 28px 0 10px', fontSize: 12, fontWeight: 800, appearance: 'none', color: '#334155' }}>
                                <option value="All">Filter Class</option>
                                {assetClasses.filter(c => c !== 'All').map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: 10, color: '#94a3b8', pointerEvents: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>FROM</span>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ height: 34, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }} />
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>TO</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ height: 34, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }} />
                        </div>
                        {(assetCodeFilter || userFilter || assetClassFilter !== 'All' || startDate || endDate) && (
                            <button onClick={() => { setAssetCodeFilter(''); setUserFilter(''); setAssetClassFilter('All'); setStartDate(''); setEndDate(''); }} style={{ height: 34, padding: '0 12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={12} /> Clear</button>
                        )}
                    </div>
                )}
            </div>

            {/* Table Section */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(156,163,175,0.4)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="asset-dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1500 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                            <tr style={{ background: '#f8fafc' }}>
                                {['SL No', 'Created At', 'ASSET CLASS', 'PRODUCT NAME', 'ASSET CODE', 'USER', 'DEPARTMENT', 'RESPONSIBILITY', 'MAKE', 'MODEL', 'DESCRIPTION', 'STATUS', 'LAST MAINTENANCE', 'SUPPORT', 'Remarks'].map(head => (
                                    <th key={head} style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>{head}</th>
                                ))}
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* New Draft Rows */}
                            {canEdit && newItAssetRows.map((row, draftIndex) => (
                                <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f97316' }}>{draftIndex + 1}</td>
                                    <td style={{ padding: '10px 12px' }}><div className="asset-data-cell" style={{ background: '#fffaf5', color: '#ea580c', fontWeight: 700 }}>New Row</div></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.assetClass} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, assetClass: e.target.value } : r))} placeholder="Class" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.productName} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, productName: e.target.value } : r))} placeholder="Product" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.assetCode} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, assetCode: e.target.value } : r))} placeholder="Asset code" style={{ width: 130, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.user} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, user: e.target.value } : r))} placeholder="User" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.department} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, department: e.target.value } : r))} placeholder="Department" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.responsibility} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, responsibility: e.target.value } : r))} placeholder="Responsibility" style={{ width: 130, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.make} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, make: e.target.value } : r))} placeholder="Make" style={{ width: 100, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.model} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, model: e.target.value } : r))} placeholder="Model" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.description} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, description: e.target.value } : r))} placeholder="Description" style={{ width: 180, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <select value={row.status} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, status: e.target.value } : r))} style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }}>
                                            <option value="Working">Working</option>
                                            <option value="Not Working">Not Working</option>
                                            <option value="Scrap">Scrap</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.lastMaintenance} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, lastMaintenance: e.target.value } : r))} placeholder="Last maintenance" style={{ width: 130, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.additionalSupport} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, additionalSupport: e.target.value } : r))} placeholder="Support" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.remarks} onChange={(e) => setNewItAssetRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, remarks: e.target.value } : r))} placeholder="Remarks" style={{ width: 140, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <button onClick={() => setNewItAssetRows(prev => prev.filter(r => r.tempId !== row.tempId))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                    </td>
                                </tr>
                            ))}

                            {/* Existing Rows */}
                            {paginatedAssets.map((row, index) => {
                                const globalIndex = (currentPage - 1) * pageSize + index;
                                return (
                                <tr key={globalIndex} style={{ borderBottom: '1px solid #edf2f7' }}>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell">{canEdit ? newItAssetRows.length + globalIndex + 1 : globalIndex + 1}</div></td>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ border: 'none', background: '#f8fafc', color: '#64748b' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</div></td>
                                    {editingId === index ? (
                                        <>
                                            <td style={{ padding: '8px' }}><input value={editFormData.assetClass} onChange={e => setEditFormData({...editFormData, assetClass: e.target.value})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.productName} onChange={e => setEditFormData({...editFormData, productName: e.target.value})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.assetCode} onChange={e => setEditFormData({...editFormData, assetCode: e.target.value})} style={{ width: 110, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.user} onChange={e => setEditFormData({...editFormData, user: e.target.value})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.department} onChange={e => setEditFormData({...editFormData, department: e.target.value})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.responsibility} onChange={e => setEditFormData({...editFormData, responsibility: e.target.value})} style={{ width: 110, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.make} onChange={e => setEditFormData({...editFormData, make: e.target.value})} style={{ width: 90, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.model} onChange={e => setEditFormData({...editFormData, model: e.target.value})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} style={{ width: 130, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}>
                                                <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6' }}>
                                                    <option value="Working">Working</option>
                                                    <option value="Not Working">Not Working</option>
                                                    <option value="Scrap">Scrap</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.lastMaintenance} onChange={e => setEditFormData({...editFormData, lastMaintenance: e.target.value})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.additionalSupport} onChange={e => setEditFormData({...editFormData, additionalSupport: e.target.value})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.remarks} onChange={e => setEditFormData({...editFormData, remarks: e.target.value})} style={{ width: 110, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => saveEdit(index)} style={{ padding: '4px 8px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>Save</button>
                                                    <button onClick={cancelEdit} style={{ padding: '4px 8px', borderRadius: 6, background: '#94a3b8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>X</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ fontWeight: 800 }}>{row.assetClass}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.productName}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ fontWeight: 900 }}>{row.assetCode}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.user}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.department}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.responsibility}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.make}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.model}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.description}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.status}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.lastMaintenance || '-'}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.additionalSupport || '-'}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.remarks || '-'}</div></td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <button onClick={() => onViewHistory && onViewHistory(row)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }} title="View row history"><Info size={14} /></button>
                                                    {canEdit && (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button onClick={() => startEdit(row, index)} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', borderRadius: 8, padding: '6px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }}>Edit</button>
                                                            <button onClick={() => deleteAsset(row, globalIndex)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '6px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }}>Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Actions */}
                {canEdit && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                        <button onClick={() => setNewItAssetRows(prev => [...prev, { tempId: Date.now() + Math.random(), ...emptyRow }])} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <Plus size={14} /> ADD ROW
                        </button>
                        
                        <Pagination 
                            currentPage={currentPage}
                            totalItems={filteredItAssets.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />

                        {newItAssetRows.length > 0 && (
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
