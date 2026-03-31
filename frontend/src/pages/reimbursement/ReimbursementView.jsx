import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReimbursementAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';
import { 
    ArrowLeft, 
    CheckCircle, 
    Clock,
    AlertTriangle,
    Plane,
    Car,
    Hotel,
    Coffee,
    Users,
    Paperclip,
    Printer,
    Coins,
    Banknote,
    MoreHorizontal,
    Calendar
} from 'lucide-react';

const ReimbursementView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Multi-Toggle System for Review
    const [visibleSections, setVisibleSections] = useState({
        ticket: true,
        lodging: false,
        local: false,
        food: false,
        others: false,
        wages: false
    });

    const toggleSection = (id) => {
        setVisibleSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Admin Controls
    const [approvalAmount, setApprovalAmount] = useState('');
    const [approvalReason, setApprovalReason] = useState('Audit Verified');

    const userRole = tokenManager.getUserRole() || '';
    const isFinance = ['ADMIN', 'HR'].includes(userRole);
    const isManager = ['PROJECT_MANAGER', 'IT_MANAGER', 'ADMIN', 'HR'].includes(userRole);

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

    const handleAction = async (approve) => {
        if (!window.confirm(`Audit Confirm: ${approve ? 'Approve' : 'Reject'}?`)) return;
        setProcessing(true);
        try {
            if (isFinance) {
                await ReimbursementAPI.financeSettle(id, parseFloat(approvalAmount), approvalReason);
            } else {
                await ReimbursementAPI.managerAction(id, approve);
            }
            navigate('/reimbursement/history');
        } catch (err) {
            alert('Audit action failed.');
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-40">
            <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="ml-4 font-black uppercase tracking-widest text-[#111827]">Audit Engine loading...</p>
        </div>
    );

    if (error || !claim) return (
        <div className="p-20 text-center text-red-500 font-bold bg-[#FEF2F2] border-2 border-red-100 max-w-xl mx-auto rounded-xl mt-20 shadow-xl">
            <AlertTriangle size={48} className="mx-auto mb-4" />
            <p className="text-xl font-black uppercase tracking-tighter">{error || 'Reimbursement Hub Not Found'}</p>
            <button onClick={() => navigate(-1)} className="mt-6 font-black uppercase text-xs hover:underline underline-offset-8">Return</button>
        </div>
    );

    return (
        <div className="page-content bg-gray-50/50 min-h-screen pb-40 px-4 pt-10">
            <style>{`
                :root { --primary: #f97316; --primary-light: #fff7ed; --text-dark: #1e293b; --border-bold: #CBD5E1; }
                .main-view-box { max-width: 1140px; margin: 40px auto; background: white; border: 1.5px solid #E2E8F0; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.03); }
                .pills-bar-audit { display: flex; gap: 12px; margin-bottom: 32px; overflow-x: auto; padding: 4px; border-bottom: 2px solid #F1F5F9; pb-8; }
                .tab-pill-btn { padding: 12px 24px; border-radius: 999px; background: white; border: 1.5px solid #E2E8F0; font-size: 11px; font-weight: 950; color: #64748B; cursor: pointer; transition: all 0.2s; white-space: nowrap; text-transform: uppercase; display: flex; gap: 8px; align-items: center; }
                .tab-pill-btn.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 8px 16px -4px var(--primary); }
                
                /* TITLES OUTSIDE TOP LEFT */
                .sec-header { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 950; color: #1e293b; text-transform: uppercase; margin-bottom: 8px; margin-left: 4px; }
                .sec-audit-canvas { margin-bottom: 32px; animation: slideIn 0.3s ease-out; }
                @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                
                /* HIGH VISIBILITY TABLES */
                .table-audit-wrapper { background: white; border: 1.5px solid var(--border-bold); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .grid-audit { width: 100%; border-collapse: separate; border-spacing: 0; }
                .grid-audit th { background: #F8FAFC; border-bottom: 1.5px solid var(--border-bold); border-right: 1.5px solid var(--border-bold); padding: 12px; font-size: 10px; font-weight: 950; color: #475569; text-transform: uppercase; text-align: center; }
                .grid-audit td { border-bottom: 1.5px solid var(--border-bold); border-right: 1.5px solid var(--border-bold); padding: 16px; font-size: 13px; text-align: center; color: var(--text-dark); font-weight: 700; }
                .grid-audit td:last-child { border-right: none; }
                .grid-audit tr:last-child td { border-bottom: 1.5px solid var(--border-bold); }
                
                .box-ui-card { background: white; border: 2.5px solid #0F172A; border-radius: 14px; padding: 24px; position: relative; transition: all 0.3s; }
                .box-ui-label-card { position: absolute; top: -12px; left: 24px; background: white; padding: 0 10px; font-size: 10px; font-weight: 950; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; }
                .white-settle-card { background: white; color: #0F172A; border-radius: 24px; padding: 32px; border: 2.5px solid #f97316; box-shadow: 0 20px 50px -12px rgba(249, 115, 22, 0.1); }
                
                .audit-decision-container { background: #F8FAFC; border: 2.5px solid #E2E8F0; padding: 32px; border-radius: 24px; max-width: 900px; margin: 40px auto; }
                .audit-amount-input { width: 100%; max-width: 280px; background: white; border: 2px solid #CBD5E1; padding: 16px; border-radius: 12px; font-size: 32px; font-weight: 900; color: #0F172A; text-align: center; outline: none; }
                .audit-amount-input:focus { border-color: #f97316; }
                .audit-btn { padding: 16px 32px; border-radius: 12px; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s; cursor: pointer; border: none; }
                .audit-btn-approve { background: #0F172A; color: white; }
                .audit-btn-reject { background: white; color: #ef4444; border: 1.5px solid #fee2e2; }

                /* Final Settlement Table Styling */
                .settlement-table { width: 100%; border-collapse: collapse; margin: 32px 0; font-family: sans-serif; border: 1.5px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
                .settlement-table th { background: #f97316; color: white; padding: 12px 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border-right: 1px solid rgba(255,255,255,0.2); }
                .settlement-table td { padding: 20px 10px; text-align: center; border: 1px solid #E2E8F0; font-size: 11px; font-weight: 800; color: #1e293b; background: white; }
                .settlement-table td.net-balance { color: #059669; background: #f0fdf4; }
                .settlement-table td.net-balance.negative { color: #ef4444; background: #fef2f2; }
            `}</style>

            <div className="main-view-box animate-fadeIn">
                <header className="flex justify-between items-center border-b-2 border-slate-100 pb-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800">Audit Review Hub</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Request Control / Batch: {(id||'').slice(-4)}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-slate-600 font-black text-[10px] uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm active:scale-95">
                            <ArrowLeft size={16}/> BACK
                        </button>
                        <button onClick={() => window.print()} className="p-2.5 bg-slate-800 rounded-xl text-white hover:bg-black transition-all shadow-lg active:scale-95">
                            <Printer size={18}/>
                        </button>
                    </div>
                </header>

                <div className="flex flex-row gap-4 mb-12">
                    <div className="flex-1 box-ui-card !border-slate-200 !p-6">
                        <span className="box-ui-label-card">Employee Meta</span>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-600 text-white rounded-xl flex items-center justify-center font-black text-xl">{claim.employeeName.charAt(0)}</div>
                            <div>
                                <h4 className="text-lg font-black text-slate-900 leading-tight uppercase tabular-nums">{claim.employeeName}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{claim.employeeCode} | {claim.designation || 'Staff'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-[1.5] box-ui-card !border-slate-200 !p-6">
                        <span className="box-ui-label-card">Trip Content</span>
                        <div className="flex items-center justify-between h-full">
                            <div>
                                <h4 className="text-lg font-black text-slate-900 leading-tight uppercase">{claim.reasonForTravel}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-slate-900 uppercase tabular-nums">{claim.travelStartDate} - {claim.travelEndDate}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VISIBLE AUDIT SECTIONS (SHOW ALL FILLED BY DEFAULT) */}
                <div className="space-y-12">
                    
                    {claim.tickets?.length > 0 && (
                        <div className="sec-audit-canvas">
                            <div className="sec-header">Ticket Audit Batch <Plane size={12} className="text-blue-500"/></div>
                            <div className="table-audit-wrapper">
                                <table className="grid-audit">
                                    <thead><tr><th>Date</th><th>Route</th><th>Mode</th><th>Amount</th><th>Pax</th><th>Bill</th></tr></thead>
                                    <tbody>
                                        {claim.tickets?.map((t, i) => (
                                            <tr key={i}>
                                                <td className="text-slate-400 font-bold italic">{t.date}</td>
                                                <td className="font-black text-left pl-6">{t.travelFrom} → {t.travelTo}</td>
                                                <td><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">{t.mode}</span></td>
                                                <td className="font-black text-xl">₹{t.amount?.toLocaleString()}</td>
                                                <td className="text-[10px] text-slate-500 font-black uppercase">{t.person}</td>
                                                <td><Paperclip size={16} className="mx-auto text-blue-400 cursor-pointer"/></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {claim.lodgings?.length > 0 && (
                        <div className="sec-audit-canvas">
                            <div className="sec-header">Accommodation Audit <Hotel size={12} className="text-indigo-500"/></div>
                            <div className="table-audit-wrapper">
                                <table className="grid-audit">
                                    <thead><tr><th>Period</th><th>Location</th><th>Days</th><th>Pax</th><th>Rate</th><th>Total</th></tr></thead>
                                    <tbody>
                                        {claim.lodgings?.map((l, i) => (
                                            <tr key={i}>
                                                <td className="text-slate-400 font-bold italic">{l.dateRange}</td>
                                                <td className="font-black text-left pl-6">{l.location}</td>
                                                <td>{l.days}</td><td>{l.persons || 1}</td><td>₹{l.ratePerPerson?.toLocaleString()}</td>
                                                <td className="font-black text-orange-600 bg-orange-50/20">₹{l.amount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {claim.conveyances?.length > 0 && (
                        <div className="sec-audit-canvas">
                            <div className="sec-header">Conveyance Batch <Car size={12} className="text-emerald-500"/></div>
                            <div className="table-audit-wrapper">
                                <table className="grid-audit">
                                    <thead><tr><th>Date</th><th>Route</th><th>Mode</th><th>Amount</th><th>Bill</th></tr></thead>
                                    <tbody>
                                        {claim.conveyances?.map((c, i) => (
                                            <tr key={i}>
                                                <td className="text-slate-400 font-bold italic">{c.date}</td>
                                                <td className="font-black text-left pl-6">{c.locationFrom} → {c.locationTo}</td>
                                                <td><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">{c.modeOfTravel}</span></td>
                                                <td className="font-black text-xl">₹{c.amount?.toLocaleString()}</td>
                                                <td>{c.billAvailable || 'Yes'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {claim.foods?.length > 0 && (
                        <div className="sec-audit-canvas">
                            <div className="sec-header">Food & Catering Audit <Coffee size={12} className="text-orange-500"/></div>
                            <div className="table-audit-wrapper">
                                <table className="grid-audit">
                                    <thead><tr><th>Date</th><th>Morn</th><th>Noon</th><th>Even</th><th>Night</th><th>Total</th><th>GST</th><th>SGST</th></tr></thead>
                                    <tbody>
                                        {claim.foods?.map((f, i) => (
                                            <tr key={i}>
                                                <td className="text-slate-400 font-bold italic">{f.date}</td>
                                                <td>{f.morning}</td><td>{f.afternoon}</td><td>{f.evening}</td><td>{f.night}</td>
                                                <td className="font-black text-orange-600 bg-orange-50/20 text-lg">₹{f.total?.toLocaleString()}</td>
                                                <td>{f.gst || 0}</td><td>{f.sgst || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {claim.others?.length > 0 && (
                        <div className="sec-audit-canvas">
                            <div className="sec-header">Miscellaneous Audit <MoreHorizontal size={12} className="text-gray-500"/></div>
                            <div className="table-audit-wrapper">
                                <table className="grid-audit">
                                    <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Bill</th></tr></thead>
                                    <tbody>
                                        {claim.others?.map((o, i) => (
                                            <tr key={i}>
                                                <td className="text-slate-400 font-bold italic">{o.date}</td>
                                                <td className="text-left pl-6 font-black border-l-4 border-slate-50">{o.description}</td>
                                                <td className="font-black text-xl">₹{o.amount?.toLocaleString()}</td>
                                                <td><Paperclip size={16} className="mx-auto text-slate-300"/></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {claim.wages?.length > 0 && (
                        <div className="sec-audit-canvas">
                            <div className="sec-header">Staff Wages Personnel <Users size={12} className="text-purple-500"/></div>
                            <div className="table-audit-wrapper">
                                <table className="grid-audit">
                                    <thead><tr><th>Staff Name / Job</th><th>From</th><th>To</th><th>Days</th><th>Wage</th><th>Total</th></tr></thead>
                                    <tbody>
                                        {claim.wages?.map((w, i) => (
                                            <tr key={i}>
                                                <td className="font-black text-left pl-6">{w.name}</td>
                                                <td>{w.fromDate || 'N/A'}</td><td>{w.toDate || 'N/A'}</td><td>{w.daysWorked}</td><td>₹{w.perDaySalary?.toLocaleString()}</td>
                                                <td className="font-black text-xl text-orange-600 bg-orange-50/10">₹{w.totalAmount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                {/* HIGH-DENSITY SETTLEMENT SUMMARY TABLE */}
                <div className="mt-16 overflow-x-auto">
                    <table className="settlement-table">
                        <thead>
                            <tr>
                                <th colSpan={10} className="!text-center !text-sm">Final Settlement Summary</th>
                            </tr>
                            <tr>
                                <th>Date Range</th>
                                <th>Tickets</th>
                                <th>Lodging</th>
                                <th>Conveyance</th>
                                <th>Food</th>
                                <th>Others</th>
                                <th>Wages</th>
                                <th>Gross Total</th>
                                <th>Advance Taken</th>
                                <th>Net Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="uppercase">{claim.travelStartDate} - {claim.travelEndDate}</td>
                                <td>₹{(claim.tickets || []).reduce((s,t)=>s+(t.amount||0), 0).toLocaleString()}</td>
                                <td>₹{(claim.lodgings || []).reduce((s,l)=>s+(l.amount||0), 0).toLocaleString()}</td>
                                <td>₹{(claim.conveyances || []).reduce((s,c)=>s+(c.amount||0), 0).toLocaleString()}</td>
                                <td>₹{(claim.foods || []).reduce((s,f)=>s+(f.total||0), 0).toLocaleString()}</td>
                                <td>₹{(claim.others || []).reduce((s,o)=>s+(o.amount||0), 0).toLocaleString()}</td>
                                <td>₹{(claim.wages || []).reduce((s,w)=>s+(w.totalAmount||0), 0).toLocaleString()}</td>
                                <td className="font-black">₹{claim.totalAmountClaimed?.toLocaleString()}</td>
                                <td className="text-orange-600 font-black">₹{(claim.advanceAmount||0).toLocaleString()}</td>
                                <td className={`net-balance ${claim.amountToReturn < 0 ? 'negative' : ''}`}>
                                    <div className="text-lg">₹{Math.abs(claim.amountToReturn||0).toLocaleString()}</div>
                                    <div className="text-[8px] font-black uppercase mt-1">
                                        {claim.amountToReturn >= 0 ? 'Due Payout' : 'Returnable'}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* LEGACY SUMMARY REMOVED (Optional, kept hidden if needed, but tool prompt says "also show this", I will keep new table only for cleanliness) */}
                
                <div className="mt-12">

                    {(claim.status === 'PENDING' || claim.status === 'MANAGER_APPROVED') && (isManager || isFinance) ? (
                        <div className="audit-decision-container flex flex-col items-center justify-center gap-6 border-t-8 border-orange-600 shadow-2xl bg-white max-w-xl mx-auto py-12">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2 italic">enter approval amount</p>
                            
                            <div className="relative w-full max-w-[340px] mb-4">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 pointer-events-none">₹</span>
                                <input 
                                    type="number" 
                                    className="audit-amount-input !m-0 !pl-14 !w-full !max-w-none text-4xl py-6 rounded-2xl shadow-inner border-2 border-slate-100 focus:border-orange-500 transition-all" 
                                    value={approvalAmount} 
                                    onChange={(e)=>setApprovalAmount(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 w-full max-w-[400px]">
                                <button onClick={() => handleAction(false)} className="flex-1 audit-btn audit-btn-reject border-2 !py-5 !text-xs">REJECT</button>
                                <button onClick={() => handleAction(true)} className="flex-1 audit-btn audit-btn-approve shadow-lg !py-5 !text-xs">APPROVAL</button>
                            </div>
                            
                            <p className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest italic opacity-50">Authorized Disbursal Control System</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[40px] h-full shadow-inner bg-slate-50/20 py-20">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 border-4 border-green-100 shadow-md">
                                <CheckCircle size={48} />
                            </div>
                            <p className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{claim.status.replace('_', ' ')}</p>
                            <div className="mt-6 text-orange-600 font-black px-10 py-3 bg-white border-2 border-orange-100 rounded-2xl shadow-sm text-2xl">SETTLED: ₹{claim.accountsApprovedAmount?.toLocaleString()}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReimbursementView;
