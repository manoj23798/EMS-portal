import React, { useState, useEffect } from 'react';
import { 
    AreaChart, Area, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    Search, Filter, Users, Briefcase, TrendingUp, DollarSign, 
    Clock, CheckCircle, XCircle, ChevronRight, 
    FileSpreadsheet, ArrowLeft, ArrowRight,
    AlertCircle, ShieldCheck, ChevronLeft,
    ChevronsLeft, ChevronsRight,
    Eye, EyeOff, ChevronDown, Download,
    FileText, Printer, RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ReimbursementAPI } from '../../services/api';

const SearchableSelect = ({ label, options, value, onChange, placeholder, icon: Icon, noSearch }) => {
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
                    width: '100%', padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #f1f5f9', 
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
                    {!noSearch && (
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
                    )}
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

const AdvancedAnalytics = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [filters, setFilters] = useState({
        employeeId: '',
        project: '',
        status: 'ALL',
        dateFrom: '',
        dateTo: ''
    });
    const [filterData, setFilterData] = useState({
        employees: [],
        projects: []
    });
    const [authError, setAuthError] = useState(null);
    const [filterError, setFilterError] = useState(null);
    const [showDashboard, setShowDashboard] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [hoveredDay, setHoveredDay] = useState(null);
    const tooltipTimerRef = React.useRef(null);

    const handleDayEnter = (dateStr) => {
        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
        setHoveredDay(dateStr);
    };

    const handleDayLeave = () => {
        tooltipTimerRef.current = setTimeout(() => {
            setHoveredDay(null);
        }, 800); // 0.8s delay to catch the popup
    };

    // Trend View State
    const [viewMode, setViewMode] = useState('MONTH'); // 'MONTH' or 'YEAR'
    const [navDate, setNavDate] = useState(new Date()); // Current month for navigation
    
    // Derived month info for display
    const currentMonthName = navDate.toLocaleString('default', { month: 'long' });
    const currentYearNum = navDate.getFullYear();

    const PIE_COLORS = ['#3b82f6', '#64748b', '#10b981', '#f97316', '#a855f7', '#ef4444'];
    const AUDIT_COLORS = ['#a855f7', '#10b981', '#ef4444']; // Only 3 colors now
    const [globalSearch, setGlobalSearch] = useState("");
    const [showExport, setShowExport] = useState(false);
    const [showSort, setShowSort] = useState(false);
    const [showFiltersInline, setShowFiltersInline] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });

    const [viewedClaims, setViewedClaims] = useState(() => {
        const saved = localStorage.getItem('viewed_claims');
        return saved ? JSON.parse(saved) : [];
    });

    const handleMarkAsViewed = (id) => {
        if (!viewedClaims.includes(id)) {
            const updated = [...viewedClaims, id];
            setViewedClaims(updated);
            localStorage.setItem('viewed_claims', JSON.stringify(updated));
        }
        navigate(`/reimbursement/view/${id}`);
    };

    // Close dropdowns on outside click could be added later, for now simple toggle

    useEffect(() => {
        fetchFilterOptions();
        fetchAnalytics();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const [empRes, projRes] = await Promise.all([
                ReimbursementAPI.getAnalyticsEmployees(),
                ReimbursementAPI.getAnalyticsProjects()
            ]);
            setFilterData({
                employees: empRes.data,
                projects: projRes.data
            });
            setFilterError(null);
            setAuthError(null);
        } catch (err) {
            console.error("Error fetching filter options", err);
            if (err?.response?.status === 403) {
                setAuthError('You are not authorized to view analytics.');
            } else {
                setFilterError('Failed to load filter options.');
            }
        }
    };

    const fetchAnalytics = async (currentFilters = filters) => {
        setLoading(true);
        try {
            const params = {};
            if (currentFilters.employeeId) params.employeeId = currentFilters.employeeId;
            if (currentFilters.project) params.project = currentFilters.project;
            if (currentFilters.status && currentFilters.status !== 'ALL') params.status = currentFilters.status;
            if (currentFilters.dateFrom) params.dateFrom = currentFilters.dateFrom;
            if (currentFilters.dateTo) params.dateTo = currentFilters.dateTo;

            const res = await ReimbursementAPI.getAnalytics(params);
            setAnalytics(res.data);
            setAuthError(null);
        } catch (err) {
            console.error("Error fetching analytics", err);
            if (err?.response?.status === 403) {
                setAuthError('You are not authorized to view analytics.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, val) => {
        const newFilters = { ...filters, [key]: val };
        setFilters(newFilters);
        setCurrentPage(1);
        fetchAnalytics(newFilters);
    };

    const handleReset = () => {
        const fresh = { employeeId: '', project: '', status: 'ALL', dateFrom: '', dateTo: '' };
        setFilters(fresh);
        setGlobalSearch("");
        setCurrentPage(1);
        setNavDate(new Date());
        fetchAnalytics(fresh);
    };

    const handlePrevMonth = () => {
        const d = new Date(navDate);
        d.setMonth(d.getMonth() - 1);
        setNavDate(d);
    };

    const handleNextMonth = () => {
        const d = new Date(navDate);
        d.setMonth(d.getMonth() + 1);
        setNavDate(d);
    };

    const handlePrevYear = () => {
        const d = new Date(navDate);
        d.setFullYear(d.getFullYear() - 1);
        setNavDate(d);
    };

    const handleNextYear = () => {
        const d = new Date(navDate);
        d.setFullYear(d.getFullYear() + 1);
        setNavDate(d);
    };

    const applyYearFilter = (date) => {
        const year = date.getFullYear();
        const firstDay = `${year}-01-01`;
        const lastDay = `${year}-12-31`;
        const newFilters = { ...filters, dateFrom: firstDay, dateTo: lastDay };
        setFilters(newFilters);
        fetchAnalytics(newFilters);
    };


    const applyMonthFilter = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
        const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        const newFilters = { ...filters, dateFrom: firstDay, dateTo: lastDay };
        setFilters(newFilters);
        fetchAnalytics(newFilters);
    };

    const exportToExcel = () => {
        if (!analytics || !analytics.claims) return;
        const workSheet = XLSX.utils.json_to_sheet(analytics.claims);
        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Reimbursement Audit");
        XLSX.writeFile(workBook, "Expenditure_Intelligence_Report.xlsx");
        setShowExport(false);
    };

    const exportToCSV = () => {
        if (!analytics || !analytics.claims) return;
        const headers = ["ID", "Employee", "Code", "Reason", "Submission Date", "Total", "Advance", "Due", "Status"];
        const rows = analytics.claims.map(c => [
            c.id, c.employeeName, c.employeeCode, c.reasonForTravel, c.submissionDate, c.totalAmount, c.advanceAmount, c.duePayout, c.status
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reimbursement_data.csv");
        document.body.appendChild(link);
        link.click();
        setShowExport(false);
    };

    const exportToPDF = () => {
        alert("PDF Generation Logic (requires jsPDF/html2pdf)");
        setShowExport(false);
    };

    const exportToImage = () => {
        alert("Image Capture (requires html2canvas)");
        setShowExport(false);
    };

    const handleSort = (status) => {
        setSortConfig({ key: 'status', direction: status === 'ALL' ? 'none' : status });
        setShowSort(false);
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    
    const getDaysInMonth = (year, month) => {
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const calendarDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const startDay = calendarDays[0].getDay();
    const blanks = Array(startDay).fill(null);

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const yearNumber = currentDate.getFullYear();

    // Helper to format status for display (handles legacy if any)
    const formatStatus = (s) => {
        if (s === 'ACCOUNTS_SETTLED' || s === 'MANAGER_APPROVED') return 'APPROVED';
        return s;
    };

    if (loading) return (
        <div style={{ padding: '40px', textAlign: 'center', background: 'transparent', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ border: '3px solid #fed7aa', borderTopColor: '#f97316', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 900, color: '#f97316', textTransform: 'uppercase', letterSpacing: '1px' }}>Synchronizing Analytics...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (authError) return (
        <div style={{ padding: '24px', textAlign: 'center', background: 'transparent', minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '18px 22px', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: 0, color: '#f97316', fontWeight: 900 }}>Access Denied</h3>
                <p style={{ marginTop: 8, color: '#475569' }}>{authError}</p>
            </div>
        </div>
    );

    if (!analytics) return (
        <div style={{ padding: '24px', textAlign: 'center', background: 'transparent', minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#475569' }}>{filterError || 'No analytics data available.'}</p>
        </div>
    );

    const filteredClaims = (analytics.claims || [])
        .filter(c => {
            if (!globalSearch) return true;
            const s = globalSearch.toLowerCase();
            return (
                String(c.id).includes(s) ||
                (c.employeeName || "").toLowerCase().includes(s) ||
                (c.employeeCode || "").toLowerCase().includes(s) ||
                (c.reasonForTravel || "").toLowerCase().includes(s) ||
                (c.status || "").toLowerCase().includes(s)
            );
        });

    return (
        <div style={{ padding: '0 20px 20px 20px', background: 'transparent', minHeight: 'auto', fontFamily: "'Outfit', sans-serif", width: '100%' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap');
                select:focus, input:focus { border-color: #f97316 !important; box-shadow: 0 0 0 4px rgba(249,115,22,0.1); }
                .glass-card { background: white; border-radius: 24px; transition: 0.3s; margin-bottom: 24px; width: 100%; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04); }
                .glass-card:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(0,0,0,0.12); }
                .calendar-cell { height: 34px; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border-radius: 8px; transition: 0.1s; cursor: pointer; }
                .glass-card { min-width: 0; }
                .calendar-cell:hover { background: #f1f5f9; }
                .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin: 0 1px; }
                .tooltip-box { 
                    position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); 
                    background: #ffffff; color: #1e293b; padding: 14px; border-radius: 18px; 
                    font-size: 11px; z-index: 9999; width: 240px; 
                    box-shadow: 0 15px 50px rgba(0,0,0,0.15); border: 2px solid #fed7aa; 
                    max-height: 280px; overflow-y: auto; pointer-events: auto;
                }
                .tooltip-box::-webkit-scrollbar { width: 5px; }
                .tooltip-box::-webkit-scrollbar-thumb { background: #fed7aa; border-radius: 10px; }
                .emp-detail-card { 
                    background: #f8fafc; border-radius: 12px; padding: 10px; margin-bottom: 8px;
                    border-left: 4px solid #f97316; border: 1px solid #e2e8f0; border-left: 4px solid #f97316;
                }
            `}</style>

            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 950, color: '#431407', textTransform: 'uppercase', letterSpacing: '-0.8px' }}>Admin Reimbursement</h1>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        onClick={handleReset}
                        title="Reset All Filters"
                        style={{ 
                            width: '34px', height: '34px', borderRadius: '10px', 
                            background: 'white', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: '#f97316', cursor: 'pointer', transition: '0.2s' 
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#fff7ed'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'white'; }}
                    >
                        <RotateCcw size={18} />
                    </button>
                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f97316' }} />
                        <input 
                            placeholder="Search everything..." 
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            style={{ 
                                width: '100%', padding: '6px 14px 6px 36px', borderRadius: '10px', 
                                border: '1.5px solid #f97316', fontSize: '13px', fontWeight: 700, 
                                background: 'white', outline: 'none', color: '#1e293b',
                                boxShadow: '0 8px 15px rgba(249,115,22,0.1)', height: '34px'
                            }} 
                        />
                    </div>
                    <button 
                        onClick={() => setShowDashboard(!showDashboard)}
                        style={{ 
                            background: showDashboard ? '#fff7ed' : '#f97316', 
                            color: showDashboard ? '#f97316' : 'white', 
                            border: '1.5px solid #f97316', 
                            padding: '6px 16px', 
                            borderRadius: '10px', 
                            fontSize: '10px', 
                            fontWeight: 950, 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            textTransform: 'uppercase',
                            height: '34px'
                        }}>
                        {showDashboard ? (
                            <><EyeOff size={16}/> Hide Analysis</>
                        ) : (
                            <><Eye size={16}/> Show Analysis</>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes popup {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .action-btn { transition: 0.2s; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 950; border: 1.5px solid #f1f5f9; background: white; color: #64748b; position: relative; white-space: nowrap; height: 34px; }
                .action-btn:hover { border-color: #f97316; color: #f97316; background: #fff7ed; }
                .dropdown-menu { position: absolute; top: calc(100% + 8px); right: 0; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1.5px solid #f1f5f9; padding: 8px; min-width: 160px; z-index: 100; animation: popup 0.2s ease-out; }
                .dropdown-item { padding: 10px 14px; border-radius: 10px; cursor: pointer; transition: 0.1s; display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 800; color: #475569; }
                .dropdown-item:hover { background: #f8fafc; color: #f97316; }
                .inline-filter-input { height: 34px; padding: 0 12px; border-radius: 8px; border: 1.5px solid #f1f5f9; font-size: 12px; font-weight: 700; background: #f8fafc; outline: none; transition: 0.2s; }
                .inline-filter-input:focus { border-color: #f97316; background: white; }
            `}</style>

            {/* Dashboard Analytics Section */}
            {showDashboard && (
                <>
            {/* THE FOUR COLUMN COMMAND CENTER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 3.2fr 1.4fr', gap: '16px', marginBottom: '16px', alignItems: 'stretch', position: 'relative', zIndex: 100 }}>
                <div className="glass-card" style={{ padding: '14px', height: '100%', marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12.5px', fontWeight: 950, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expense Category Breakdown</h4>
                            <div style={{ height: '220px', flex: 1, minHeight: 220, minWidth: 200, position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                            <PieChart>
                                <Pie 
                                    data={Object.entries(analytics.categoryBreakdown || {}).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => a.name.localeCompare(b.name))} 
                                    cx="50%" cy="50%" 
                                    innerRadius={50} outerRadius={70} 
                                    dataKey="value"
                                    isAnimationActive={true}
                                    animationDuration={1200}
                                    animationBegin={0}
                                >
                                    {Object.entries(analytics.categoryBreakdown || {}).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => a.name.localeCompare(b.name)).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                                <Legend verticalAlign="bottom" content={(props) => (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 4px', maxWidth: '180px', margin: '2px auto 0 auto' }}>
                                        {props.payload.map((entry, index) => (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 800 }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: entry.color, marginRight: '8px', flexShrink: 0 }} />
                                                <span style={{ color: '#475569', letterSpacing: '0.3px' }}>{entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '14px', height: '100%', marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '12.5px', fontWeight: 950, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audit Status Health</h4>
                    <div style={{ height: '220px', flex: 1, minHeight: 220, minWidth: 200, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                            <PieChart>
                                <Pie data={(() => {
                                    const raw = analytics.statusDistribution || {};
                                    const amtRaw = analytics.statusAmountDistribution || {};
                                    const cons = { APPROVED: 0, PENDING: 0, REJECTED: 0 };
                                    const amtCons = { APPROVED: 0, PENDING: 0, REJECTED: 0 };

                                    Object.entries(raw).forEach(([k, v]) => {
                                        if (['MANAGER_APPROVED', 'ACCOUNTS_SETTLED', 'APPROVED'].includes(k)) {
                                            cons.APPROVED += v;
                                            amtCons.APPROVED += amtRaw[k] || 0;
                                        } else if (k === 'PENDING') {
                                            cons.PENDING += v;
                                            amtCons.PENDING += amtRaw[k] || 0;
                                        } else {
                                            cons.REJECTED += v;
                                            amtCons.REJECTED += amtRaw[k] || 0;
                                        }
                                    });

                                    return Object.entries(cons).filter(([_,v])=>v>0).map(([k,v])=>({
                                        name: k, 
                                        count: v,
                                        value: v, // for slice sizing
                                        amount: amtCons[k] || 0
                                    })).sort((a,b)=>a.name.localeCompare(b.name));
                                })()} 
                                    cx="50%" cy="50%" 
                                    outerRadius={70} 
                                    dataKey="value"
                                    isAnimationActive={true}
                                    animationDuration={1200}
                                    animationBegin={200}
                                >
                                    {(() => {
                                        const raw = analytics.statusDistribution || {};
                                        const cons = { APPROVED: 0, PENDING: 0, REJECTED: 0 };
                                        Object.entries(raw).forEach(([k, v]) => {
                                            if (['MANAGER_APPROVED', 'ACCOUNTS_SETTLED', 'APPROVED'].includes(k)) cons.APPROVED += v;
                                            else if (k === 'PENDING') cons.PENDING += v;
                                            else cons.REJECTED += v;
                                        });
                                        return Object.entries(cons).filter(([_,v])=>v>0).map(([k,v])=>({name:k, value:v})).sort((a,b)=>a.name.localeCompare(b.name));
                                    })().map((entry, i) => (
                                        <Cell key={i} fill={entry.name === 'APPROVED' ? '#10b981' : (entry.name === 'PENDING' ? '#f59e0b' : '#ef4444')} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="glass-card" style={{ padding: '8px 12px', border: '1.5px solid #f97316', background: 'rgba(255,255,255,0.95)', boxShadow: '0 10px 25px rgba(249,115,22,0.1)' }}>
                                                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 950, color: '#f97316' }}>{data.name}</p>
                                                    <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 950, color: '#1e293b' }}>
                                                        {data.count} Claims <span style={{ color: '#94a3b8', fontSize: '10px' }}>(₹{data.amount.toLocaleString()})</span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend verticalAlign="bottom" content={(props) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                                        {props.payload.map((entry, index) => (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 800, width: '110px' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: entry.color, marginRight: '10px', flexShrink: 0 }} />
                                                <span style={{ color: '#475569', letterSpacing: '0.3px' }}>{entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '14px', height: '100%', marginBottom: 0, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '12.5px', fontWeight: 950, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expenditure Trend</h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                {viewMode === 'MONTH' ? (
                                    <>
                                        <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={16}/></button>
                                        <span style={{ fontSize: '10px', fontWeight: 950, color: '#431407', minWidth: '80px', textAlign: 'center' }}>{currentMonthName} {currentYearNum}</span>
                                        <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', display: 'flex' }}><ChevronRight size={16}/></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={handlePrevYear} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={16}/></button>
                                        <span style={{ fontSize: '10px', fontWeight: 950, color: '#431407', minWidth: '50px', textAlign: 'center' }}>{currentYearNum}</span>
                                        <button onClick={handleNextYear} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', display: 'flex' }}><ChevronRight size={16}/></button>
                                    </>
                                )}
                            </div>
                            <button 
                                onClick={() => setViewMode(viewMode === 'MONTH' ? 'YEAR' : 'MONTH')}
                                style={{ background: '#fff7ed', color: '#f97316', border: '1px solid #f97316', padding: '4px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 950, cursor: 'pointer' }}
                            >
                                {viewMode === 'MONTH' ? 'YEAR VIEW' : 'MONTH VIEW'}
                            </button>
                        </div>
                    </div>
                    <div style={{ height: '240px', minHeight: 180 }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={140}>
                            <AreaChart data={(() => {
                                if (viewMode === 'YEAR') {
                                    return Object.entries(analytics.monthlyTrend || {}).map(([k, v]) => ({ name: k, amount: v }));
                                } else {
                                    // Local Month View Generation
                                    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const targetMonth = MONTHS_SHORT[navDate.getMonth()];
                                    const targetYear = navDate.getFullYear();
                                    
                                    // Robust Key Lookup: find key that contains both month and year (case-insensitive)
                                    const dailyDataMap = analytics.dailyTrend || {};
                                    const foundKey = Object.keys(dailyDataMap).find(k => 
                                        k.toLowerCase().includes(targetMonth.toLowerCase()) && 
                                        k.includes(targetYear.toString())
                                    );
                                    
                                    const monthDaily = dailyDataMap[foundKey] || {};
                                    
                                    // Generate all days in the current navDate month
                                    const year = navDate.getFullYear();
                                    const month = navDate.getMonth();
                                    const lastDay = new Date(year, month + 1, 0).getDate();
                                    
                                    return Array.from({ length: lastDay }, (_, i) => {
                                        const day = i + 1;
                                        return { name: day, amount: monthDaily[day] || monthDaily[String(day)] || 0 };
                                    });
                                }
                            })()}>
                                <defs>
                                    <linearGradient id="colorExpenditure" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={8} 
                                    interval={viewMode === 'YEAR' ? 0 : 2} 
                                    tickFormatter={(val) => viewMode === 'YEAR' ? val.split(' ')[0] : val} 
                                />
                                <YAxis fontSize={9} tickFormatter={(val) => `₹${(val >= 1000 ? (val/1000).toFixed(1) + 'k' : val)}`} />
                                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Expenditure']} />
                                <Area 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#ec6a11" 
                                    strokeWidth={4} 
                                    fill="url(#colorExpenditure)" 
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                    animationEasing="ease-in-out"
                                    dot={viewMode === 'MONTH' ? false : { r: 4, fill: '#fff', stroke: '#ec6a11', strokeWidth: 2 }} 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* UPDATED AGGREGATED CALENDAR */}
                <div className="glass-card" style={{ padding: '14px', height: '100%', marginBottom: 0, display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
                     <div style={{ borderBottom: '1.5px solid #f97316', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>{yearNumber}</span>
                         <span style={{ fontSize: '18px', fontWeight: 950, color: '#f97316' }}>{monthName}</span>
                         <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}><ChevronLeft size={16} color="#f97316" /></button>
                            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}><ChevronRight size={16} color="#f97316" /></button>
                         </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                            {['S','M','T','W','T','F','S'].map((d, i) => <span key={`dow-${i}`} style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>{d}</span>)}
                            {blanks.map((_, i) => <div key={`b-${i}`} className="calendar-cell" />)}
                            {calendarDays.map((date, i) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const daySummaryRaw = analytics.calendarData?.[dateStr];
                                const approvedDetails = daySummaryRaw?.details?.filter(d => ['APPROVED', 'MANAGER_APPROVED', 'ACCOUNTS_SETTLED'].includes(d.status)) || [];
                                const hasData = approvedDetails.length > 0;
                                const daySummary = hasData ? { ...daySummaryRaw, details: approvedDetails } : null;
                                
                                return (
                                    <div 
                                        key={i} 
                                        className="calendar-cell"
                                        onMouseEnter={() => hasData && handleDayEnter(dateStr)}
                                        onMouseMove={() => hasData && handleDayEnter(dateStr)}
                                        onMouseLeave={() => handleDayLeave()}
                                        style={{ 
                                            background: dateStr === new Date().toISOString().split('T')[0] ? '#fff7ed' : 'transparent',
                                            color: hasData ? '#1e293b' : '#94a3b8'
                                        }}
                                    >
                                        <span style={{ fontSize: '13px', fontWeight: 950 }}>{i + 1}</span>
                                        <div style={{ display: 'flex', gap: '2px', height: '6px', marginTop: '3px' }}>
                                            {hasData && (
                                                <span className="dot" style={{ background: '#10b981' }} />
                                            )}
                                        </div>

                                        {hoveredDay === dateStr && hasData && (
                                            <div 
                                                className="tooltip-box"
                                                onMouseEnter={(e) => {
                                                    e.stopPropagation();
                                                    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
                                                }}
                                                onMouseMove={(e) => {
                                                    e.stopPropagation();
                                                    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
                                                }}
                                                onMouseLeave={() => handleDayLeave()}
                                                style={{
                                                    // Dynamic positioning: if in top two rows (index < 14), show below cell
                                                    ...(i < 14 ? { bottom: 'auto', top: '45px' } : { bottom: '45px', top: 'auto' })
                                                }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {daySummary.details && daySummary.details.length > 0 ? (
                                                        daySummary.details.map((detail, idx) => (
                                                            <div key={idx} className="emp-detail-card">
                                                                <p style={{ margin: '0 0 2px 0', fontWeight: 900, color: '#1e293b', fontSize: '11px' }}>{detail.employeeName}</p>
                                                                <p style={{ margin: '0 0 6px 0', fontSize: '9px', color: '#64748b', fontStyle: 'italic' }}>{detail.project}</p>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                                                                    {Object.entries(detail.breakdown).map(([cat, amt]) => amt > 0 && (
                                                                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                                                                            <span style={{ color: '#64748b' }}>{cat}</span>
                                                                            <span style={{ fontWeight: 800, color: '#1e293b' }}>₹{amt.toLocaleString()}</span>
                                                                        </div>
                                                                    ))}
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>
                                                                        <span style={{ fontWeight: 900, color: '#f97316' }}>Subtotal</span>
                                                                        <span style={{ fontWeight: 900, color: '#f97316' }}>₹{detail.amount.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        // Legacy Fallback for simple aggregation
                                                        Object.entries(daySummary.breakdown).map(([cat, amt]) => amt > 0 && (
                                                            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '6px' }}>
                                                                <span style={{ color: '#64748b' }}>{cat}</span>
                                                                <span style={{ fontWeight: 800, color: '#1e293b' }}>₹{amt.toLocaleString()}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            </>
            )}

            {/* Simplified Audit Pipeline Table */}
            <div className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', position: 'relative', zIndex: 1 }}>
                 <div style={{ padding: '8px 20px', borderBottom: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '60px', background: '#fcfdfe' }}>
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                          {[
                              { label: 'TOTAL', val: analytics.totalRequests || 0, color: '#3b82f6' },
                              { label: 'PENDING', val: analytics.pendingReviewCount || 0, color: '#f59e0b' },
                              { label: 'APPROVED', val: analytics.approvedCount || 0, color: '#10b981' },
                              { label: 'REJECTED', val: analytics.rejectedCount || 0, color: '#ef4444' },
                          ].map((card, idx, arr) => (
                              <React.Fragment key={idx}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <div style={{ fontSize: '10px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{card.label}</div>
                                      <div style={{ fontSize: '20px', fontWeight: 950, color: card.color, lineHeight: 1 }}>{card.val}</div>
                                  </div>
                                  {idx < arr.length - 1 && <div style={{ width: '1.5px', height: '28px', background: '#e2e8f0' }} />}
                              </React.Fragment>
                          ))}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', position: 'relative', alignItems: 'center' }}>
                          <button onClick={() => setShowFiltersInline(!showFiltersInline)} className="action-btn" style={{ background: showFiltersInline ? '#fff7ed' : 'white', borderColor: showFiltersInline ? '#fed7aa' : '#f1f5f9' }}>
                             <Filter size={16} color={showFiltersInline ? '#f97316' : '#94a3b8'} /> FILTERS
                          </button>

                          <div style={{ position: 'relative' }}>
                              <button onClick={() => setShowExport(!showExport)} className="action-btn">
                                 <Download size={16} color="#10b981" /> EXPORT
                              </button>
                              {showExport && (
                                  <div className="dropdown-menu">
                                      <div className="dropdown-item" onClick={exportToExcel}><FileText size={14} /> Excel Spreadsheet</div>
                                      <div className="dropdown-item" onClick={exportToCSV}><FileText size={14} /> CSV Document</div>
                                      <div className="dropdown-item" onClick={exportToPDF}><Printer size={14} /> PDF Report</div>
                                      <div className="dropdown-item" onClick={exportToImage}><Eye size={14} /> Snapshot Image</div>
                                  </div>
                              )}
                          </div>
                      </div>
                 </div>

                 {showFiltersInline && (
                     <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', display: 'flex', gap: '16px', alignItems: 'center', animation: 'popup 0.2s ease-out', flexWrap: 'wrap' }}>
                         <div style={{ width: '180px' }}>
                             <SearchableSelect 
                                 label="Employee" 
                                 options={[{ label: "All Employees", value: "" }, ...filterData.employees.map(emp => ({ label: `${emp.firstName} ${emp.lastName}`, value: emp.id.toString() }))]} 
                                 value={filters.employeeId} 
                                 onChange={(v) => handleFilterChange('employeeId', v)} 
                                 placeholder="All Employees"
                             />
                         </div>
                         <div style={{ width: '180px' }}>
                             <SearchableSelect 
                                 label="Project" 
                                 options={[{ label: "All Projects", value: "" }, ...filterData.projects.map(p => ({ label: p, value: p }))]} 
                                 value={filters.project} 
                                 onChange={(v) => handleFilterChange('project', v)} 
                                 placeholder="All Projects"
                             />
                         </div>
                         <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                             <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} className="inline-filter-input" placeholder="From" />
                             <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800 }}>TO</span>
                             <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} className="inline-filter-input" placeholder="To" />
                         </div>
                         <div style={{ width: '180px' }}>
                             <SearchableSelect 
                                 label="Status" 
                                 options={[
                                     { label: "All Statuses", value: "ALL" },
                                     { label: "Pending", value: "PENDING" },
                                     { label: "Approved", value: "APPROVED" },
                                     { label: "Rejected", value: "REJECTED" }
                                 ]} 
                                 value={filters.status} 
                                 onChange={(v) => handleFilterChange('status', v)} 
                                 placeholder="Status Filter"
                                 noSearch={true}
                             />
                         </div>
                     </div>
                 )}
                <div style={{ overflowX: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', textTransform: 'uppercase' }}>EMPLOYEE</th>
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
                            {filteredClaims.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((c, i) => (
                                <tr key={c.id} className="audit-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {c.profilePhotoUrl ? (
                                                <img src={c.profilePhotoUrl} alt="profile" style={{ width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px' }}>
                                                    {c.employeeName?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 950, color: '#1e293b', whiteSpace: 'nowrap' }}>{c.employeeName}</p>
                                                <p style={{ margin: '1px 0 0 0', fontSize: '10.5px', fontWeight: 800, color: '#94a3b8' }}>{c.employeeCode}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 24px' }}>
                                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 950, color: '#1e293b', textTransform: 'uppercase' }}>{c.reasonForTravel}</p>
                                        <p style={{ margin: '1px 0 0 0', fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                            {c.startDate ? new Date(c.startDate).toLocaleDateString('en-GB').replace(/\//g,'-') : "N/A"} - {c.endDate ? new Date(c.endDate).toLocaleDateString('en-GB').replace(/\//g,'-') : "N/A"}
                                        </p>
                                    </td>
                                    <td style={{ padding: '10px 24px', fontSize: '12px', fontWeight: 950, color: '#475569', whiteSpace: 'nowrap' }}>
                                        {c.submissionDate ? new Date(c.submissionDate).toLocaleDateString('en-GB').replace(/\//g,'-') : "N/A"}
                                    </td>
                                    <td style={{ padding: '10px 24px', fontSize: '15px', fontWeight: 950, color: '#1e293b', textAlign: 'right' }}>₹{c.totalAmount?.toLocaleString() || 0}</td>
                                    <td style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 800, color: '#64748b', textAlign: 'right' }}>₹{c.advanceAmount?.toLocaleString() || 0}</td>
                                    <td style={{ padding: '10px 24px', fontSize: '15px', fontWeight: 950, textAlign: 'right', color: (c.totalAmount || 0) >= (c.advanceAmount || 0) ? '#16a34a' : '#ef4444' }}>
                                        ₹{Math.abs(c.duePayout || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '10px 24px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 950, textTransform: 'uppercase', 
                                                background: formatStatus(c.status) === 'PENDING' ? '#f1f5f9' : (formatStatus(c.status) === 'APPROVED' ? '#f0fdf4' : '#fef2f2'), 
                                                color: formatStatus(c.status) === 'PENDING' ? '#64748b' : (formatStatus(c.status) === 'APPROVED' ? '#16a34a' : '#ef4444'), 
                                                border: '1.5px solid currentColor' 
                                            }}>
                                                {formatStatus(c.status)}
                                            </span>
                                            {formatStatus(c.status) !== 'PENDING' && (
                                                <p style={{ margin: '3px 0 0 0', fontSize: '8.5px', fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                    {c.actionDate ? new Date(c.actionDate).toLocaleDateString('en-GB').replace(/\//g,'-') : ""}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 24px', textAlign: 'right' }}>
                                        <div style={{ position: 'relative', width: 'fit-content', marginLeft: 'auto' }}>
                                            <button 
                                                onClick={() => handleMarkAsViewed(c.id)} 
                                                style={{ 
                                                    background: '#f8fafc', color: '#64748b', border: '1.5px solid #cbd5e1', 
                                                    padding: '6px 12px', borderRadius: '8px', fontSize: '10px', 
                                                    fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', 
                                                    display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                            >
                                                VIEW <ChevronRight size={14}/>
                                            </button>
                                            {!viewedClaims.includes(c.id) && (
                                                <div style={{ 
                                                    position: 'absolute', top: '-4px', right: '-4px', 
                                                    width: '10px', height: '10px', background: '#ef4444', 
                                                    borderRadius: '50%', border: '2px solid white',
                                                    boxShadow: '0 0 0 2px rgba(239,68,68,0.2)'
                                                }} />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                    {filteredClaims.length > 0 && (
                    <div style={{ padding: '4px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #cbd5e1', background: 'transparent' }}>
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
                                                borderColor: currentPage === p ? '#334155' : '#cbd5e1',
                                                background: currentPage === p ? '#334155' : 'white',
                                                color: currentPage === p ? 'white' : '#431407',
                                                fontSize: '10px', fontWeight: 900, cursor: 'pointer', transition: '0.2s',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: currentPage === p ? '0 4px 10px rgba(51, 65, 85, 0.2)' : 'none'
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
        </div>

            {/* Bottom Row */}
            {false && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                <div className="glass-card" style={{ padding: '24px' }}>
                     <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 950, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={20} color="#f97316" /> Audit Log Feed
                     </h3>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {(analytics.auditLogs || []).map((log, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '14px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.type === 'APPROVE' ? '#16a34a' : (log.type === 'REJECT' ? '#ef4444' : '#f97316'), marginTop: '6px' }} />
                                <div>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{log.message}</p>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>By {log.actorName} • {log.timestamp}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 950, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <Briefcase size={20} color="#3b82f6" /> Budget Utilization Tracking
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {(analytics.budgetUtilization || []).map((dept, idx) => (
                            <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#475569' }}>{dept.departmentName}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>₹{(dept.actualSpending/1000).toFixed(1)}k / ₹{(dept.budgetLimit/1000).toFixed(1)}k</span>
                                </div>
                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${Math.min(dept.utilizationPercentage, 100)}%`, background: '#f97316', borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedAnalytics;
