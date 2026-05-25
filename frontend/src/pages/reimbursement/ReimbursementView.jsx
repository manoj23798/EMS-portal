import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReimbursementAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';
import { 
    Plane, Car, Hotel, Coffee, User, Users, Paperclip, Printer, 
    Coins, Banknote, MoreHorizontal, Calendar, FileText, X, 
    CheckCircle, Clock, AlertTriangle, ArrowLeft, Send, Trash2, Eye, EyeOff, Maximize,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';

const ReimbursementView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    
    // UI States
    const [activePod, setActivePod] = useState('summary'); // 'summary' or 'preview'
    const [previewCategory, setPreviewCategory] = useState('tickets');
    const [previewIndex, setPreviewIndex] = useState(0);
    const [selectedRowId, setSelectedRowId] = useState(null); // format: 'category-index'
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showPods, setShowPods] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({
        tickets: false, lodgings: false, conveyances: false, foods: false, others: false, wages: false
    });

    const toggleSummaryCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const handleRowClick = (category, index) => {
        setSelectedRowId(`${category}-${index}`);
        setActivePod('preview');
        setPreviewCategory(category);
        
        const originalList = claim[category] || [];
        const fileField = (category === 'tickets' || category === 'conveyances') ? 'ticketFile' : 'billFile';
        
        if (originalList[index] && originalList[index][fileField]) {
            const idxInFiltered = originalList.slice(0, index).filter(item => item[fileField]).length;
            setPreviewIndex(idxInFiltered);
        } else {
            setPreviewIndex(0);
        }
    };

    // Admin Controls
    const [approvalAmount, setApprovalAmount] = useState('');
    const [approvalReason, setApprovalReason] = useState('Audit Verified');

    const userRole = (tokenManager.getUserRole() || '').toUpperCase();
    const isFinance = userRole.includes('ADMIN') || userRole.includes('HR');
    const isManager = userRole.includes('MANAGER') || isFinance;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await ReimbursementAPI.getById(id);
                setClaim(res.data);
                // Pre-fill with the actual Due Payout (Total - Advance)
                const netPayout = (res.data.totalAmountClaimed || 0) - (res.data.advanceAmount || 0);
                setApprovalAmount(netPayout || '');
                setLoading(false);
            } catch (err) {
                setError('Audit data could not be retrieved.');
                setLoading(false);
            }
        };
        if (id) fetchDetails();
    }, [id]);

    const handleAction = async (isApprove) => {
        if (!window.confirm(`Audit Confirm: ${isApprove ? 'Approve' : 'Reject'}?`)) return;
        setProcessing(true);
        try {
            await (isFinance 
                ? ReimbursementAPI.financeSettle(id, approvalAmount, approvalReason, isApprove) 
                : ReimbursementAPI.managerAction(id, isApprove));
            navigate('/reimbursement/history');
        } catch (err) {
            alert('Audit action failed.');
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel this request? This will permanently delete the claim.")) return;
        setProcessing(true);
        try {
            await ReimbursementAPI.delete(id);
            alert("Request successfully cancelled and deleted.");
            navigate('/reimbursement/history');
        } catch (err) {
            alert("Failed to cancel request. It might have been processed already.");
            setProcessing(false);
        }
    };

    if (loading) return (
        <div style={{ background: '#fdf8f5', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #fed7aa', borderTop: '4px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: '20px', fontStyle: 'italic', fontWeight: 900, fontSize: '12px', color: '#f97316', textTransform: 'uppercase', letterSpacing: '2px' }}>Audit Engine Initializing...</p>
        </div>
    );

    if (error || !claim) return (
            <div style={{ background: 'transparent', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
                <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1f2937', textTransform: 'uppercase' }}>Review Hub Not Found</h1>
                <p style={{ color: '#6b7280', margin: '12px 0 24px 0' }}>{error || 'The requested reimbursement ID does not exist.'}</p>
                <button onClick={() => navigate(-1)} style={{ padding: '12px 24px', background: '#1f2937', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}>Return to Safety</button>
            </div>
        </div>
    );

    const totals = {
        grossTotal: claim.totalAmountClaimed || 0,
        advance: claim.advanceAmount || 0,
        itemCount: (claim.tickets?.length || 0) + (claim.lodgings?.length || 0) + (claim.conveyances?.length || 0) + (claim.foods?.length || 0) + (claim.others?.length || 0) + (claim.wages?.length || 0)
    };

    const galleryData = {
        tickets: (claim.tickets || []).filter(t => t.ticketFile).map(t => ({ date: t.date, label: 'Ticket', file: t.ticketFile, amount: t.amount, note: `${t.travelFrom} → ${t.travelTo}` })),
        lodgings: (claim.lodgings || []).filter(l => l.billFile).map(l => ({ date: l.fromDate, label: 'Lodging', file: l.billFile, amount: l.amount, note: l.location })),
        conveyances: (claim.conveyances || []).filter(c => c.ticketFile).map(c => ({ date: c.date, label: 'Conveyance', file: c.ticketFile, amount: c.amount, note: `${c.locationFrom} → ${c.locationTo}` })),
        foods: (claim.foods || []).filter(f => f.billFile).map(f => ({ date: f.date, label: 'Food', file: f.billFile, amount: f.total, note: 'Daily Food Exp' })),
        others: (claim.others || []).filter(o => o.billFile).map(o => ({ date: o.date, label: 'Misc', file: o.billFile, amount: o.amount, note: o.description }))
    };

    const activeGalleryList = galleryData[previewCategory] || [];
    const activeGalleryItem = activeGalleryList[previewIndex];

    return (
        <div className="apply-container">
            <style>{`
                .apply-container { background: white; height: calc(100vh - 70px); padding: 0; font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; }
                .apply-container::-webkit-scrollbar { display: none; }
                .apply-container * { box-sizing: border-box; }
                .apply-grid { display: grid; gap: 0; width: 100%; height: 100%; grid-template-columns: 1fr; flex: 1; min-height: 0; overflow: hidden; background: #fdf8f5; }
                @media(min-width: 1100px) { .apply-grid { grid-template-columns: ${showPods ? '1fr 340px' : '1fr'}; } }
                
                .scroll-col { padding: 24px 32px !important; border-radius: 0 !important; border: none !important; border-right: 1px solid #fed7aa !important; overflow-y: auto; }
                .scroll-col::-webkit-scrollbar { width: 5px; display: block !important; }
                .scroll-col::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
                .pods-col { background: #fffaf5; padding: 12px; height: 100%; display: flex; flexDirection: column; }
                .inner-scroll { flex: 1; overflow-y: scroll !important; padding-right: 8px; margin-bottom: 12px; }
                .inner-scroll::-webkit-scrollbar { width: 5px; display: block !important; }
                .inner-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .inner-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 1px solid #f1f5f9; }
                .inner-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

                .page-title { font-size: 28px; font-weight: 900; color: #431407; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: -0.5px; }
                .node-card { background: white; border-radius: 24px; box-shadow: 0 10px 30px -15px rgba(249,115,22,0.1); padding: 32px; border: 1px solid #ffedd5; margin-bottom: 24px; }
                .back-btn { background: #fff; border: 2px solid #f3f4f6; color: #6b7280; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; font-size: 10px; text-transform: uppercase; margin-bottom: 12px; }
                .back-btn:hover { border-color: #f97316; color: #f97316; }

                .subject-box { background: #fffaf5; border: 2px solid #fed7aa; border-radius: 10px; padding: 10px 16px; display: flex; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
                .sb-label { font-size: 10px; font-weight: 900; color: #f97316; text-transform: uppercase; letter-spacing: 1px; flex-shrink: 0; }
                .sb-val { font-size: 14px; font-weight: 700; color: #1f2937; flex-grow: 1; }
                .sb-date { display: flex; align-items: center; gap: 8px; border-left: 2px solid #fed7aa; padding-left: 16px; }

                .section-container { margin-bottom: 16px; animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .sec-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 900; color: #431407; margin-bottom: 12px; letter-spacing: 0.5px; }
                .sec-title svg { color: #f97316; }
                .data-wrapper { border: 1.5px solid #d1d5db; border-radius: 12px; overflow-x: auto; overflow-y: hidden; }
                .data-table { width: 100%; border-collapse: collapse; text-align: left; }
                .data-table th { background: #f3f4f6; font-size: 11px; font-weight: 900; color: #606060ff; text-transform: uppercase; letter-spacing: 1px; padding: 12px; border-bottom: 1.5px solid #d1d5db; border-right: 1.5px solid #e5e7eb; }
                .data-table td { background: white; padding: 12px; border-bottom: 1.5px solid #e5e7eb; border-right: 1.5px solid #e5e7eb; font-size: 13px; font-weight: 600; }
                .data-table th:last-child, .data-table td:last-child { border-right: none; }
                .center { text-align: center; } .right { text-align: right; }

                .pod-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
                .pod-tab { flex: 1; padding: 12px; border-radius: 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; cursor: pointer; text-align: center; border: 2px solid transparent; transition: 0.2s; letter-spacing: 1px; }
                .pod-tab.active { background: #fff7ed; color: #f97316; box-shadow: 0 4px 12px rgba(249,115,22,0.1); border-color: #fdba74; }
                .pod-tab.inactive { background: white; color: #6b7280; border: 2px solid #e5e7eb; }
                .pod-tab.inactive:hover { border-color: #f97316; color: #f97316; }

                .pod-header { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 900; color: #1f2937; text-transform: uppercase; margin-bottom: 4px; }
                .pod-sub { font-size: 9px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
                .calc-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #6b7280; margin-bottom: 12px; }
                .divider { height: 1.5px; background: #f3f4f6; margin: 16px 0; }
                .total-owed { font-size: 36px; font-weight: 900; color: #f97316; font-family: monospace; line-height: 1; }

                .verify-zone { background: #0f172a; border-radius: 16px; flex: 1; min-height: 180px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: white; position: relative; overflow: hidden; box-shadow: inset 0 4px 20px rgba(0,0,0,0.5); }
                .vz-image { width: 100%; height: 100%; object-fit: contain; }
                .nd-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #1f2937; margin: 0; }
                .vz-text { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
                .vz-content { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #f97316; }
            `}</style>

            <div className="apply-grid">
                
                {/* LEFT COLUMN */}
                <div className="node-card scroll-col" style={{ padding: '24px 32px', overflowY: 'auto', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button onClick={() => navigate(-1)} className="back-btn" style={{ margin: 0 }}>
                                <ArrowLeft size={16}/>
                            </button>
                            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                REVIEW CLAIM
                                <span style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', letterSpacing: '0px', textTransform: 'none' }}>
                                    #{String(claim.id).padStart(5, '0')}
                                </span>
                            </h1>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <span style={{ padding: '8px 16px', borderRadius: '12px', background: claim.status === 'PENDING' ? '#fff7ed' : '#f0fdf4', color: claim.status === 'PENDING' ? '#f97316' : '#10b981', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', border: '1px solid currentColor' }}>
                                {claim.status}
                            </span>
                            {claim.status === 'PENDING' && (
                                <button onClick={handleCancel} disabled={processing} className="back-btn" style={{ margin: 0, borderColor: '#fee2e2', color: '#ef4444' }}>
                                    <Trash2 size={14}/> CANCEL REQUEST
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                        {isManager && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #94a3b8', flexShrink: 0 }}>
                                {claim.profilePhotoUrl ? (
                                    <img src={claim.profilePhotoUrl.startsWith('http') || claim.profilePhotoUrl.startsWith('data:') ? claim.profilePhotoUrl : `http://localhost:8087${claim.profilePhotoUrl.startsWith('/') ? claim.profilePhotoUrl : `/${claim.profilePhotoUrl}`}`} alt="profile" style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }}>
                                        {claim.employeeName?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div style={{ paddingRight: '8px' }}>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 950, color: '#1e293b' }}>{claim.employeeName || 'Unknown Employee'}</p>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>{claim.employeeCode || 'N/A'}</p>
                                </div>
                            </div>
                        )}

                        <div className="subject-box" style={{ flex: 1, margin: 0, minWidth: '300px', padding: '6px 16px', borderRadius: '8px', gap: '8px' }}>
                            <span className="sb-label" style={{ fontSize: '9px' }}>Project / Reason</span>
                            <div className="sb-val" style={{ color: '#0f172a', fontSize: '13px', fontWeight: 900 }}>{claim.reasonForTravel}</div>
                            <div className="sb-date">
                                <Calendar size={13} color="#f97316"/>
                                <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>{claim.travelStartDate} — {claim.travelEndDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTIONS */}
                    {claim.tickets?.length > 0 && (
                        <div className="section-container">
                            <div className="sec-title">TICKETS DETAILS <FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th>DATE</th><th>FROM</th><th>TO</th><th>MODE</th><th className="right">AMOUNT</th><th className="center">BILL</th></tr></thead>
                                    <tbody>
                                        {claim.tickets.map((r, i) => (
                                            <tr key={i} onClick={() => handleRowClick('tickets', i)} style={{ cursor: 'pointer', background: selectedRowId === `tickets-${i}` ? '#fffaf5' : 'transparent' }}>
                                                <td>{r.date}</td><td>{r.travelFrom}</td><td>{r.travelTo}</td><td>{r.mode}</td><td className="right">₹{r.amount?.toLocaleString()}</td>
                                                <td className="center">{r.ticketFile ? <Paperclip size={14} color="#f97316"/> : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {claim.lodgings?.length > 0 && (
                        <div className="section-container">
                            <div className="sec-title">LODGIND & BOARDING DETAILS <FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th>DATES</th><th>LOCATION</th><th className="center">DAYS</th><th className="right">RATE</th><th className="right">TOTAL</th><th className="center">BILL</th></tr></thead>
                                    <tbody>
                                        {claim.lodgings.map((r, i) => (
                                            <tr key={i} onClick={() => handleRowClick('lodgings', i)} style={{ cursor: 'pointer', background: selectedRowId === `lodgings-${i}` ? '#fffaf5' : 'transparent' }}>
                                                <td>{r.fromDate} → {r.toDate}</td><td>{r.location}</td><td className="center">{r.days}</td><td className="right">₹{r.ratePerPerson?.toLocaleString()}</td><td className="right">₹{r.amount?.toLocaleString()}</td>
                                                <td className="center">{r.billFile ? <Paperclip size={14} color="#f97316"/> : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {claim.conveyances?.length > 0 && (
                        <div className="section-container">
                            <div className="sec-title">LOCAL CONVEYANCE <FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th>DATE</th><th>FROM</th><th>TO</th><th>MODE</th><th className="right">AMOUNT</th><th className="center">BILL</th></tr></thead>
                                    <tbody>
                                        {claim.conveyances.map((r, i) => (
                                            <tr key={i} onClick={() => handleRowClick('conveyances', i)} style={{ cursor: 'pointer', background: selectedRowId === `conveyances-${i}` ? '#fffaf5' : 'transparent' }}>
                                                <td>{r.date}</td><td>{r.locationFrom}</td><td>{r.locationTo}</td><td>{r.modeOfTravel}</td><td className="right">₹{r.amount?.toLocaleString()}</td>
                                                <td className="center">{r.ticketFile ? <Paperclip size={14} color="#f97316"/> : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {claim.foods?.length > 0 && (
                        <div className="section-container">
                            <div className="sec-title">FOOD/PARKING <FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th>DATE</th><th className="center">MORN</th><th className="center">AFT</th><th className="center">EVE</th><th className="center">NIGHT</th><th className="right">TOTAL</th><th className="center">BILL</th></tr></thead>
                                    <tbody>
                                        {claim.foods.map((r, i) => (
                                            <tr key={i} onClick={() => handleRowClick('foods', i)} style={{ cursor: 'pointer', background: selectedRowId === `foods-${i}` ? '#fffaf5' : 'transparent' }}>
                                                <td>{r.date}</td><td className="center">₹{r.morning}</td><td className="center">₹{r.afternoon}</td><td className="center">₹{r.evening}</td><td className="center">₹{r.night}</td><td className="right">₹{r.total?.toLocaleString()}</td>
                                                <td className="center">{r.billFile ? <Paperclip size={14} color="#f97316"/> : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {claim.others?.length > 0 && (
                        <div className="section-container">
                            <div className="sec-title">OTHERS DETAILS <FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th>DATE</th><th>DESCRIPTION</th><th className="right">AMOUNT</th><th className="center">BILL</th></tr></thead>
                                    <tbody>
                                        {claim.others.map((r, i) => (
                                            <tr key={i} onClick={() => handleRowClick('others', i)} style={{ cursor: 'pointer', background: selectedRowId === `others-${i}` ? '#fffaf5' : 'transparent' }}>
                                                <td>{r.date}</td><td>{r.description}</td><td className="right">₹{r.amount?.toLocaleString()}</td>
                                                <td className="center">{r.billFile ? <Paperclip size={14} color="#f97316"/> : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Staff wages removed */}
                </div>

                {/* RIGHT COLUMN */}
                {showPods && (
                    <div className="pods-col" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="pod-tabs">
                            <div className={`pod-tab ${activePod === 'summary' ? 'active' : 'inactive'}`} onClick={() => setActivePod('summary')}>Summary</div>
                            <div className={`pod-tab ${activePod === 'preview' ? 'active' : 'inactive'}`} onClick={() => setActivePod('preview')}>Preview</div>
                        </div>

                        <div className="node-card" style={{ flex: 1, marginBottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 20px' }}>
                            {activePod === 'summary' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <h2 className="pod-header"><FileText size={15}/> Summary </h2>

                                    <div className="inner-scroll" style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', paddingRight: '12px' }}>
                                        {[
                                            { key: 'tickets', label: 'Tickets Total', data: claim.tickets, total: claim.ticketTotal },
                                            { key: 'lodgings', label: 'Lodging Total', data: claim.lodgings, total: claim.lodgingTotal },
                                            { key: 'conveyances', label: 'Local Total', data: claim.conveyances, total: claim.conveyTotal },
                                            { key: 'foods', label: 'Food Total', data: claim.foods, total: claim.foodTotal },
                                            { key: 'others', label: 'Others Total', data: claim.others, total: claim.otherTotal }
                                        ].map((cat) => {
                                            if (!cat.data || cat.data.length === 0) return null;
                                            const isExpanded = expandedCategories[cat.key];
                                            return (
                                                <div key={cat.key} style={{ marginBottom: '8px' }}>
                                                    <div onClick={() => toggleSummaryCategory(cat.key)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>{cat.label}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '12px', fontWeight: 900 }}>₹{(cat.total || 0).toLocaleString()}</span>
                                                            {isExpanded ? <ChevronUp size={12} color="#f97316"/> : <ChevronDown size={12} color="#94a3b8"/>}
                                                        </div>
                                                    </div>
                                                    {isExpanded && (
                                                        <div style={{ padding: '8px 12px', borderLeft: '2px solid #fed7aa', marginLeft: '10px', marginTop: '2px' }}>
                                                            {cat.data.map((item, idx) => (
                                                                <div key={idx} style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span>• {cat.key === 'tickets' ? `${item.mode || 'Travel'}` : cat.key === 'lodgings' ? item.location : item.description || 'Entry'}</span>
                                                                    <span>₹{(item.amount || item.total || item.totalAmount || 0).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="divider" style={{ margin: '0 0 12px 0' }}></div>
                                    <div style={{ background: '#fdfcfb', border: '2px solid #fed7aa', borderRadius: '16px', padding: '12px 16px', marginBottom: '12px' }}>
                                        <div className="calc-row">
                                            <span style={{ fontSize: '14px', fontWeight: 900, color: '#f97316' }}>GROSS TOTAL</span>
                                            <span style={{ fontSize: '22px', fontWeight: 900 }}>₹{totals.grossTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-row" style={{ fontStyle: 'italic' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 800 }}>ADVANCE (-)</span>
                                            <span style={{ fontSize: '18px', fontWeight: 900 }}>₹{totals.advance.toLocaleString()}</span>
                                        </div>
                                        { (totals.grossTotal - totals.advance) < 0 ? (
                                            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 900 }}>AMOUNT TO RETURN</div>
                                                <div className="total-owed" style={{ fontSize: '26px', color: '#ef4444' }}>₹{Math.abs(totals.grossTotal - totals.advance).toLocaleString()}</div>
                                            </div>
                                        ) : (
                                            <div style={{ background: '#f0fdf4', border: '1px solid #dcfce3', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                <div style={{ color: '#16a34a', fontSize: '13px', fontWeight: 900 }}>TOTAL CLAIMS</div>
                                                <div className="total-owed" style={{ fontSize: '26px', color: '#16a34a' }}>₹{(totals.grossTotal - totals.advance).toLocaleString()}</div>
                                            </div>
                                        )}
                                    </div>

                                    {claim.status === 'PENDING' && isManager && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>PAYABLE</span>
                                                <div style={{ position: 'relative', flex: 1 }}>
                                                    <span style={{ position: 'absolute', left: 0, fontWeight: 900, color: '#f97316' }}>₹</span>
                                                    <input type="number" value={approvalAmount} onChange={e => setApprovalAmount(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', paddingLeft: '14px', fontWeight: 900, color: '#1e293b', outline: 'none' }} placeholder="0"/>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleAction(true)} disabled={processing} style={{ flex: 1, padding: '12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '10px', cursor: 'pointer' }}>APPROVE</button>
                                                <button onClick={() => handleAction(false)} disabled={processing} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '10px', cursor: 'pointer' }}>REJECT</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <h2 className="pod-header"><FileText size={18}/> GALLERY PREVIEW</h2>
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
                                        {Object.entries(galleryData).map(([cat, list]) => {
                                            if (list.length === 0) return null;
                                            const isActive = previewCategory === cat;
                                            return (
                                                <button key={cat} onClick={() => { setPreviewCategory(cat); setPreviewIndex(0); }} style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 900, borderRadius: '8px', background: isActive ? '#fff7ed' : '#f3f4f6', color: isActive ? '#f97316' : '#6b7280', border: isActive ? '1px solid #fdba74' : '1px solid transparent', cursor: 'pointer', transition: '0.2s' }}>
                                                    {cat.toUpperCase()} ({list.length})
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="verify-zone">
                                        {activeGalleryItem && activeGalleryItem.file ? (
                                            <>
                                                {activeGalleryList.length > 1 && (
                                                    <div style={{ position: 'absolute', width: '100%', padding: '0 8px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                                                        <button onClick={() => setPreviewIndex(p => p > 0 ? p - 1 : activeGalleryList.length - 1)} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><ChevronLeft/></button>
                                                        <button onClick={() => setPreviewIndex(p => p < activeGalleryList.length - 1 ? p + 1 : 0)} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><ChevronRight/></button>
                                                    </div>
                                                )}
                                                <img src={activeGalleryItem.file} className="vz-image" alt="Receipt"/>
                                                <button onClick={() => setIsFullscreen(true)} style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Maximize size={16}/></button>
                                            </>
                                        ) : (
                                            <div className="vz-content"><EyeOff size={32}/><span className="vz-text">No Images Linked</span></div>
                                        )}
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                        <h4 className="nd-title">Node Details</h4>
                                        <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '8px', fontSize: '11px', fontWeight: 800 }}>
                                            {activeGalleryItem ? `${activeGalleryItem.date} | ${activeGalleryItem.note} | ₹${activeGalleryItem.amount}` : 'Select a row to verify receipt.'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isFullscreen && activeGalleryItem?.file && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <button onClick={() => setIsFullscreen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'white', border: 'none', borderRadius: '50%', padding: '12px' }}><X size={24}/></button>
                    <img src={activeGalleryItem.file} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} alt="Full View"/>
                </div>
            )}
        </div>
    );
};

export default ReimbursementView;
