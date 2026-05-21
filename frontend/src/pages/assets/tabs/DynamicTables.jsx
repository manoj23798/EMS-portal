import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, X, Info } from 'lucide-react';
import { addTableLog } from '../components/LogHistoryTable';
import { assetService } from '../../../services/assetService';

export default function DynamicTables({ tabId, canEdit, onViewHistory }) {
    const [tables, setTables] = useState([]);
    const [rowsData, setRowsData] = useState({});
    const [draftRows, setDraftRows] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Load data whenever tabId changes
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Try backend first
                const backendData = await assetService.getDynamicData(tabId);
                if (backendData) {
                    setTables(JSON.parse(backendData.tablesJson || '[]'));
                    setRowsData(JSON.parse(backendData.rowsJson || '{}'));
                } else {
                    setTables([]);
                    setRowsData({});
                }
                setDraftRows({});
            } catch (e) {
                console.error("Error loading dynamic tables:", e);
                setTables([]);
                setRowsData({});
                setDraftRows({});
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [tabId]);

    const persistToBackend = async (updatedTables, updatedRows) => {
        try {
            const payload = {
                tabId: tabId,
                tablesJson: JSON.stringify(updatedTables),
                rowsJson: JSON.stringify(updatedRows)
            };
            await assetService.saveDynamicData(payload);
            
        } catch (error) {
            console.error("Failed to sync dynamic tables to backend", error);
        }
    };

    // Modals state
    const [createTableOpen, setCreateTableOpen] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [newTableCols, setNewTableCols] = useState(['Column 1', 'Column 2']);

    const handleCreateTable = async () => {
        if (!newTableName) return;
        const newId = 'tbl_' + Date.now();
        const updatedTables = [...tables, { id: newId, name: newTableName, columns: newTableCols.filter(c => c.trim() !== '') }];
        setTables(updatedTables);
        await persistToBackend(updatedTables, rowsData);
        setCreateTableOpen(false);
        setNewTableName('');
        setNewTableCols(['Column 1', 'Column 2']);
    };

    const addDraftRow = (tableId) => {
        const t = tables.find(x => x.id === tableId);
        const emptyRow = { tempId: Date.now() + Math.random() };
        t.columns.forEach(c => emptyRow[c] = '');
        setDraftRows(prev => ({ ...prev, [tableId]: [...(prev[tableId] || []), emptyRow] }));
    };

    const saveChanges = async (tableId) => {
        const drafts = draftRows[tableId] || [];
        if (drafts.length === 0) return;
        
        const t = tables.find(x => x.id === tableId);
        const validDrafts = drafts.filter(row => t.columns.some(c => row[c]));

        const updatedRows = {
            ...rowsData,
            [tableId]: [...validDrafts, ...(rowsData[tableId] || [])]
        };
        
        setRowsData(updatedRows);
        setDraftRows(prev => ({ ...prev, [tableId]: [] })); 
        await persistToBackend(tables, updatedRows);
        
        if (validDrafts.length > 0) {
            addTableLog(tabId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 'CREATED', t.name, `Added ${validDrafts.length} new records to ${t.name}.`);
        }
    };

    const deleteTable = async (tableId) => {
        if(window.confirm('Delete this custom table entirely?')) {
            const updatedTables = tables.filter(t => t.id !== tableId);
            setTables(updatedTables);

            const updatedRows = {...rowsData};
            delete updatedRows[tableId];
            setRowsData(updatedRows);
            await persistToBackend(updatedTables, updatedRows);
        }
    };

    const deleteRow = async (tableId, rowIndex) => {
        const updatedRowsForTable = (rowsData[tableId] || []).filter((_, i) => i !== rowIndex);
        const updatedRows = {
            ...rowsData,
            [tableId]: updatedRowsForTable
        };
        setRowsData(updatedRows);
        await persistToBackend(tables, updatedRows);
    };

    if (isLoading) {
        return <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: 800 }}>Syncing with server...</div>;
    }

    return (
        <div style={{ display: 'grid', gap: 24, marginTop: 12 }}>
            {tables.map(table => {
                const drafts = draftRows[table.id] || [];
                const data = rowsData[table.id] || [];
                return (
                    <div key={table.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(156,163,175,0.4)' }}>
                        <div style={{ padding: '16px 20px', background: '#f8fafc', fontWeight: 900, color: '#0f172a', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span>{table.name}</span>
                                <div style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900, color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                    Total: <span style={{ color: '#0f172a' }}>{data.length}</span>
                                </div>
                            </div>
                            {canEdit && <button onClick={() => deleteTable(table.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="asset-dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                                <thead style={{ position: 'sticky', top: 0 }}>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>S.No</th>
                                        {table.columns.map((col, i) => (
                                            <th key={i} style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>{col}</th>
                                        ))}
                                        <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {canEdit && drafts.map((row, draftIndex) => (
                                        <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f97316' }}>{draftIndex + 1}</td>
                                            {table.columns.map((col, i) => (
                                                <td key={i} style={{ padding: '10px 12px' }}>
                                                    <input 
                                                        value={row[col] || ''} 
                                                        onChange={(e) => setDraftRows(prev => ({ ...prev, [table.id]: prev[table.id].map(r => r.tempId === row.tempId ? { ...r, [col]: e.target.value } : r) }))}
                                                        placeholder={col} 
                                                        style={{ width: '100%', minWidth: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} 
                                                    />
                                                </td>
                                            ))}
                                            <td style={{ padding: '10px 12px' }}>
                                                <button onClick={() => setDraftRows(prev => ({ ...prev, [table.id]: prev[table.id].filter(r => r.tempId !== row.tempId) }))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                                            <td style={{ padding: '12px' }}><div className="asset-data-cell">{canEdit ? drafts.length + idx + 1 : idx + 1}</div></td>
                                            {table.columns.map((col, i) => (
                                                <td key={i} style={{ padding: '12px' }}><div className="asset-data-cell">{row[col] || '-'}</div></td>
                                            ))}
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => onViewHistory && onViewHistory(row)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: 8, padding: '5px 6px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }} title="View row history"><Info size={14} /></button>
                                                    {canEdit && <button onClick={() => deleteRow(table.id, idx)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Delete</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && drafts.length === 0 && (
                                        <tr>
                                            <td colSpan={table.columns.length + 2} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No rows created in this table yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {canEdit && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                                <button onClick={() => addDraftRow(table.id)} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <Plus size={14} /> ADD ROW
                                </button>
                                {drafts.length > 0 && (
                                    <button onClick={() => saveChanges(table.id)} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#fff', color: '#16a34a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <Save size={14} /> Save All
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {canEdit && (
                <div style={{ marginTop: 20 }}>
                    <button onClick={() => setCreateTableOpen(true)} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px dashed #94a3b8', background: '#f8fafc', color: '#475569', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <Plus size={16} /> CREATE A NEW TABLE HERE
                    </button>
                </div>
            )}

            {createTableOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 16, width: 400, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, fontSize: 16 }}>
                            Create Custom Table
                            <button onClick={() => setCreateTableOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: 20, display: 'grid', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>TABLE NAME</label>
                                <input value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="e.g. Workstations" style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>COLUMNS</label>
                                {newTableCols.map((col, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        <input value={col} onChange={e => {
                                            const n = [...newTableCols];
                                            n[idx] = e.target.value;
                                            setNewTableCols(n);
                                        }} style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px' }} placeholder="Column name" />
                                        <button onClick={() => setNewTableCols(newTableCols.filter((_, i) => i !== idx))} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, width: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={() => setNewTableCols([...newTableCols, ''])} style={{ fontSize: 12, fontWeight: 800, color: '#f97316', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Add Column</button>
                            </div>
                        </div>
                        <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button onClick={() => setCreateTableOpen(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateTable} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Create Table</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
