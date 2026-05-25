import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Clock, ArrowDown, Info } from 'lucide-react';
import { assetService } from '../../../services/assetService';
import RowHistoryPopup from './RowHistoryPopup';

export default function AssetDetailView({ asset, onBack, onSave }) {
    const [logs, setLogs] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [isLogPopupOpen, setIsLogPopupOpen] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedAsset, setEditedAsset] = useState(asset);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setEditedAsset(asset);
        setIsEditing(false);
    }, [asset]);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!asset) return;
            setIsLoadingLogs(true);
            try {
                let fetchedLogs = [];
                if (asset.id) {
                    fetchedLogs = await assetService.getLogsByRecordId(asset.id);
                }
                
                // Fallback to local if no backend logs
                if (!fetchedLogs || fetchedLogs.length === 0) {
                    const allLogs = JSON.parse(localStorage.getItem('ems_auto_audit_logs')) || [];
                    const identifier = asset.assetCode || asset.computerName || asset.particulers || asset.name || 'Unknown';
                    
                    fetchedLogs = allLogs.filter(l => 
                        (l.rowId && asset.id && String(l.rowId) === String(asset.id)) || 
                        (l.targetAsset === identifier)
                    ).map(l => ({
                        ...l,
                        actionType: l.actionType,
                        targetAsset: l.targetAsset,
                        rowId: l.rowId,
                        diff: l.diff
                    }));
                } else {
                    fetchedLogs = fetchedLogs.map(l => ({
                        ...l,
                        actionType: l.action,
                        targetAsset: l.recordName,
                        rowId: l.recordId,
                        diff: l.changesJson ? JSON.parse(l.changesJson) : null
                    }));
                }
                
                setLogs(fetchedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            } catch (error) {
                console.error("Failed to fetch logs for detail view", error);
            } finally {
                setIsLoadingLogs(false);
            }
        };
        fetchLogs();
    }, [asset]);

    if (!asset) return null;

    const identifier = editedAsset.assetCode || editedAsset.computerName || editedAsset.particulers || editedAsset.productName || 'Unknown Asset';
    const status = editedAsset.status || 'Active';
    const statusColor = status.toLowerCase() === 'active' || status.toLowerCase() === 'working' ? '#22c55e' : 
                        status.toLowerCase() === 'inuse' ? '#3b82f6' : 
                        status.toLowerCase() === 'standby' ? '#f59e0b' : '#64748b';

    const handleSaveClick = async () => {
        if (!onSave) return;
        setIsSaving(true);
        try {
            await onSave(editedAsset);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save asset", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setEditedAsset(prev => ({ ...prev, [field]: value }));
    };

    const getVal = (primary, fallback) => {
        if (primary in editedAsset) return editedAsset[primary];
        if (fallback && fallback in editedAsset) return editedAsset[fallback];
        return '';
    };

    const setVal = (primary, fallback, value) => {
        if (primary in asset) {
            handleChange(primary, value);
        } else if (fallback && fallback in asset) {
            handleChange(fallback, value);
        } else {
            handleChange(primary, value);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: '#0f172a', fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <ArrowLeft size={16} strokeWidth={2.5} /> Back
                    </button>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                        {identifier}
                        {!isEditing ? (
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', background: `${statusColor}15`, color: statusColor, borderRadius: 20, border: `1px solid ${statusColor}30`, textTransform: 'uppercase' }}>
                                {status}
                            </span>
                        ) : (
                            <select 
                                value={editedAsset.status || ''} 
                                onChange={e => handleChange('status', e.target.value)}
                                style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, border: `1px solid #cbd5e1`, textTransform: 'uppercase', outline: 'none' }}
                            >
                                <option value="Available">Available</option>
                                <option value="In Use">In Use</option>
                                <option value="Repair">Repair</option>
                                <option value="Standby">Standby</option>
                                <option value="Scrap">Scrap</option>
                                <option value="Working">Working</option>
                                <option value="Not Working">Not Working</option>
                            </select>
                        )}
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {!isEditing && (
                        <button onClick={() => setIsLogPopupOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: '#fff', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = '#fff'} title="View row history">
                            <Info size={18} />
                        </button>
                    )}
                    
                    {isEditing ? (
                        <>
                            <button onClick={() => { setIsEditing(false); setEditedAsset(asset); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleSaveClick} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#22c55e', border: 'none', color: '#fff', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        onSave && (
                            <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}>
                                Edit Asset
                            </button>
                        )
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* ASSET INFORMATION */}
                    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(156,163,175,0.1)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Asset Information</h3>
                        </div>
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'grid', gap: 16 }}>
                                <InfoRow label="Asset Tag / Code" value={editedAsset.assetCode} isEditing={isEditing} onChange={v => handleChange('assetCode', v)} />
                                <InfoRow label="Type / Class" value={getVal('assetClass', 'type')} isEditing={isEditing} onChange={v => setVal('assetClass', 'type', v)} />
                                <InfoRow label="Brand / Make" value={getVal('make', 'brand')} isEditing={isEditing} onChange={v => setVal('make', 'brand', v)} />
                                <InfoRow label="Model / Product" value={getVal('model', 'productName')} isEditing={isEditing} onChange={v => setVal('model', 'productName', v)} />
                                <InfoRow label="Serial Number" value={getVal('serialNumber', 'serial')} isEditing={isEditing} onChange={v => setVal('serialNumber', 'serial', v)} />
                            </div>
                        </div>
                    </div>

                    {/* HARDWARE SPECS */}
                    {(editedAsset.cpu || editedAsset.ram || editedAsset.storage || editedAsset.hddAndType || editedAsset.hddType || editedAsset.os || editedAsset.computerName || editedAsset.pcName || isEditing) && (
                        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(156,163,175,0.1)' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                                <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Hardware Specs</h3>
                            </div>
                            <div style={{ padding: 20 }}>
                                <div style={{ display: 'grid', gap: 16 }}>
                                    <InfoRow label="Computer Name" value={getVal('computerName', 'pcName')} isEditing={isEditing} onChange={v => setVal('computerName', 'pcName', v)} />
                                    <InfoRow label="IP Address" value={editedAsset.ipAddress} isEditing={isEditing} onChange={v => handleChange('ipAddress', v)} />
                                    <InfoRow label="CPU" value={editedAsset.cpu} isEditing={isEditing} onChange={v => handleChange('cpu', v)} />
                                    <InfoRow label="RAM" value={editedAsset.ram} isEditing={isEditing} onChange={v => handleChange('ram', v)} />
                                    <InfoRow label="Storage" value={getVal('hddAndType', 'hddType') || editedAsset.storage} isEditing={isEditing} onChange={v => setVal('hddAndType', 'hddType', v)} />
                                    <InfoRow label="OS" value={editedAsset.os} isEditing={isEditing} onChange={v => handleChange('os', v)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PURCHASE DETAILS */}
                    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(156,163,175,0.1)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Purchase & Support</h3>
                        </div>
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'grid', gap: 16 }}>
                                <InfoRow label="Created At" value={editedAsset.createdAt ? new Date(editedAsset.createdAt).toLocaleDateString() : null} isEditing={false} onChange={() => {}} />
                                <InfoRow label="Support / Warranty" value={editedAsset.additionalSupport} isEditing={isEditing} onChange={v => handleChange('additionalSupport', v)} />
                                <InfoRow label="Last Maintenance" value={editedAsset.lastMaintenance} isEditing={isEditing} onChange={v => handleChange('lastMaintenance', v)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* ASSIGNMENT */}
                    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(156,163,175,0.1)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Assignment</h3>
                        </div>
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'grid', gap: 16 }}>
                                <InfoRow label="Assigned To" value={getVal('userName', 'user')} isEditing={isEditing} onChange={v => setVal('userName', 'user', v)} />
                                <InfoRow label="Email ID" value={editedAsset.emailId} isEditing={isEditing} onChange={v => handleChange('emailId', v)} />
                                <InfoRow label="Mobile Number" value={editedAsset.mobileNumber} isEditing={isEditing} onChange={v => handleChange('mobileNumber', v)} />
                                <InfoRow label="Department" value={editedAsset.department} isEditing={isEditing} onChange={v => handleChange('department', v)} />
                                <InfoRow label="Responsibility" value={editedAsset.responsibility} isEditing={isEditing} onChange={v => handleChange('responsibility', v)} />
                                <InfoRow label="Description/Remarks" value={getVal('remarks', 'description')} isEditing={isEditing} onChange={v => setVal('remarks', 'description', v)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <RowHistoryPopup 
                isOpen={isLogPopupOpen} 
                onClose={() => setIsLogPopupOpen(false)} 
                logs={logs} 
                assetName={identifier} 
                recordId={asset?.id} 
            />
        </div>
    );
}

function InfoRow({ label, value, isEditing, onChange, placeholder = '' }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px dashed #f1f5f9', alignItems: isEditing ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{label}</span>
            {isEditing ? (
                <input 
                    value={value || ''} 
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', textAlign: 'right', width: '60%', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px 8px', outline: 'none' }}
                />
            ) : (
                <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
            )}
        </div>
    );
}
