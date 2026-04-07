import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Eye, Check, X, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function ManagerReimbursementDashboard() {
    const [pendingClaims, setPendingClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [processing, setProcessing] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 8;

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const response = await api.get('/manager/reimbursement/pending');
            setPendingClaims(response.data);
            setCurrentPage(1);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch pending reimbursements');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (claimId, approve) => {
        if (!window.confirm(`Are you sure you want to ${approve ? 'APPROVE' : 'REJECT'} this reimbursement claim?`)) return;
        
        try {
            setProcessing(true);
            await api.put(`/manager/reimbursement/${claimId}/approve`, { approve });
            setSelectedClaim(null);
            fetchPending(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${approve ? 'approve' : 'reject'} claim`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading pending approvals...</div>;

    return (
        <div className="page-container">
            <div className="page-header border-b-2 border-orange-500 pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manager Approvals: Reimbursements</h1>
                <p className="text-gray-500 mt-2">Review and approve employee expense reports</p>
            </div>
            
            {error && <div className="error-alert mb-4">{error}</div>}

            <div className="card shadow-sm border border-gray-200" style={{ minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
                <div className="overflow-x-auto" style={{ flex: 1 }}>
                    <table className="data-table w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th>Tracking ID</th>
                                <th>Employee</th>
                                <th>Submission Date</th>
                                <th>Project/Reason</th>
                                <th>Total Claimed</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingClaims.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
                                        No pending reimbursement claims to review.
                                    </td>
                                </tr>
                            ) : (
                                pendingClaims.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((claim) => (
                                    <tr key={claim.id} className="hover:bg-orange-50 transition-colors">
                                        <td className="font-mono text-xs font-semibold text-gray-600">REQ-{claim.id.toString().padStart(5, '0')}</td>
                                        <td>
                                            <div className="font-bold">{claim.employeeName}</div>
                                            <div className="text-xs text-gray-500">{claim.employeeCode} - {claim.designation}</div>
                                        </td>
                                        <td>{new Date(claim.submissionDate).toLocaleDateString()}</td>
                                        <td className="max-w-xs" title={claim.reasonForTravel}>
                                            <div className="font-bold">{claim.reasonForTravel}</div>
                                            {(claim.travelStartDate || claim.travelEndDate) && (
                                                <div className="text-[10px] text-gray-500 font-semibold mt-1">
                                                    {claim.travelStartDate?.split('-').reverse().join('-') || '...'} - {claim.travelEndDate?.split('-').reverse().join('-') || '...'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="font-mono font-bold text-orange-600">₹{(claim.totalClaimed || 0).toFixed(2)}</td>
                                        <td className="text-center">
                                            <button 
                                                onClick={() => setSelectedClaim(claim)}
                                                className="btn btn-primary text-xs px-3 py-1 flex items-center inline-flex bg-blue-600 hover:bg-blue-700 text-white border-0"
                                            >
                                                <Eye size={14} className="mr-1" /> Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pendingClaims.length > 0 && (
                    <div style={{ padding: '4px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #fed7aa', background: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(1)} 
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #fed7aa', background: 'white', color: '#431407', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                            >
                                <ChevronsLeft size={14} />
                            </button>
                            <button 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(p => p - 1)} 
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #fed7aa', background: 'white', color: '#431407', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={14} />
                            </button>

                            {Array.from({ length: Math.ceil(pendingClaims.length / rowsPerPage) }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === Math.ceil(pendingClaims.length / rowsPerPage) || (p >= currentPage - 1 && p <= currentPage + 1))
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i-1] !== p - 1 && <span style={{ color: '#fed7aa', fontSize: '10px' }}>...</span>}
                                        <button 
                                            onClick={() => setCurrentPage(p)}
                                            style={{
                                                width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid',
                                                borderColor: currentPage === p ? '#f97316' : '#fed7aa',
                                                background: currentPage === p ? '#f97316' : 'white',
                                                color: currentPage === p ? 'white' : '#431407',
                                                fontSize: '10px', fontWeight: 900, cursor: 'pointer', transition: '0.2s',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: currentPage === p ? '0 4px 10px rgba(249,115,22,0.2)' : 'none'
                                            }}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}

                            <button 
                                disabled={currentPage === Math.ceil(pendingClaims.length / rowsPerPage)} 
                                onClick={() => setCurrentPage(p => p + 1)} 
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #fed7aa', background: 'white', color: '#431407', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === Math.ceil(pendingClaims.length / rowsPerPage) ? 0.3 : 1 }}
                            >
                                <ChevronRight size={14} />
                            </button>
                            <button 
                                disabled={currentPage === Math.ceil(pendingClaims.length / rowsPerPage)} 
                                onClick={() => setCurrentPage(Math.ceil(pendingClaims.length / rowsPerPage))} 
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #fed7aa', background: 'white', color: '#431407', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === Math.ceil(pendingClaims.length / rowsPerPage) ? 0.3 : 1 }}
                            >
                                <ChevronsRight size={14} />
                            </button>
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ( {Math.min(rowsPerPage, pendingClaims.length - (currentPage - 1) * rowsPerPage)} of {pendingClaims.length} )
                        </div>
                    </div>
                )}
            </div>

            {/* Manager Review Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border-t-4 border-blue-500">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Review Claim: REQ-{selectedClaim.id.toString().padStart(5, '0')}</h2>
                                <p className="text-sm text-gray-500">Submitted by {selectedClaim.employeeName}</p>
                            </div>
                            <button onClick={() => setSelectedClaim(null)} className="text-gray-500 hover:text-black">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full flex-grow">
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
                                        <td className="p-2 border">{(selectedClaim.ticketTotal || 0).toFixed(2)}</td>
                                        <td className="p-2 border">{(selectedClaim.lodgingTotal || 0).toFixed(2)}</td>
                                        <td className="p-2 border">{(selectedClaim.conveyTotal || 0).toFixed(2)}</td>
                                        <td className="p-2 border">{(selectedClaim.foodTotal || 0).toFixed(2)}</td>
                                        <td className="p-2 border">{(selectedClaim.otherTotal || 0).toFixed(2)}</td>
                                        <td className="p-2 border">{(selectedClaim.wageTotal || 0).toFixed(2)}</td>
                                        <td className="p-2 border bg-orange-50 font-bold text-lg text-orange-700">{(selectedClaim.totalClaimed || 0).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="flex justify-between bg-yellow-50 p-4 rounded border border-yellow-200">
                                <div>
                                    <span className="text-gray-600 block text-sm">Advance Taken</span>
                                    <span className="font-mono font-bold text-lg">₹{(selectedClaim.advanceAmount || 0).toFixed(2)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-gray-600 block text-sm">Amount to be return / (Due)</span>
                                    <span className={`font-mono font-bold text-2xl ${selectedClaim.amountToReturn < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{(selectedClaim.amountToReturn || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Footer */}
                        <div className="p-4 bg-gray-50 border-t flex justify-end gap-4 mt-auto">
                            <button 
                                disabled={processing}
                                onClick={() => handleAction(selectedClaim.id, false)}
                                className="btn border border-red-500 text-red-600 hover:bg-red-50 px-6 py-2 flex items-center"
                            >
                                <X className="mr-2" size={18} /> Reject Claim
                            </button>
                            <button 
                                disabled={processing}
                                onClick={() => handleAction(selectedClaim.id, true)}
                                className="btn bg-green-600 hover:bg-green-700 text-white px-6 py-2 flex items-center shadow-md"
                            >
                                {processing ? <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> : <Check className="mr-2" size={18} />}
                                Approve Claim
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
