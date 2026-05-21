import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Search, Info, Trash2 } from 'lucide-react';
import LogHistoryTable, { addTableLog } from '../components/LogHistoryTable';
import Pagination from '../components/Pagination';
import DynamicTables from './DynamicTables';
import { assetService } from '../../../services/assetService';

export default function StockMaintenanceTab({ canEdit, data, onViewHistory }) {
    const categories = [
        { id: 'Ram', p1: 'Type of Ram & MB', p2: 'NAME' },
        { id: 'HDD', p1: 'Type of HDD', p2: 'Capacity' },
        { id: 'Drive', p1: 'Materials', p2: 'NAME' },
        { id: 'Wifi Adapter', p1: 'Meterials', p2: 'Name' },
        { id: 'Mobiles', p1: 'Meterials', p2: 'Name' },
        { id: 'GPS Tracker', p1: 'Materials', p2: 'Name' },
        { id: 'Devices', p1: 'Meterials', p2: 'Name' },
        { id: 'Network Switch & Router', p1: 'Meterials', p2: 'Name' },
        { id: 'Tools', p1: 'Materials', p2: 'Tools Name' },
        { id: 'Other Equipments', p1: 'Materials', p2: 'Name' }
    ];

    const [activeSection, setActiveSection] = useState(() => {
        return localStorage.getItem('ems_stock_active_section') || categories[0].id;
    });

    const [stockData, setStockData] = useState({});

    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            setStockData(data);
        }
    }, [data]);

    const itemsBySection = useMemo(() => {
        return stockData[activeSection] || [];
    }, [stockData, activeSection]);

    const [newRows, setNewRows] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    useEffect(() => {
        localStorage.setItem('ems_stock_active_section', activeSection);
    }, [activeSection]);

    const emptyRow = { prop1: '', prop2: '', qty: 0, status: 'New', remarks: '' };
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const saveDrafts = async () => {
        const drafts = newRows[activeSection] || [];
        if (drafts.length === 0) return;
        
        const validRows = drafts.filter(r => r.prop1 || r.prop2);
        if (validRows.length === 0) return;

        try {
            const savedItems = [];
            for (const row of validRows) {
                const payload = {
                    sectionName: activeSection,
                    itemName: row.prop2,
                    specification: row.prop1,
                    quantity: Number(row.qty || 0),
                    status: row.status || 'New',
                    remarks: row.remarks || ''
                };
                const created = await assetService.createStockItem(payload);
                savedItems.push({
                    ...created,
                    prop1: created.specification,
                    prop2: created.itemName,
                    qty: created.quantity
                });
            }

            setStockData(prev => ({
                ...prev,
                [activeSection]: [...savedItems, ...(prev[activeSection] || [])]
            }));
            
            addTableLog('Stock Maintenance', 'CREATED', `Multiple (${validRows.length})`, `Added ${validRows.length} new records to ${activeSection}.`);
            
            setNewRows(prev => ({
                ...prev,
                [activeSection]: []
            }));
        } catch (error) {
            console.error("Failed to save stock items to backend", error);
            alert("Failed to save some items. Please try again.");
        }
    };

    const addDraftRow = () => {
        setNewRows(prev => ({
            ...prev,
            [activeSection]: [...(prev[activeSection] || []), { tempId: Date.now() + Math.random(), ...emptyRow }]
        }));
    };

    const removeDraftRow = (tempId) => {
        setNewRows(prev => ({
            ...prev,
            [activeSection]: prev[activeSection].filter(r => r.tempId !== tempId)
        }));
    };

    const updateDraftRow = (tempId, field, value) => {
        setNewRows(prev => ({
            ...prev,
            [activeSection]: prev[activeSection].map(r => r.tempId === tempId ? { ...r, [field]: value } : r)
        }));
    };

    const startEdit = (row, index) => {
        setEditingId(index);
        setEditFormData(row);
    };

    const saveEdit = async (index) => {
        const oldRow = itemsBySection[index];
        const updatedRow = { ...editFormData };
        
        try {
            const payload = {
                id: updatedRow.id,
                sectionName: activeSection,
                itemName: updatedRow.prop2,
                specification: updatedRow.prop1,
                quantity: Number(updatedRow.qty || 0),
                status: updatedRow.status || oldRow.status,
                remarks: updatedRow.remarks || oldRow.remarks
            };

            const saved = await assetService.updateStockItem(updatedRow.id, payload);
            const normalizedSaved = {
                ...saved,
                prop1: saved.specification,
                prop2: saved.itemName,
                qty: saved.quantity
            };

            setStockData(prev => ({
                ...prev,
                [activeSection]: prev[activeSection].map((r, i) => i === index ? normalizedSaved : r)
            }));

            // Log changes
            const changes = [];
            const fieldsToCompare = ['prop1', 'prop2', 'qty', 'status', 'remarks'];
            fieldsToCompare.forEach(key => {
                const oldVal = (oldRow[key] || '').toString();
                const newVal = (normalizedSaved[key] || '').toString();
                if (oldVal !== newVal) {
                    let label = key === 'prop1' ? (currentCat?.p1 || 'PROP 1') : (key === 'prop2' ? (currentCat?.p2 || 'PROP 2') : key.toUpperCase());
                    changes.push({ field: label, old: oldVal, new: newVal });
                }
            });

            if (changes.length > 0) {
                addTableLog('Stock Maintenance', 'MODIFIED', normalizedSaved.prop2 || 'Stock Item', `Updated fields in ${activeSection}.`, normalizedSaved.id, changes);
            }

            setEditingId(null);
        } catch (error) {
            console.error("Failed to update stock item", error);
            alert("Failed to update item.");
        }
    };

    const deleteItem = async (row, index) => {
        if (!window.confirm("Are you sure you want to delete this stock item?")) return;
        try {
            if (row.id) {
                await assetService.deleteStockItem(row.id);
            }
            setStockData(prev => ({
                ...prev,
                [activeSection]: prev[activeSection].filter((_, i) => i !== index)
            }));
            addTableLog('Stock Maintenance', 'DELETED', row.prop2 || row.prop1 || 'Stock Item', `Deleted item from ${activeSection}.`);
        } catch (error) {
            console.error("Failed to delete stock item", error);
            alert("Failed to delete item.");
        }
    };

    const currentCat = categories.find(c => c.id === activeSection);
    const currentDrafts = newRows[activeSection] || [];
    const effectiveStockData = itemsBySection;

    const filteredData = useMemo(() => {
        return effectiveStockData.filter(row => {
            const matchesSearch = !searchQuery || Object.values(row).some(val => (val || '').toString().toLowerCase().includes(searchQuery.toLowerCase()));
            
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
        });
    }, [effectiveStockData, searchQuery, startDate, endDate]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [activeSection, searchQuery, startDate, endDate]);

    return (
        <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => { setActiveSection(cat.id); setEditingId(null); }}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 20,
                            border: activeSection === cat.id ? 'none' : '1px solid #cbd5e1',
                            background: activeSection === cat.id ? '#0f172a' : '#fff',
                            color: activeSection === cat.id ? '#fff' : '#475569',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontSize: 13
                        }}
                    >
                        {cat.id}
                    </button>
                ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(156,163,175,0.4)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search in this category..." style={{ height: 38, width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px 0 36px', fontSize: 13 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>FROM</span>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ height: 34, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>TO</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ height: 34, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }} />
                    </div>
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ height: 34, padding: '0 12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Clear Date</button>
                    )}
                    <div style={{ marginLeft: 'auto', background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 900, color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                        Total Records: <span style={{ color: '#0f172a' }}>{filteredData.length}</span>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="asset-dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>S.No</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Created At</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>{currentCat?.p1 || 'Property 1'}</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>{currentCat?.p2 || 'Property 2'}</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Qty</th>
                                <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {canEdit && currentDrafts.map((row, draftIndex) => (
                                <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f97316' }}>{draftIndex + 1}</td>
                                    <td style={{ padding: '10px 12px' }}><div className="asset-data-cell" style={{ background: '#fffaf5', color: '#ea580c', fontWeight: 700 }}>New Row</div></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.prop1} onChange={(e) => updateDraftRow(row.tempId, 'prop1', e.target.value)} placeholder={currentCat?.p1} style={{ width: '100%', minWidth: 150, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input value={row.prop2} onChange={(e) => updateDraftRow(row.tempId, 'prop2', e.target.value)} placeholder={currentCat?.p2} style={{ width: '100%', minWidth: 150, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}><input type="number" value={row.qty} onChange={(e) => updateDraftRow(row.tempId, 'qty', Number(e.target.value))} placeholder="Qty" style={{ width: 100, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <button onClick={() => removeDraftRow(row.tempId)} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedData.map((row, index) => {
                                const globalIndex = (currentPage - 1) * pageSize + index;
                                return (
                                <tr key={globalIndex} style={{ borderBottom: '1px solid #edf2f7' }}>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell">{canEdit ? currentDrafts.length + globalIndex + 1 : globalIndex + 1}</div></td>
                                    <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ border: 'none', background: '#f8fafc', color: '#64748b' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</div></td>
                                    {editingId === globalIndex ? (
                                        <>
                                            <td style={{ padding: '8px' }}><input value={editFormData.prop1 || editFormData.specification} onChange={e => setEditFormData({...editFormData, prop1: e.target.value, specification: e.target.value})} style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input value={editFormData.prop2 || editFormData.itemName} onChange={e => setEditFormData({...editFormData, prop2: e.target.value, itemName: e.target.value})} style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '8px' }}><input type="number" value={editFormData.qty || editFormData.quantity} onChange={e => setEditFormData({...editFormData, qty: Number(e.target.value), quantity: Number(e.target.value)})} style={{ width: 100, height: 30, borderRadius: 6, border: '1px solid #3b82f6', padding: '0 6px' }} /></td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => saveEdit(globalIndex)} style={{ padding: '4px 8px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>Save</button>
                                                    <button onClick={() => setEditingId(null)} style={{ padding: '4px 8px', borderRadius: 6, background: '#94a3b8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>X</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.prop1 || row.specification || '-'}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.prop2 || row.itemName || '-'}</div></td>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.qty || row.quantity || 0}</div></td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <button onClick={() => onViewHistory && onViewHistory(row)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }} title="View row history"><Info size={14} /></button>
                                                    {canEdit && (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button onClick={() => startEdit(row, globalIndex)} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }}>Edit</button>
                                                            <button onClick={() => deleteItem(row, globalIndex)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }}>Delete</button>
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
                {canEdit && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <button onClick={addDraftRow} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <Plus size={14} /> ADD ROW
                            </button>
                            {currentDrafts.length > 0 && (
                                <button onClick={saveDrafts} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#fff', color: '#16a34a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <Save size={14} /> Save All
                                </button>
                            )}
                        </div>
                        
                        <Pagination 
                            currentPage={currentPage}
                            totalItems={filteredData.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
            
            <div style={{ marginTop: 12 }}>
                <DynamicTables 
                    key={`stock_maintenance_${activeSection}`} 
                    tabId={`stock_maintenance_${activeSection}`} 
                    canEdit={canEdit} 
                    onViewHistory={onViewHistory}
                />
            </div>
        </div>
    );
}
