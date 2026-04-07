import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, History, Calendar, ArrowRight, Receipt, Filter, BadgeCheck, 
    TrendingUp, Clock, CheckCircle, ChevronLeft, ChevronRight, ChevronsLeft, 
    ChevronsRight, Eye, EyeOff, ChevronDown, Download, FileText, Printer, RotateCcw,
    XCircle, AlertCircle
} from 'lucide-react';
import { ReimbursementAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const SearchableSelect = ({ label, options, value, onChange, placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = options.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedLabel = options.find(opt => opt.value.toString() === value.toString())?.label || placeholder;

    return (
        <div style={{ flex: 1, minWidth: '160px', position: 'relative' }} ref={dropdownRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    width: '100%', padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', 
                    fontSize: '12px', fontWeight: 700, background: '#f8fafc', color: '#1e293b', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                    height: '34px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    {Icon && <Icon size={14} color="#f97316" />}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedLabel}</span>
                </div>
                <ChevronDown size={14} color="#94a3b8" />
            </div>

            {isOpen && (
                <div style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', zIndex: 1000, 
                    padding: '8px', maxHeight: '300px', overflowY: 'auto', border: '1.5px solid #fed7aa',
                    background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            autoFocus
                            placeholder="Type to search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ 
                                width: '100%', padding: '8px 8px 8px 32px', borderRadius: '8px', border: '1.5px solid #f1f5f9', 
                                fontSize: '12px', fontWeight: 600, background: '#fff', outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {filtered.length > 0 ? filtered.map(opt => (
                            <div 
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                style={{ 
                                    padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, 
                                    cursor: 'pointer', background: value.toString() === opt.value.toString() ? '#fff7ed' : 'transparent',
                                    color: value.toString() === opt.value.toString() ? '#f97316' : '#475569',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (value.toString() !== opt.value.toString()) e.currentTarget.style.background = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    if (value.toString() !== opt.value.toString()) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {opt.label}
                            </div>
                        )) : (
                            <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ReimbursementHistory = () => {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Filters & UI States
    const [showFiltersInline, setShowFiltersInline] = useState(false);
    const [showSort, setShowSort] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'submissionDate', direction: 'desc' });
    const [filters, setFilters] = useState({
        project: '',
        status: 'ALL',
        dateFrom: '',
        dateTo: ''
    });

    useEffect(() => {
        fetchUserClaims();
    }, []);

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

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchTerm("");
        setFilters({
            project: '',
            status: 'ALL',
            dateFrom: '',
            dateTo: ''
        });
        setCurrentPage(1);
    };

    const handleSort = (option) => {
        if (option === 'asc') setSortConfig({ key: 'status', direction: 'asc' });
        else if (option === 'ALL') setSortConfig({ key: 'submissionDate', direction: 'desc' });
        else setSortConfig({ key: 'status_fixed', direction: option }); // APPROVED or REJECTED
        setShowSort(false);
    };

    const exportToExcel = () => {
        const data = filteredClaims.map(c => ({
            "Req ID": `#${String(c.id).padStart(5, '0')}`,
            "Project/Reason": c.reasonForTravel,
            "Submitted Date": c.submissionDate ? new Date(c.submissionDate).toLocaleDateString() : 'N/A',
            "Total": c.totalAmountClaimed || c.totalClaimed || 0,
            "Advance": c.advanceAmount || 0,
            "Payout": Math.abs((c.totalAmountClaimed || 0) - (c.advanceAmount || 0)),
            "Status": c.status
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "MyReimbursements");
        XLSX.writeFile(wb, "My_Reimbursements.xlsx");
        setShowExport(false);
    };

    const exportToCSV = () => {
        const headers = ["Req ID,Project/Reason,Submitted Date,Total,Advance,Payout,Status"];
        const rows = filteredClaims.map(c => 
            `#${String(c.id).padStart(5, '0')},"${c.reasonForTravel}",${c.submissionDate},${c.totalAmountClaimed || 0},${c.advanceAmount || 0},${Math.abs((c.totalAmountClaimed || 0) - (c.advanceAmount || 0))},${c.status}`
        );
        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "My_Reimbursements.csv");
        document.body.appendChild(link);
        link.click();
        setShowExport(false);
    };

    const projects = [...new Set(claims.map(c => c.reasonForTravel).filter(Boolean))];

    const filteredClaims = claims.filter(c => {
        // Global Search
        const s = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            String(c.id).includes(s) || 
            (c.reasonForTravel || "").toLowerCase().includes(s);
        
        // Status Filter
        const matchesStatus = filters.status === 'ALL' || c.status === filters.status;
        
        // Project Filter
        const matchesProject = !filters.project || c.reasonForTravel === filters.project;
        
        // Date Filter
        let matchesDate = true;
        if (filters.dateFrom && c.submissionDate) {
            matchesDate = matchesDate && new Date(c.submissionDate) >= new Date(filters.dateFrom);
        }
        if (filters.dateTo && c.submissionDate) {
            matchesDate = matchesDate && new Date(c.submissionDate) <= new Date(filters.dateTo);
        }

        return matchesSearch && matchesStatus && matchesProject && matchesDate;
    }).sort((a, b) => {
        if (sortConfig.key === 'submissionDate') {
            return sortConfig.direction === 'desc' 
                ? new Date(b.submissionDate) - new Date(a.submissionDate)
                : new Date(a.submissionDate) - new Date(b.submissionDate);
        }
        if (sortConfig.key === 'status') {
            if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
            if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
            return 0;
        }
        if (sortConfig.key === 'status_fixed') {
             if (a.status === sortConfig.direction && b.status !== sortConfig.direction) return -1;
             if (a.status !== sortConfig.direction && b.status === sortConfig.direction) return 1;
             return 0;
        }
        return 0;
    });

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'white' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ padding: '0 24px 16px 24px', background: '#ffffff', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", width: '100%' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap');
                .glass-card { background: white; border-radius: 20px; border: 1.5px solid #cbd5e1; box-shadow: 0 10px 40px rgba(0,0,0,0.03); overflow: hidden; display: flex; flex-direction: column; }
                .action-btn { transition: 0.2s; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 950; border: 1.5px solid #cbd5e1; background: white; color: #64748b; position: relative; white-space: nowrap; height: 34px; }
                .action-btn:hover { border-color: #f97316; color: #f97316; background: #fff7ed; }
                .dropdown-menu { position: absolute; top: calc(100% + 8px); right: 0; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1.5px solid #cbd5e1; padding: 8px; min-width: 160px; z-index: 100; animation: popup 0.2s ease-out; }
                .dropdown-item { padding: 10px 14px; border-radius: 10px; cursor: pointer; transition: 0.1s; display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 800; color: #475569; }
                .dropdown-item:hover { background: #f8fafc; color: #f97316; }
                .inline-filter-input { height: 34px; padding: 0 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; font-size: 12px; font-weight: 700; background: #f8fafc; outline: none; }
                @keyframes popup { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>

            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 950, color: '#431407', textTransform: 'uppercase', letterSpacing: '-0.8px' }}>My Reimbursements</h1>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                        onClick={handleReset}
                        title="Reset All Filters"
                        style={{ 
                            width: '34px', height: '34px', borderRadius: '10px', 
                            background: 'white', border: '1.5px solid #cbd5e1', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: '#f97316', cursor: 'pointer', transition: '0.2s' 
                        }}
                    >
                        <RotateCcw size={18} />
                    </button>
                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f97316' }} />
                        <input 
                            placeholder="Search everything..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                width: '100%', padding: '6px 14px 6px 36px', borderRadius: '10px', 
                                border: '1.5px solid #f97316', fontSize: '13px', fontWeight: 700, 
                                background: 'white', outline: 'none', color: '#1e293b',
                                boxShadow: '0 8px 15px rgba(249,115,22,0.1)', height: '34px'
                            }} 
                        />
                    </div>
                    <button 
                        onClick={() => navigate('/reimbursement/apply')}
                        style={{ 
                            background: '#f97316', color: 'white', 
                            border: 'none', padding: '6px 16px', borderRadius: '10px', 
                            fontSize: '10px', fontWeight: 950, cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', gap: '6px',
                            textTransform: 'uppercase', height: '34px'
                        }}
                    >
                        <Plus size={16}/> NEW REQUEST
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                {[
                    { label: 'Total Claims', val: claims.length, icon: BadgeCheck, bg: '#eff6ff', color: '#3b82f6' },
                    { label: 'In Review', val: claims.filter(c => c.status === 'PENDING').length, icon: Clock, bg: '#fff7ed', color: '#f97316' },
                    { label: 'Approved', val: claims.filter(c => ['APPROVED', 'ACCOUNTS_SETTLED', 'SETTLED', 'MANAGER_APPROVED'].includes(c.status)).length, icon: CheckCircle, bg: '#f0fdf4', color: '#22c55e' },
                    { label: 'Total Value', val: `₹${claims.reduce((s, c) => s + (c.totalAmountClaimed || c.totalClaimed || 0), 0).toLocaleString()}`, icon: TrendingUp, bg: '#faf5ff', color: '#a855f7' }
                ].map((stat, i) => (
                    <div key={i} style={{ 
                        background: 'white', border: '1.5px solid #cbd5e1', borderRadius: '16px', 
                        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', 
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)' 
                    }}>
                        <div style={{ 
                            width: '36px', height: '36px', borderRadius: '10px', 
                            background: stat.bg, color: stat.color, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                        }}>
                            <stat.icon size={18} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 950, color: '#1e293b' }}>{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Table Content */}
            <div className="glass-card" style={{ border: '1.5px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                 {/* Action Bar */}
                 <div style={{ padding: '6px 20px', borderBottom: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '48px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Recent Claims</div>
                      
                      <div style={{ display: 'flex', gap: '8px', position: 'relative', alignItems: 'center' }}>
                           {showFiltersInline && (
                               <div style={{ display: 'flex', gap: '8px', alignItems: 'center', animation: 'popup 0.2s ease-out' }}>
                                   <SearchableSelect 
                                       label="Project" 
                                       options={[{ label: "All Projects", value: "" }, ...projects.map(p => ({ label: p, value: p }))]} 
                                       value={filters.project} 
                                       onChange={(v) => handleFilterChange('project', v)} 
                                       placeholder="All Projects"
                                   />
                                   <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} className="inline-filter-input" title="From Date" />
                                   <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} className="inline-filter-input" title="To Date" />
                               </div>
                           )}

                           <button onClick={() => setShowFiltersInline(!showFiltersInline)} className="action-btn" style={{ background: showFiltersInline ? '#fff7ed' : 'white', borderColor: showFiltersInline ? '#fed7aa' : '#cbd5e1' }}>
                              <Filter size={16} color={showFiltersInline ? '#f97316' : '#94a3b8'} /> FILTERS
                           </button>

                           <div style={{ position: 'relative' }}>
                               <button onClick={() => setShowSort(!showSort)} className="action-btn">
                                  <TrendingUp size={16} color="#3b82f6" /> SORT
                               </button>
                               {showSort && (
                                   <div className="dropdown-menu">
                                       <div className="dropdown-item" onClick={() => handleSort('asc')}>Pending First</div>
                                       <div className="dropdown-item" onClick={() => handleSort('APPROVED')}>Approved First</div>
                                       <div className="dropdown-item" onClick={() => handleSort('REJECTED')}>Rejected First</div>
                                       <div className="dropdown-item" onClick={() => handleSort('ALL')}>Default Order</div>
                                   </div>
                               )}
                           </div>

                           <div style={{ position: 'relative' }}>
                               <button onClick={() => setShowExport(!showExport)} className="action-btn">
                                  <Download size={16} color="#10b981" /> EXPORT
                               </button>
                               {showExport && (
                                   <div className="dropdown-menu">
                                       <div className="dropdown-item" onClick={exportToExcel}><FileText size={14} /> Excel Spreadsheet</div>
                                       <div className="dropdown-item" onClick={exportToCSV}><FileText size={14} /> CSV Document</div>
                                   </div>
                               )}
                           </div>
                      </div>
                </div>

                <div style={{ overflowX: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', textTransform: 'uppercase' }}>REQ ID</th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', textTransform: 'uppercase' }}>PROJECT/REASON</th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', textTransform: 'uppercase' }}>SUBMITTED DATE</th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>TOTAL</th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>ADVANCE</th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>PAYOUT</th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>STATUS</th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClaims.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((c) => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <td style={{ padding: '10px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                <Receipt size={14} />
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 950, color: '#94a3b8' }}>#{String(c.id).padStart(5, '0')}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 24px' }}>
                                        <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 950, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>{c.reasonForTravel}</p>
                                        {(c.travelStartDate || c.travelEndDate) && (
                                            <p style={{ margin: '2px 0 0 0', fontSize: '8.5px', fontWeight: 800, color: '#94a3b8' }}>
                                                {new Date(c.travelStartDate).toLocaleDateString('en-GB').replace(/\//g,'-')} - {new Date(c.travelEndDate).toLocaleDateString('en-GB').replace(/\//g,'-')}
                                            </p>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', whiteSpace: 'nowrap' }}>
                                        {c.submissionDate ? new Date(c.submissionDate).toLocaleDateString('en-GB').replace(/\//g,'-') : "N/A"}
                                    </td>
                                    <td style={{ padding: '10px 24px', fontSize: '15px', fontWeight: 950, color: '#1e293b', textAlign: 'right' }}>₹{(c.totalAmountClaimed || c.totalClaimed || 0).toLocaleString()}</td>
                                    <td style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 800, color: '#64748b', textAlign: 'right' }}>₹{(c.advanceAmount || 0).toLocaleString()}</td>
                                    <td style={{ padding: '10px 24px', fontSize: '15px', fontWeight: 950, textAlign: 'right', color: (c.totalAmountClaimed || 0) >= (c.advanceAmount || 0) ? '#16a34a' : '#ef4444' }}>
                                        ₹{Math.abs((c.totalAmountClaimed || 0) - (c.advanceAmount || 0)).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '10px 24px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 950, textTransform: 'uppercase', 
                                                background: c.status === 'PENDING' ? '#f1f5f9' : (['APPROVED', 'ACCOUNTS_SETTLED', 'SETTLED', 'MANAGER_APPROVED'].includes(c.status) ? '#f0fdf4' : '#fef2f2'), 
                                                color: c.status === 'PENDING' ? '#64748b' : (['APPROVED', 'ACCOUNTS_SETTLED', 'SETTLED', 'MANAGER_APPROVED'].includes(c.status) ? '#16a34a' : '#ef4444'), 
                                                border: '1.5px solid currentColor' 
                                            }}>
                                                {c.status === 'ACCOUNTS_SETTLED' ? 'APPROVED' : (c.status === 'PENDING' ? 'PENDING' : (['APPROVED', 'SETTLED', 'MANAGER_APPROVED'].includes(c.status) ? 'APPROVED' : 'REJECTED'))}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 24px', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => navigate(`/reimbursement/view/${c.id}`)}
                                            style={{ 
                                                background: 'white', color: '#f97316', border: '1.5px solid #f97316', 
                                                padding: '8px 14px', borderRadius: '8px', fontSize: '10px', 
                                                fontWeight: 950, textTransform: 'uppercase', cursor: 'pointer', 
                                                display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s',
                                                marginLeft: 'auto'
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.background = '#fff7ed'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = 'white'; }}
                                        >
                                            VIEW <ChevronRight size={14}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredClaims.length > 0 && (
                    <div style={{ padding: '4px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #cbd5e1', background: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(1)} 
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #cbd5e1', background: 'white', color: '#431407', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                            >
                                <ChevronsLeft size={14} />
                            </button>
                            <button 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(p => p - 1)} 
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #cbd5e1', background: 'white', color: '#431407', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={14} />
                            </button>

                            {Array.from({ length: Math.ceil(filteredClaims.length / rowsPerPage) }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === Math.ceil(filteredClaims.length / rowsPerPage) || (p >= currentPage - 1 && p <= currentPage + 1))
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i-1] !== p - 1 && <span style={{ color: '#cbd5e1', fontSize: '10px' }}>...</span>}
                                        <button 
                                            onClick={() => setCurrentPage(p)}
                                            style={{
                                                width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid',
                                                borderColor: currentPage === p ? '#f97316' : '#cbd5e1',
                                                background: currentPage === p ? '#f97316' : 'white',
                                                color: currentPage === p ? 'white' : '#431407',
                                                fontSize: '10px', fontWeight: 900, cursor: 'pointer', transition: '0.2s',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}

                            <button 
                                disabled={currentPage === Math.ceil(filteredClaims.length / rowsPerPage)} 
                                onClick={() => setCurrentPage(p => p + 1)} 
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #cbd5e1', background: 'white', color: '#431407', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === Math.ceil(filteredClaims.length / rowsPerPage) ? 0.3 : 1 }}
                            >
                                <ChevronRight size={14} />
                            </button>
                            <button 
                                disabled={currentPage === Math.ceil(filteredClaims.length / rowsPerPage)} 
                                onClick={() => setCurrentPage(Math.ceil(filteredClaims.length / rowsPerPage))} 
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #cbd5e1', background: 'white', color: '#431407', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === Math.ceil(filteredClaims.length / rowsPerPage) ? 0.3 : 1 }}
                            >
                                <ChevronsRight size={14} />
                            </button>
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ( {Math.min(rowsPerPage, filteredClaims.length - (currentPage - 1) * rowsPerPage)} of {filteredClaims.length} )
                        </div>
                    </div>
                )}

                {filteredClaims.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', background: '#fff' }}>
                        <History size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b', margin: '0 0 8px 0' }}>No Records Found</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Create your first claim by clicking the 'New Request' button above.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReimbursementHistory;
