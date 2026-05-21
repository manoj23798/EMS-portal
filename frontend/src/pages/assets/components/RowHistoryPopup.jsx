import React, { useState, useEffect } from 'react';
import { X, ArrowDown, Clock } from 'lucide-react';
import { assetService } from '../../../services/assetService';

/**
 * RowHistoryPopup Component
 * A professional timeline-based audit log viewer that matches the user's sketch.
 * Layout: Left thick orange line with dates, Right horizontal scrolling change cards.
 */
export default function RowHistoryPopup({ isOpen, onClose, logs: initialLogs, assetName, recordId }) {
    const [logs, setLogs] = useState(initialLogs || []);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && recordId) {
            const fetchLogs = async () => {
                setIsLoading(true);
                try {
                    const backendLogs = await assetService.getLogsByRecordId(recordId);
                    if (backendLogs && backendLogs.length > 0) {
                        const UIFormat = backendLogs.map(l => ({
                            id: l.id,
                            timestamp: l.timestamp,
                            performedBy: 'ADMIN',
                            actionType: l.action,
                            targetAsset: l.recordName,
                            details: l.details,
                            tableScope: l.tableScope,
                            rowId: l.recordId,
                            diff: l.changesJson ? JSON.parse(l.changesJson) : null
                        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                        setLogs(UIFormat);
                    } else {
                        setLogs(initialLogs || []);
                    }
                } catch (error) {
                    console.error("Failed to fetch logs for popup", error);
                    setLogs(initialLogs || []);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchLogs();
        } else if (isOpen) {
            setLogs(initialLogs || []);
        }
    }, [isOpen, recordId, initialLogs]);

    if (!isOpen) return null;

    // Group logs by date (DD/MM/YY)
    const groupedLogs = (logs || []).reduce((acc, log) => {
        const date = new Date(log.timestamp);
        const dateStr = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(log);
        return acc;
    }, {});

    // Sort dates newest first
    const dates = Object.keys(groupedLogs).sort((a, b) => {
        const [d1, m1, y1] = a.split('/').map(Number);
        const [d2, m2, y2] = b.split('/').map(Number);
        const date1 = new Date(2000 + y1, m1 - 1, d1);
        const date2 = new Date(2000 + y2, m2 - 1, d2);
        return date2 - date1;
    });

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            padding: 24, animation: 'fadeIn 0.2s ease-out'
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .history-popup-card { animation: slideUp 0.3s ease-out both; }
                
                /* Hide scrollbar for Chrome, Safari and Opera */
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }

                /* Hide scrollbar for IE, Edge and Firefox */
                .hide-scrollbar {
                  -ms-overflow-style: none;  /* IE and Edge */
                  scrollbar-width: none;  /* Firefox */
                }
            `}</style>
            
            <div style={{
                background: '#fff', width: '100%', maxWidth: 700, borderRadius: 28,
                boxShadow: '0 30px 100px rgba(15, 23, 42, 0.25)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', maxHeight: '80vh',
                position: 'relative'
            }}>
                {/* Close Button Top Right */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: 20, right: 20,
                    background: '#f1f5f9', border: 'none', width: 38, height: 38,
                    borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', zIndex: 10
                }} onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}>
                    <X size={20} strokeWidth={2.5} />
                </button>

                {/* Header Section */}
                <div style={{ padding: '30px 40px 18px', borderBottom: '1px solid #f1f5f9' }}>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: 950, color: '#0f172a', letterSpacing: '-1px' }}>
                        LOGS
                    </h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                        History for <span style={{ color: '#3b82f6', fontWeight: 800 }}>{assetName}</span>
                    </p>
                </div>

                {/* Timeline Body */}
                <div style={{ padding: '30px 40px', overflowY: 'auto', position: 'relative', flex: 1, minHeight: 400 }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontWeight: 800 }}>Fetching logs...</div>
                    ) : dates.length > 0 ? (
                        <div style={{ position: 'relative' }}>
                            {/* The Thick Orange Vertical Line */}
                            <div style={{
                                position: 'absolute', left: 100, top: 0, bottom: 20,
                                width: 5, background: '#f97316', borderRadius: 10
                            }} />

                            <div style={{ display: 'grid', gap: 30 }}>
                                {dates.map((date) => (
                                    <div key={date}>
                                        <div style={{ display: 'flex', gap: 40, position: 'relative' }}>
                                            {/* Date Label Area */}
                                            <div style={{
                                                width: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                                fontSize: 16, fontWeight: 950, color: '#f97316', position: 'relative',
                                                fontVariantNumeric: 'tabular-nums'
                                            }}>
                                                {date}
                                                {/* Horizontal Line Connector */}
                                                <div style={{
                                                    position: 'absolute', left: 90, width: 25, height: 5, background: '#f97316',
                                                    borderRadius: 2
                                                }} />
                                            </div>

                                            {/* Changes Container - Horizontal Scroll with Hidden Scrollbar */}
                                            <div className="hide-scrollbar" style={{ 
                                                flex: 1, 
                                                display: 'flex', 
                                                flexDirection: 'row', 
                                                gap: 16, 
                                                overflowX: 'auto', 
                                                paddingBottom: 12,
                                                paddingTop: 8,
                                                alignItems: 'flex-start'
                                            }}>
                                                {groupedLogs[date].map((log, lIdx) => (
                                                    <React.Fragment key={log.id || lIdx}>
                                                        {log.actionType === 'CREATED' ? (
                                                            <div className="history-popup-card" style={{
                                                                background: '#f0fdf4', border: '2px solid #22c55e', color: '#16a34a',
                                                                padding: '10px 20px', borderRadius: 14, fontSize: 16,
                                                                fontWeight: 900, textTransform: 'lowercase', display: 'flex', flexDirection: 'column', gap: 4, height: 'fit-content',
                                                                flexShrink: 0
                                                            }}>
                                                                <span>created</span>
                                                                <div style={{ fontSize: 10, color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            (() => {
                                                                const diff = log.diff || [];
                                                                const uniqueChanges = [];
                                                                const seenFields = new Set();
                                                                const seenValues = new Map();

                                                                diff.forEach(change => {
                                                                    const field = (change.field || '').toString().toUpperCase().trim();
                                                                    const val = (change.new || '').toString().trim();
                                                                    if (!field || seenFields.has(field)) return;

                                                                    // Define alias groups to clean up redundant "twins"
                                                                    const isAlias = (f1, f2) => {
                                                                        const groups = [
                                                                            ['NAME','ITEM NAME','PRODUCT NAME','ASSET NAME'],
                                                                            ['STATUS','ASSET STATUS','CURRENT STATUS'],
                                                                            ['MAKE','BRAND','MANUFACTURER','OS']
                                                                        ];
                                                                        return groups.some(g => g.includes(f1) && g.includes(f2));
                                                                    };

                                                                    let redundant = false;
                                                                    for (const [v, f] of seenValues.entries()) {
                                                                        if (v === val && isAlias(f, field)) { redundant = true; break; }
                                                                    }

                                                                    if (!redundant) {
                                                                        uniqueChanges.push(change);
                                                                        seenFields.add(field);
                                                                        seenValues.set(val, field);
                                                                    }
                                                                });

                                                                return uniqueChanges.map((change, cIdx) => (
                                                                    <div key={cIdx} className="history-popup-card" style={{
                                                                        background: '#f1f5f9', padding: '16px 20px', borderRadius: 20,
                                                                        minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                                        gap: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.05)', border: '1.5px solid #cbd5e1',
                                                                        flexShrink: 0, position: 'relative'
                                                                    }}>
                                                                        {/* Time Badge */}
                                                                        <div style={{
                                                                            position: 'absolute', top: 8, right: 12, fontSize: 9, 
                                                                            color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3
                                                                        }}>
                                                                            <Clock size={9} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>

                                                                        {/* Field Badge */}
                                                                        <div style={{
                                                                            background: '#e0e7ff', padding: '4px 12px', borderRadius: 6,
                                                                            fontSize: 10, fontWeight: 950, color: '#4338ca', textTransform: 'uppercase',
                                                                            marginTop: 4
                                                                        }}>
                                                                            {change.field}
                                                                        </div>
                                                                        
                                                                        {/* Old Value */}
                                                                        <div style={{
                                                                            fontSize: 15, fontWeight: 700, color: '#94a3b8',
                                                                            textDecoration: change.old ? 'line-through' : 'none',
                                                                            textAlign: 'center',
                                                                            maxWidth: 160,
                                                                            wordBreak: 'break-word',
                                                                            lineHeight: 1.2
                                                                        }}>
                                                                            {change.old || '-'}
                                                                        </div>

                                                                        {/* Arrow */}
                                                                        <ArrowDown size={18} color="#f97316" strokeWidth={3.5} />

                                                                        {/* New Value */}
                                                                        <div style={{
                                                                            fontSize: 18, fontWeight: 950, color: '#0f172a',
                                                                            textAlign: 'center',
                                                                            maxWidth: 160,
                                                                            wordBreak: 'break-word',
                                                                            letterSpacing: '-0.5px',
                                                                            lineHeight: 1.1
                                                                        }}>
                                                                            {change.new}
                                                                        </div>
                                                                    </div>
                                                                ));
                                                            })()
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Extremely Visible Solid Grey Line (Gap fixed) */}
                                        <div style={{ 
                                            marginLeft: 105, 
                                            height: 2, 
                                            background: '#cbd5e1', 
                                            width: 'calc(100% - 105px)', 
                                            marginTop: -4, 
                                            marginBottom: 0,
                                            borderRadius: 2
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', height: '100%', padding: '40px 0',
                            color: '#cbd5e1'
                        }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: 40, background: '#f8fafc',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 20
                            }}>
                                <X size={32} color="#e2e8f0" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#475569' }}>No Activity Logs Found</h3>
                            <p style={{ margin: '6px 0 0 0', fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                                History for this asset hasn't been recorded yet.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Subtle Line */}
                <div style={{ padding: 16, textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                     <div style={{ width: 80, height: 4, background: '#f1f5f9', borderRadius: 2, margin: '0 auto' }} />
                </div>
            </div>
        </div>
    );
}
