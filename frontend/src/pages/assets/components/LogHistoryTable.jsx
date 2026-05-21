import React, { useState, useEffect } from 'react';
import { History, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { tokenManager } from '../../../utils/tokenManager';
import { assetService } from '../../../services/assetService';

// Auto Logger Global Utility - Refactored to use Backend
export const addTableLog = async (tableScope, actionType, targetAsset, details, rowId = null, diff = null) => {
    try {
        const role = tokenManager.getUserRole() || 'SYSTEM ADMIN';
        const newLog = {
            timestamp: new Date().toISOString(),
            tableScope: tableScope,
            action: actionType,
            recordName: targetAsset,
            details: details,
            recordId: rowId ? Number(rowId) : null,
            changesJson: diff ? JSON.stringify(diff) : null,
            performedBy: role
        };
        
        // Sync with backend if available
        await assetService.addLog(newLog);

        // Still update localStorage for quick local reference (optional, but good for reactivity)
        const oldLogFormat = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: newLog.timestamp,
            performedBy: role,
            actionType,
            targetAsset,
            details,
            tableScope,
            rowId,
            diff
        };
        const existingLogs = JSON.parse(localStorage.getItem('ems_auto_audit_logs')) || [];
        localStorage.setItem('ems_auto_audit_logs', JSON.stringify([oldLogFormat, ...existingLogs]));
    } catch (e) {
        console.error('Failed to log action to backend', e);
    }
};

export default function LogHistoryTable({ tableScope }) {
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const loadLogs = async () => {
        try {
            const backendLogs = await assetService.getLogsByTable(tableScope);
            if (backendLogs && backendLogs.length > 0) {
                // Map backend format to UI format if needed
                const UIFormat = backendLogs.map(l => ({
                    id: l.id,
                    timestamp: l.timestamp,
                    performedBy: l.performedBy || 'Unknown',
                    actionType: l.action,
                    targetAsset: l.recordName,
                    details: l.details,
                    tableScope: l.tableScope,
                    rowId: l.recordId,
                    diff: l.changesJson ? JSON.parse(l.changesJson) : null
                })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setLogs(UIFormat);
            } else {
                // Fallback to local
                const allLogs = JSON.parse(localStorage.getItem('ems_auto_audit_logs')) || [];
                const scopeLogs = allLogs.filter(log => log.tableScope === tableScope);
                setLogs(scopeLogs);
            }
        } catch (e) {
            console.error("Failed to load logs from backend", e);
            const allLogs = JSON.parse(localStorage.getItem('ems_auto_audit_logs')) || [];
            const scopeLogs = allLogs.filter(log => log.tableScope === tableScope);
            setLogs(scopeLogs);
        }
    };

    useEffect(() => {
        if (isVisible) {
            loadLogs();
            const interval = setInterval(loadLogs, 5000); // Slower polling for logs
            return () => clearInterval(interval);
        }
    }, [tableScope, isVisible]);

    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (log.targetAsset?.toLowerCase() || '').includes(q) || 
               (log.details?.toLowerCase() || '').includes(q);
    });

    const getActionBadge = (type) => {
        if (type === 'CREATED') return <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#166534', borderRadius: 6, fontWeight: 900, fontSize: 11 }}>CREATED</span>;
        if (type === 'MODIFIED') return <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 6, fontWeight: 900, fontSize: 11 }}>MODIFIED</span>;
        if (type === 'DELETED') return <span style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 6, fontWeight: 900, fontSize: 11 }}>DELETED</span>;
        return <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#475569', borderRadius: 6, fontWeight: 900, fontSize: 11 }}>{type}</span>;
    };

    return (
        <div style={{ marginTop: 24 }}>
            {!isVisible ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button 
                        onClick={() => setIsVisible(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 20px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            color: '#475569',
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <History size={16} /> Show Activity Logs
                        <ChevronDown size={14} />
                    </button>
                </div>
            ) : (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(156,163,175,0.4)' }}>
                    <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, color: '#0f172a' }}>
                            <History size={18} color="#64748b" /> Activity Logs ({tableScope})
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', width: '100%', maxWidth: 200 }}>
                                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter logs..." style={{ height: 34, width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 10px 0 32px', fontSize: 12 }} />
                            </div>
                            <button 
                                onClick={() => setIsVisible(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '6px 12px',
                                    background: '#fff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 8,
                                    color: '#64748b',
                                    fontWeight: 800,
                                    fontSize: 12,
                                    cursor: 'pointer'
                                }}
                            >
                                Hide <ChevronUp size={14} />
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ overflowX: 'auto', maxHeight: 400 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8fafc' }}>
                                <tr>
                                    {['Timestamp', 'Action', 'Action Details', 'Performed By'].map(h => (
                                        <th key={h} style={{ padding: '12px 20px', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', letterSpacing: '0.4px' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                                        <td style={{ padding: '14px 20px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>{new Date(log.timestamp).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{ padding: '14px 20px' }}>{getActionBadge(log.actionType)}</td>
                                        <td style={{ padding: '14px 20px', color: '#0f172a', maxWidth: 450 }}>
                                            <span style={{ fontWeight: 800, marginRight: 8 }}>{log.targetAsset}</span>
                                            <span style={{ color: '#64748b', fontSize: 12 }}>{log.details}</span>
                                        </td>
                                        <td style={{ padding: '14px 20px', color: '#334155', fontWeight: 700 }}>{log.performedBy || 'System'}</td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No logs found for this table.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
