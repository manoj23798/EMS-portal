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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        padding: '24px',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#0f172a',
            margin: 0,
            fontFamily: 'inherit'
          }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={18} />
          </button>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 700,
            color: '#334155',
            marginBottom: '8px',
            textAlign: 'left'
          }}>
            Reason for Rejection <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            style={{
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              color: '#0f172a',
              outline: 'none',
              resize: 'none',
              minHeight: '100px',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit'
            }}
            rows="4"
            placeholder="Please enter the reason for rejection..."
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              if (error) setError("");
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#ef4444'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
          />
          {error && (
            <p style={{
              color: '#ef4444',
              fontSize: '12px',
              fontWeight: 600,
              margin: '6px 0 0 0',
              textAlign: 'left'
            }}>{error}</p>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              backgroundColor: '#f1f5f9',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              backgroundColor: '#ef4444',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
