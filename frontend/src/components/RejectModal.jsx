import React, { useState } from 'react';
import { X } from 'lucide-react';

const RejectModal = ({ isOpen, onClose, onReject, title = "Reject Request" }) => {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleReject = () => {
    if (!remarks.trim()) {
      setError("Remarks are required to reject a request.");
      return;
    }
    setError("");
    onReject(remarks);
    setRemarks("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white/90">{title}</h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/70 mb-2">
            Reason for Rejection <span className="text-red-400">*</span>
          </label>
          <textarea
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
            rows="4"
            placeholder="Please enter the reason for rejection..."
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              if (error) setError("");
            }}
          />
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/80 hover:bg-red-500 text-white transition-colors"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
