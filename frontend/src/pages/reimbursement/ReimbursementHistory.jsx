import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    History, 
    Calendar, 
    ArrowRight,
    Receipt,
    ExternalLink,
    Filter,
    BadgeCheck,
    TrendingUp,
    Clock,
    CheckCircle
} from 'lucide-react';
import { ReimbursementAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';
import { useNavigate } from 'react-router-dom';

const ReimbursementHistory = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserClaims = async () => {
            try {
                const response = await ReimbursementAPI.getMyClaims();
                setClaims(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching claims:', err);
                setLoading(false);
            }
        };
        fetchUserClaims();
    }, []);

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

    const filteredClaims = claims.filter(c => 
        c.reasonForTravel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toString().includes(searchTerm)
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff9100]"></div>
        </div>
    );

    return (
        <div className="ux-modern page-content animate-fadeIn">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="ux-heading">My Reimbursements</h1>
                    <p className="ux-subtext flex items-center gap-2">
                        <History size={16} /> Track your ongoing and past expense claims
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find a claim..." 
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#ff9100] outline-none w-56 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => navigate('/reimbursement/apply')}
                        className="ux-btn-primary"
                    >
                        <Plus size={18} strokeWidth={3} />
                        New Claim Request
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Claims', val: claims.length, icon: BadgeCheck, bg: 'bg-blue-50', color: 'text-blue-500' },
                    { label: 'In Review', val: claims.filter(c => c.status === 'PENDING').length, icon: Clock, bg: 'bg-orange-50', color: 'text-orange-500' },
                    { label: 'Settled', val: claims.filter(c => c.status === 'ACCOUNTS_SETTLED').length, icon: CheckCircle, bg: 'bg-green-50', color: 'text-green-500' },
                    { label: 'Total Value', val: `₹${claims.reduce((s, c) => s + (c.totalClaimed || 0), 0).toLocaleString()}`, icon: TrendingUp, bg: 'bg-purple-50', color: 'text-purple-500' }
                ].map((stat, i) => (
                    <div key={i} className="ux-card flex items-center gap-4 border-none shadow-sm">
                        <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Table Card */}
            <div className="ux-card p-0 overflow-hidden shadow-md">
                <table className="ux-table">
                    <thead>
                        <tr>
                            <th className="pl-6">Req ID</th>
                            <th>Reason</th>
                            <th>Date Submitted</th>
                            <th className="text-right">Total Amount</th>
                            <th className="text-right">Advance Amount</th>
                            <th className="text-right">Due Amount</th>
                            <th className="text-center">Status</th>
                            <th className="pr-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClaims.map((claim) => (
                            <tr key={claim.id} className="hover:bg-gray-50/50 transition-all group">
                                <td className="pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#fff4e5] group-hover:text-[#ff9100] transition-colors">
                                            <Receipt size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-400 group-hover:text-gray-900 transition-colors">#{String(claim.id).padStart(5, '0')}</span>
                                    </div>
                                </td>
                                <td>
                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[300px]">{claim.reasonForTravel}</p>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                        <Calendar size={14} className="text-gray-300" />
                                        {new Date(claim.submissionDate).toLocaleDateString()}
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
                                        Details <ExternalLink size={14} className="ml-1" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredClaims.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                            <History size={24} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No History Found</h3>
                        <p className="text-sm text-gray-500 mb-6">You haven't submitted any reimbursement requests yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReimbursementHistory;
