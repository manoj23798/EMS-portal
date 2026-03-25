import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Eye, Check, X, AlertTriangle, CreditCard } from 'lucide-react';

export default function AdminReimbursementDashboard() {
    const [allClaims, setAllClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [processing, setProcessing] = useState(false);
    
    // Settlement formData
    const [settleAmount, setSettleAmount] = useState('');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reimbursement/all');
            setAllClaims(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch accounts queue');
        } finally {
            setLoading(false);
        }
    };

    const handleSettle = async (claimId) => {
        if (!window.confirm('Are you confirm you want to SETTLE this claim? This action is final.')) return;
        
        try {
            setProcessing(true);
            const payload = {
                approvedAmount: settleAmount ? Number(settleAmount) : null,
                reason: remarks
            };
            await api.put(`/admin/reimbursement/${claimId}/settle`, payload);
            setSelectedClaim(null);
            fetchAll(); 
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to settle claim');
        } finally {
            setProcessing(false);
        }
    };

    const handleAccountsReject = async (claimId) => {
        if (!remarks) {
            alert("Please provide a reason in the remarks field before rejecting.");
            return;
        }
        if (!window.confirm('Are you sure you want to REJECT this claim from Accounts?')) return;
        
        try {
            setProcessing(true);
            const payload = {
                approvedAmount: 0,
                reason: 'ACCOUNTS REJECTED: ' + remarks
            };
            await api.put(`/admin/reimbursement/${claimId}/settle`, payload);
            setSelectedClaim(null);
            fetchAll(); 
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject claim');
        } finally {
            setProcessing(false);
        }
    };

    const openModal = (claim) => {
        setSelectedClaim(claim);
        // Pre-fill with the claimed amount by default to speed up standard approvals
        setSettleAmount(claim.totalClaimed.toString());
        setRemarks('');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading accounts pipeline...</div>;

    return (
        <div className="page-container">
            <div className="page-header border-b-2 border-orange-500 pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Finance Dashboard: Reimbursements</h1>
                <p className="text-gray-500 mt-2">Settle and finalize manager-approved expense reports</p>
            </div>
            
            {error && <div className="error-alert mb-4">{error}</div>}

            <div className="card shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="data-table w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th>Tracking ID</th>
                                <th>Employee</th>
                                <th>Submission Date</th>
                                <th>Total Claimed</th>
                                <th>Amt To Return</th>
                                <th>Status</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allClaims.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
                                        No reimbursement claims found.
                                    </td>
                                </tr>
                            ) : (
                                allClaims.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-orange-50 transition-colors">
                                        <td className="font-mono text-xs font-semibold text-gray-600">REQ-{claim.id.toString().padStart(5, '0')}</td>
                                        <td>
                                            <div className="font-bold">{claim.employeeName}</div>
                                            <div className="text-xs text-gray-500">{claim.employeeCode} - {claim.designation}</div>
                                        </td>
                                        <td>{new Date(claim.submissionDate).toLocaleDateString()}</td>
                                        <td className="font-mono font-bold text-orange-600">₹{claim.totalClaimed.toFixed(2)}</td>
                                        <td className={`font-mono font-bold ${claim.amountToReturn < 0 ? 'text-red-600' : 'text-green-600'}`}>₹{claim.amountToReturn.toFixed(2)}</td>
                                        <td>
                                            {claim.status === 'MANAGER_APPROVED' && <span className="badge bg-blue-100 text-blue-800">Ready to Settle</span>}
                                            {claim.status === 'ACCOUNTS_SETTLED' && <span className="badge bg-green-100 text-green-800">Settled ✓</span>}
                                            {claim.status === 'ACCOUNTS_REJECTED' && <span className="badge bg-red-100 text-red-800">Rejected x</span>}
                                            {claim.status === 'PENDING' && <span className="badge bg-gray-100 text-gray-500">Pending Mgr</span>}
                                        </td>
                                        <td className="text-center">
                                            <button 
                                                onClick={() => openModal(claim)}
                                                className="btn btn-secondary text-xs px-3 py-1 flex items-center inline-flex border"
                                            >
                                                <Eye size={14} className="mr-1" /> {claim.status === 'MANAGER_APPROVED' ? 'Settle' : 'View'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Accounts Settlement Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col border-t-4 border-green-500">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">ACCOUNTS SETTLEMENT: REQ-{selectedClaim.id.toString().padStart(5, '0')}</h2>
                                <p className="text-sm text-gray-500">Submitted by {selectedClaim.employeeName}</p>
                            </div>
                            <button onClick={() => setSelectedClaim(null)} className="text-gray-500 hover:text-black">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full flex-grow flex flex-col md:flex-row gap-6">
                            
                            {/* Left Side: Employee Form Details */}
                            <div className="flex-1 border-r pr-6">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Applicant</p>
                                        <p className="font-semibold">{selectedClaim.employeeName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Travel Details</p>
                                        <p className="font-semibold">{selectedClaim.reasonForTravel}</p>
                                        <p className="text-sm text-gray-600">{selectedClaim.travelStartDate} to {selectedClaim.travelEndDate}</p>
                                    </div>
                                </div>
                                
                                <h3 className="font-bold border-b pb-1 mb-2 text-orange-600 text-sm">Financial Breakdown</h3>
                                <table className="w-full text-xs text-left mb-6 border">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-1 border">Tkt</th>
                                            <th className="p-1 border">Ldg</th>
                                            <th className="p-1 border">Cony</th>
                                            <th className="p-1 border">Food</th>
                                            <th className="p-1 border">Oth</th>
                                            <th className="p-1 border">Wages</th>
                                            <th className="p-1 border bg-orange-100">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="font-mono">
                                            <td className="p-1 border">{selectedClaim.ticketTotal.toFixed(2)}</td>
                                            <td className="p-1 border">{selectedClaim.lodgingTotal.toFixed(2)}</td>
                                            <td className="p-1 border">{selectedClaim.conveyTotal.toFixed(2)}</td>
                                            <td className="p-1 border">{selectedClaim.foodTotal.toFixed(2)}</td>
                                            <td className="p-1 border">{selectedClaim.otherTotal.toFixed(2)}</td>
                                            <td className="p-1 border">{selectedClaim.wageTotal.toFixed(2)}</td>
                                            <td className="p-1 border bg-orange-50 font-bold text-orange-700">{selectedClaim.totalClaimed.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="flex justify-between bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <div>
                                        <span className="text-gray-600 block text-xs">Advance Taken</span>
                                        <span className="font-mono font-bold">₹{selectedClaim.advanceAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-600 block text-xs">Amt to Return/(Due)</span>
                                        <span className={`font-mono font-bold text-xl ${selectedClaim.amountToReturn < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ₹{selectedClaim.amountToReturn.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Side: Accounts Settlement Controller */}
                            <div className="w-full md:w-1/3 flex flex-col pt-4 md:pt-0">
                                <h3 className="font-bold text-green-700 mb-4 flex items-center border-b pb-2"><CreditCard className="mr-2" size={20}/> ACCOUNTS ACTION</h3>
                                
                                {selectedClaim.status !== 'MANAGER_APPROVED' ? (
                                    <div className="bg-gray-100 p-4 rounded text-center text-gray-600 border border-gray-300">
                                        This claim is currently <b>{selectedClaim.status}</b> and cannot be settled right now.
                                        {selectedClaim.accountsApprovedAmount && (
                                            <div className="mt-4 pt-4 border-t border-gray-300">
                                                <p className="text-xs">Previously Settled Amount:</p>
                                                <p className="text-2xl font-mono font-bold text-green-700">₹{selectedClaim.accountsApprovedAmount.toFixed(2)}</p>
                                                <p className="text-sm mt-2">{selectedClaim.accountsReason}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="form-group border-l-4 border-green-500 pl-3">
                                            <label className="font-bold text-sm block mb-1">Final Settled Claimed Amount (₹)</label>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                className="w-full p-2 border border-green-300 rounded font-mono text-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                                value={settleAmount}
                                                onChange={(e) => setSettleAmount(e.target.value)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Change this if Accounts makes deductions.</p>
                                        </div>
                                        
                                        <div className="form-group border-l-4 border-gray-400 pl-3">
                                            <label className="font-bold text-sm block mb-1">Accounts Remarks (Optional)</label>
                                            <textarea 
                                                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-gray-500" 
                                                rows="3"
                                                placeholder="Notes for the employee..."
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                            ></textarea>
                                        </div>

                                        <div className="mt-8 space-y-3">
                                            <button 
                                                disabled={processing}
                                                onClick={() => handleSettle(selectedClaim.id)}
                                                className="w-full btn bg-green-600 hover:bg-green-700 text-white py-3 shadow-md flex justify-center items-center font-bold text-lg"
                                            >
                                                {processing ? 'Processing...' : '✔ MARK AS SETTLED'}
                                            </button>
                                            <button 
                                                disabled={processing}
                                                onClick={() => handleAccountsReject(selectedClaim.id)}
                                                className="w-full text-red-600 hover:bg-red-50 py-2 border border-red-200 rounded text-sm font-bold"
                                            >
                                                ✗ REJECT CLAIM
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
