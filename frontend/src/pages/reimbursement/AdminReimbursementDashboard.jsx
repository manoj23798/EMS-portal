import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    ArrowRight,
    User,
    Calendar,
    Receipt,
    ClipboardList,
    TrendingUp,
    CheckCircle,
    Clock,
    ShieldCheck,
    ArrowUpDown,
    ChevronDown,
    RotateCcw,
    Download,
    Printer,
    FileDown
} from 'lucide-react';
import { ReimbursementAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';
import { useNavigate } from 'react-router-dom';

const AdminReimbursementDashboard = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('DATE_DESC');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const navigate = useNavigate();

    const userRole = tokenManager.getUserRole() || '';
    const isManager = ['PROJECT_MANAGER', 'IT_MANAGER', 'ADMIN', 'HR'].includes(userRole);
    const isFinance = ['ADMIN', 'HR'].includes(userRole);

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                let allClaims = [];
                // Manager check
                if (isManager) {
                    const managerRes = await ReimbursementAPI.getManagerPending();
                    allClaims = [...allClaims, ...managerRes.data];
                }
                // Admin/Finance check
                if (isFinance) {
                    const adminRes = await ReimbursementAPI.getAdminAll();
                    // Merge and unique by ID
                    const existingIds = new Set(allClaims.map(c => c.id));
                    adminRes.data.forEach(c => {
                        if (!existingIds.has(c.id)) allClaims.push(c);
                    });
                }
                
                setClaims(allClaims);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching claims:', err);
                setLoading(false);
            }
        };
        fetchClaims();
    }, [isManager, isFinance]);
    
    // Debug log to verify data fields from backend
    useEffect(() => {
        if (claims.length > 0) {
            console.log("Admin Dashboard Data Sample:", claims[0]);
        }
    }, [claims]);

    const getStatusTheme = (status) => {
        const themes = {
            'PENDING': 'badge-pending',
            'MANAGER_APPROVED': 'badge-warning',
            'ACCOUNTS_SETTLED': 'badge-success',
            'MANAGER_REJECTED': 'badge-danger',
            'ACCOUNTS_REJECTED': 'badge-danger'
        };
        return themes[status] || 'badge-pending';
    };

    const processedClaims = [...claims]
        .filter(c => {
            // Robust check: Search in any top-level string/number field
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || Object.keys(c).some(key => {
                const val = c[key];
                if (val === null || val === undefined) return false;
                // Search in nested objects like 'user' if they exist
                if (typeof val === 'object') {
                    return Object.values(val).some(v => String(v).toLowerCase().includes(searchLower));
                }
                return String(val).toLowerCase().includes(searchLower);
            });
            
            const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
            
            const matchesDate = (() => {
                if (!startDate && !endDate) return true;
                if (!c.submissionDate) return true; // Don't hide records just because they lack dates
                const d = new Date(c.submissionDate);
                const s = startDate ? new Date(startDate) : new Date('1970-01-01');
                const e = endDate ? new Date(endDate) : new Date('2100-01-01');
                e.setHours(23, 59, 59); 
                return d >= s && d <= e;
            })();
            
            return matchesSearch && matchesStatus && matchesDate;
        })
        .sort((a, b) => {
            if (sortBy === 'DATE_DESC') {
                const dateDiff = new Date(b.submissionDate || 0) - new Date(a.submissionDate || 0);
                if (dateDiff === 0) return b.id - a.id; // Secondary sort by ID desc
                return dateDiff;
            }
            if (sortBy === 'DATE_ASC') {
                const dateDiff = new Date(a.submissionDate || 0) - new Date(b.submissionDate || 0);
                if (dateDiff === 0) return a.id - b.id; // Secondary sort by ID asc
                return dateDiff;
            }
            if (sortBy === 'AMOUNT_DESC') return (b.totalAmountClaimed || b.totalClaimed || 0) - (a.totalAmountClaimed || a.totalClaimed || 0);
            if (sortBy === 'AMOUNT_ASC') return (a.totalAmountClaimed || a.totalClaimed || 0) - (b.totalAmountClaimed || b.totalClaimed || 0);
            return 0;
        });

    const handleExport = () => {
        if (processedClaims.length === 0) return;
        
        const headers = ["Req ID", "Employee", "Emp Code", "Reason", "Travel Start", "Travel End", "Amount", "Advance", "Due", "Status", "Submitted"];
        const csvRows = processedClaims.map(c => [
            c.id,
            c.employeeName,
            c.employeeCode,
            `"${c.reasonForTravel}"`,
            c.travelStartDate,
            c.travelEndDate,
            c.totalAmountClaimed || c.totalClaimed,
            c.advanceAmount || 0,
            c.amountToReturn || 0,
            c.status,
            c.submissionDate
        ].join(","));
        
        // Add UTF-8 BOM for Excel compatibility (ensures Rupee symbol and special charts display correctly)
        const csvContent = "\ufeff" + [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reimbursement_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff9100]"></div>
        </div>
    );

    return (
        <div className="ux-modern page-content animate-fadeIn !max-w-none px-6">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="ux-heading">Admin Reimbursement</h1>
                    <p className="ux-subtext flex items-center gap-2">
                    <ShieldCheck size={16} /> Centralized management for employee reimbursement claims
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff9100] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search Name, ID, Reason..." 
                            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#ff9100] focus:ring-4 focus:ring-orange-50 outline-none w-72 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status:</span>
                    </div>
                    
                    <select 
                        className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#ff9100] cursor-pointer shadow-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="MANAGER_APPROVED">Approved</option>
                        <option value="ACCOUNTS_SETTLED">Settled</option>
                        <option value="ACCOUNTS_REJECTED">Rejected</option>
                    </select>

                    <div className="mx-2 h-4 w-px bg-gray-200"></div>

                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Range:</span>
                        <input type="date" className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <span className="text-gray-400">-</span>
                        <input type="date" className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1d6f42] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#155331] transition-all shadow-md active:scale-95"
                    >
                        <FileDown size={14} /> EXPORT TO EXCEL
                    </button>

                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={14} className="text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sort By:</span>
                    </div>

                    <select 
                        className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#ff9100] cursor-pointer shadow-sm min-w-[140px]"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="DATE_DESC">Newest First</option>
                        <option value="DATE_ASC">Oldest First</option>
                        <option value="AMOUNT_DESC">Highest Amount</option>
                        <option value="AMOUNT_ASC">Lowest Amount</option>
                    </select>

                    <button 
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                            setSortBy('DATE_DESC');
                            setStartDate('');
                            setEndDate('');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:text-[#ff9100] transition-colors"
                    >
                        <RotateCcw size={14} /> RESET
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Requests', val: claims.length, icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Pending Review', val: claims.filter(c => c.status === 'PENDING' || c.status === 'MANAGER_APPROVED').length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { label: 'Settled', val: claims.filter(c => c.status === 'ACCOUNTS_SETTLED').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
                    { label: 'Total Payout', val: `₹${claims.reduce((s, c) => s + (c.accountsApprovedAmount || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <div key={i} className="ux-card flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-xl font-bold text-gray-900">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Table Card */}
            <div className="ux-card p-0 overflow-x-auto shadow-md">
                <table className="ux-table min-w-full">
                    <thead>
                        <tr>
                            <th className="pl-6">Req ID</th>
                            <th>Employee Details</th>
                            <th>Reason</th>
                            <th>Travel Period</th>
                            <th>Submitted</th>
                            <th className="text-right">Total Amount</th>
                            <th className="text-right">Advance Amount</th>
                            <th className="text-right">Due Amount</th>
                            <th className="text-center">Status</th>
                            <th className="pr-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedClaims.map((claim) => (
                            <tr key={claim.id} className="hover:bg-gray-50/50 transition-all group">
                                <td className="pl-6 text-sm font-bold text-gray-400 tracking-tight">#{String(claim.id).padStart(5, '0')}</td>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#fff4e5] group-hover:text-[#ff9100] transition-colors">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">{claim.employeeName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                                {claim.employeeCode} <span className="opacity-20 mx-1">|</span> {claim.username || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p className="text-sm font-black text-gray-900 leading-tight uppercase min-w-[200px]">{claim.reasonForTravel}</p>
                                </td>
                                <td>
                                    <div className="text-[11px] font-bold text-gray-500 tracking-tight leading-normal whitespace-nowrap">
                                        {(() => {
                                            const f = (d) => {
                                                if (!d) return 'N/A';
                                                const parts = d.split('-');
                                                if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0].slice(-2)}`;
                                                return d;
                                            };
                                            return `${f(claim.travelStartDate)} To ${f(claim.travelEndDate)}`;
                                        })()}
                                    </div>
                                </td>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                            <ClipboardList size={16} />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 whitespace-nowrap">
                                            {claim.submissionDate ? claim.submissionDate.split('-').reverse().join('-') : 'N/A'}
                                        </p>
                                    </div>
                                </td>
                                <td className="text-right text-sm font-black text-gray-900">
                                    ₹{(claim.totalAmountClaimed || claim.totalClaimed || 0).toLocaleString()}
                                </td>
                                <td className="text-right text-sm font-black text-red-500">
                                    ₹{(claim.advanceAmount || 0).toLocaleString()}
                                </td>
                                <td className="text-right text-sm font-black text-gray-900">
                                    ₹{Math.abs(claim.amountToReturn || 0).toLocaleString()}
                                </td>
                                <td className="text-center">
                                    <span className={`ux-badge ${getStatusTheme(claim.status)}`}>
                                        {claim.status === 'PENDING' ? 'Pending' : 
                                         (['MANAGER_APPROVED', 'ACCOUNTS_SETTLED'].includes(claim.status) ? 'Approved' : 'Reject')}
                                    </span>
                                </td>
                                <td className="pr-6 text-right">
                                    <button 
                                        onClick={() => navigate(`/reimbursement/view/${claim.id}`)}
                                        className="ux-btn-ghost text-xs group-hover:bg-[#fff4e5] group-hover:text-[#ff9100]"
                                    >
                                        Review Details <ArrowRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {processedClaims.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                            <Search size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Records Found</h3>
                        <p className="text-sm text-gray-500">We couldn't find any reimbursement requests matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReimbursementDashboard;
