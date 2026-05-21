import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalItems, pageSize, onPageChange }) {
    const totalPages = Math.ceil(totalItems / pageSize);
    
    if (totalPages <= 1) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button 
                onClick={() => onPageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                style={{
                    height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    color: currentPage === 1 ? '#cbd5e1' : '#64748b',
                    transition: 'all 0.2s'
                }}
            >
                <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
            
            <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', minWidth: 60, textAlign: 'center' }}>
                Page {currentPage} of {totalPages}
            </div>

            <button 
                onClick={() => onPageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                style={{
                    height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    color: currentPage === totalPages ? '#cbd5e1' : '#64748b',
                    transition: 'all 0.2s'
                }}
            >
                <ChevronRight size={14} strokeWidth={2.5} />
            </button>
        </div>
    );
}
