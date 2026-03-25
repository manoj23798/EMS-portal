import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Eye, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';

export default function ReimbursementHistory() {
    const [reimbursements, setReimbursements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedClaim, setSelectedClaim] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reimbursement/my');
            setReimbursements(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'PENDING': return <span className="badge bg-yellow-100 text-yellow-800 border border-yellow-300"><Clock size={14} className="mr-1"/> Pending MGR</span>;
            case 'MANAGER_APPROVED': return <span className="badge bg-blue-100 text-blue-800 border border-blue-300"><CheckCircle size={14} className="mr-1"/> MGR Approved</span>;
            case 'MANAGER_REJECTED': return <span className="badge bg-red-100 text-red-800 border border-red-300"><XCircle size={14} className="mr-1"/> MGR Rejected</span>;
            case 'ACCOUNTS_SETTLED': return <span className="badge bg-green-100 text-green-800 border border-green-300"><CreditCard size={14} className="mr-1"/> Settled (Paid)</span>;
            case 'ACCOUNTS_REJECTED': return <span className="badge bg-red-100 text-red-800 border border-red-300"><XCircle size={14} className="mr-1"/> HR Rejected</span>;
            default: return <span className="badge bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your reimbursement history...</div>;

    return (
        <div className="page-container">
            <div className="page-header border-b-2 border-orange-500 pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">My Reimbursement Claims</h1>
                <p className="text-gray-500 mt-2">Track the live approval status of your submitted expense reports</p>
            </div>
            
            {error && <div className="error-alert mb-4">{error}</div>}

            <div className="card shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="data-table w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th>Tracking ID</th>
                                <th>Submission Date</th>
                                <th>Travel Reason</th>
                                <th>Total Claimed</th>
                                <th>Status</th>
                                <th>Accounts Settle Amt</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reimbursements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        You have not submitted any reimbursement claims yet.
                                    </td>
                                </tr>
                            ) : (
                                reimbursements.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-orange-50 transition-colors">
                                        <td className="font-mono text-xs font-semibold text-gray-600">REQ-{claim.id.toString().padStart(5, '0')}</td>
                                        <td>{new Date(claim.submissionDate).toLocaleDateString()}</td>
                                        <td className="max-w-xs truncate" title={claim.reasonForTravel}>{claim.reasonForTravel}</td>
                                        <td className="font-mono font-bold text-orange-600">₹{claim.totalClaimed.toFixed(2)}</td>
                                        <td>{getStatusBadge(claim.status)}</td>
                                        <td className="font-mono">{claim.accountsApprovedAmount ? `₹${claim.accountsApprovedAmount.toFixed(2)}` : '---'}</td>
                                        <td className="text-center">
                                            <button 
                                                onClick={() => setSelectedClaim(claim)}
                                                className="btn btn-secondary text-xs px-3 py-1 flex items-center inline-flex"
                                            >
                                                <Eye size={14} className="mr-1" /> View Form
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simple View Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-orange-50">
                            <h2 className="text-xl font-bold text-orange-800">Claim REQ-{selectedClaim.id.toString().padStart(5, '0')} Details</h2>
                            <button onClick={() => setSelectedClaim(null)} className="text-gray-500 hover:text-black">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="card p-3 bg-gray-50 border-0">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Applicant</p>
                                    <p className="font-semibold">{selectedClaim.employeeName} ({selectedClaim.employeeCode})</p>
                                    <p className="text-sm text-gray-600">{selectedClaim.designation}</p>
                                </div>
                                <div className="card p-3 bg-gray-50 border-0">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Travel Details</p>
                                    <p className="font-semibold">{selectedClaim.reasonForTravel}</p>
                                    <p className="text-sm text-gray-600">{selectedClaim.travelStartDate} to {selectedClaim.travelEndDate}</p>
                                </div>
                            </div>
                            
                            <h3 className="font-bold border-b pb-2 mb-4 text-orange-600">Financial Summary</h3>
                            <table className="w-full text-sm text-left mb-6 border">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 border">Tickets</th>
                                        <th className="p-2 border">Lodging</th>
                                        <th className="p-2 border">Conveyance</th>
                                        <th className="p-2 border">Food</th>
                                        <th className="p-2 border">Others</th>
                                        <th className="p-2 border">Wages</th>
                                        <th className="p-2 border bg-orange-100">Total Claimed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="font-mono">
                                        <td className="p-2 border">{selectedClaim.ticketTotal.toFixed(2)}</td>
                                        <td className="p-2 border">{selectedClaim.lodgingTotal.toFixed(2)}</td>
                                        <td className="p-2 border">{selectedClaim.conveyTotal.toFixed(2)}</td>
                                        <td className="p-2 border">{selectedClaim.foodTotal.toFixed(2)}</td>
                                        <td className="p-2 border">{selectedClaim.otherTotal.toFixed(2)}</td>
                                        <td className="p-2 border">{selectedClaim.wageTotal.toFixed(2)}</td>
                                        <td className="p-2 border bg-orange-50 font-bold text-lg text-orange-700">{selectedClaim.totalClaimed.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="flex justify-between bg-yellow-50 p-4 rounded border border-yellow-200">
                                <div>
                                    <span className="text-gray-600 block text-sm">Advance Taken</span>
                                    <span className="font-mono font-bold text-lg">₹{selectedClaim.advanceAmount.toFixed(2)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-gray-600 block text-sm">Amount to be return</span>
                                    <span className={`font-mono font-bold text-2xl ${selectedClaim.amountToReturn < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{selectedClaim.amountToReturn.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            
                            {selectedClaim.accountsReason && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-800">
                                    <p className="font-bold text-sm mb-1">Accounts / HR Remarks:</p>
                                    <p>{selectedClaim.accountsReason}</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
