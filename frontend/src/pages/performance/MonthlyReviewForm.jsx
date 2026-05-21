import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Check, ArrowLeft, Plus, Trash2, Edit2, Bookmark, Search, X, RotateCcw } from 'lucide-react';
import { PerformanceAPI, EmployeeAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';

export default function MonthlyReviewForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const role = tokenManager.getUserRole();
    const isNew = id === 'new';
    
    const [isReadOnly, setIsReadOnly] = useState(role === 'EMPLOYEE'); 
    
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'year'
    const [allEmployeeReviews, setAllEmployeeReviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [saveStatus, setSaveStatus] = useState(null);
    const [editInputsMode, setEditInputsMode] = useState(false);
    const [backupSections, setBackupSections] = useState(null);
    const [formData, setFormData] = useState({
        employeeId: '',
        employeeName: '',
        employeeRole: '',
        employeeDepartment: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        status: 'DRAFT'
    });

    const [columnsConfig, setColumnsConfig] = useState({
        showProject: false,
        showRemarks: true
    });

    const [sections, setSections] = useState([
        {
            id: `sec-${Date.now()}-1`,
            name: 'General Performance',
            partName: 'Part A',
            items: [
                { id: `itm-${Date.now()}-1`, parameterName: 'Understanding Requirements', projectName: '', rating: '', remark: '' }
            ]
        },
        {
            id: `sec-${Date.now()}-2`,
            name: 'Teamwork & Communication',
            partName: 'Part B',
            items: [
                { id: `itm-${Date.now()}-2`, parameterName: 'Helps teammates', projectName: '', rating: '', remark: '' }
            ]
        }
    ]);

    useEffect(() => {
        loadTemplates();
        if (!isNew) {
            loadReview(id);
        }
    }, [id]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm && searchTerm.length > 1 && !selectedEmployee) {
                performSearch(searchTerm);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedEmployee]);

    const performSearch = async (query) => {
        setIsSearching(true);
        try {
            const res = await EmployeeAPI.search(query);
            setSearchResults(res.data);
            setShowDropdown(true);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        setFormData({
            ...formData,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            employeeRole: emp.designationTitle || 'Not Assigned',
            employeeDepartment: emp.departmentName || 'Not Assigned'
        });
        setSearchTerm(`${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
        setShowDropdown(false);
    };

    useEffect(() => {
        if (formData.employeeId) {
            loadEmployeeAllReviews(formData.employeeId);
        }
    }, [formData.employeeId]);

    // Auto-load review data when month/year changes if we have all reviews loaded
    useEffect(() => {
        if (allEmployeeReviews.length > 0) {
            const existingReview = allEmployeeReviews.find(r => r.month === formData.month && r.year === formData.year);
            if (existingReview) {
                // If we found a different review than the current ID, navigate to it
                if (String(existingReview.id) !== String(id)) {
                    navigate(`/performance/monthly/${existingReview.id}`);
                } else {
                    // We are already on the correct ID, just ensure data is loaded (if not already handled by loadReview)
                    const parsed = JSON.parse(existingReview.reviewData);
                    if (parsed.sections) {
                        setSections(parsed.sections.map(s => ({ ...s, partName: s.partName || 'Part A' })));
                    }
                    if (parsed.columnsConfig) {
                        setColumnsConfig(parsed.columnsConfig);
                    }
                    setSelectedTemplateId(existingReview.templateId ? existingReview.templateId.toString() : '');
                    setFormData(prev => ({ ...prev, status: existingReview.status }));
                    if (existingReview.status === 'SUBMITTED' || role === 'EMPLOYEE') setIsReadOnly(true);
                    else if (role !== 'EMPLOYEE') setIsReadOnly(false);
                }
            } else {
                // If switching to an employee/month that doesn't exist
                if (id !== 'new') {
                    navigate('/performance/monthly/new');
                } else {
                    // Already on 'new', just clear ratings to signify fresh start
                    setSections(prev => prev.map(s => ({
                        ...s,
                        items: s.items.map(i => ({ ...i, rating: '', remark: '', projectName: '' }))
                    })));
                    setFormData(prev => ({ ...prev, status: 'DRAFT' }));
                    setSelectedTemplateId('');
                    if (role !== 'EMPLOYEE') setIsReadOnly(false);
                }
            }
        }
    }, [formData.month, formData.year, allEmployeeReviews, id]);

    const loadEmployeeAllReviews = async (empId) => {
        try {
            const res = await PerformanceAPI.getMPRsByEmployee(empId);
            setAllEmployeeReviews(res.data);
        } catch (error) {
            console.error("Failed to load all reviews", error);
        }
    };

    const getRatingForMonth = (monthNum, parameterName) => {
        // First check if this is the current month being edited in the form
        if (monthNum === formData.month) {
            const allCurrentItems = sections.flatMap(s => s.items);
            const item = allCurrentItems.find(i => i.parameterName === parameterName);
            return item ? item.rating : 'NA';
        }

        // Otherwise check in loaded reviews
        const review = allEmployeeReviews.find(r => r.month === monthNum && r.year === formData.year);
        if (review) {
            try {
                const parsed = JSON.parse(review.reviewData);
                const allItems = (parsed.sections || []).flatMap(s => s.items);
                const item = allItems.find(i => i.parameterName === parameterName);
                return item ? item.rating : 'NA';
            } catch (e) { return 'NA'; }
        }
        return 'NA';
    };

    const getAverageForMonth = (monthNum) => {
        if (monthNum === formData.month) {
            const allRatings = sections.flatMap(s => s.items).map(i => i.rating).filter(r => r !== '' && r !== 'NA');
            if (allRatings.length > 0) {
                return (allRatings.reduce((a, b) => a + Number(b), 0) / allRatings.length).toFixed(1);
            }
            return 'NA';
        }

        const review = allEmployeeReviews.find(r => r.month === monthNum && r.year === formData.year);
        if (review) {
            try {
                const parsed = JSON.parse(review.reviewData);
                const allRatings = (parsed.sections || []).flatMap(s => s.items).map(i => i.rating).filter(r => r !== '' && r !== 'NA');
                if (allRatings.length > 0) {
                    return (allRatings.reduce((a, b) => a + Number(b), 0) / allRatings.length).toFixed(1);
                }
            } catch (e) {}
        }
        return 'NA';
    };

    const getRatingColor = (rating) => {
        if (rating === 'NA' || rating === '') return { bg: '#fff', color: '#94a3b8' };
        const r = Number(rating);
        if (r >= 4.5) return { bg: '#15803d', color: '#fff' }; // 5: Medium Dark Green
        if (r >= 3.5) return { bg: '#4ade80', color: '#064e3b' }; // 4: Light Dark Green
        if (r >= 2.5) return { bg: '#f1f5f9', color: '#475569' }; // 3: Light Grey
        if (r >= 1.5) return { bg: '#fca5a5', color: '#7f1d1d' }; // 2: Light Red
        if (r >= 0.5) return { bg: '#dc2626', color: '#fff' };    // 1: Medium Red
        return { bg: '#fff', color: '#475569' };
    };

    const loadTemplates = async () => {
        try {
            const res = await PerformanceAPI.getAllTemplates();
            setTemplates(res.data);
        } catch (error) {
            console.error("Failed to load templates", error);
        }
    };

    const loadReview = async (reviewId) => {
        try {
            const { data } = await PerformanceAPI.getMPRById(reviewId);
            setFormData({
                employeeId: data.employeeId,
                employeeName: data.employeeName,
                employeeRole: data.employeeRole,
                employeeDepartment: data.employeeDepartment || '',
                month: data.month,
                year: data.year,
                status: data.status
            });
            setSearchTerm(`${data.employeeName} (${data.employeeId})`);
            setSelectedEmployee({ id: data.employeeId }); // Just to disable search input if it exists
            
            const parsedData = JSON.parse(data.reviewData);
            if (parsedData.sections) {
                // Ensure legacy sections without partName default to Part A
                const safeSections = parsedData.sections.map(s => ({ ...s, partName: s.partName || 'Part A' }));
                setSections(safeSections);
            }
            if (parsedData.columnsConfig) {
                setColumnsConfig(parsedData.columnsConfig);
            }
            if (data.templateId) {
                setSelectedTemplateId(data.templateId.toString());
            }
            if (data.status === 'SUBMITTED' || role === 'EMPLOYEE') setIsReadOnly(true);
        } catch (error) {
            console.error("Failed to load review", error);
        }
    };

    const handleApplyTemplate = (tId) => {
        setSelectedTemplateId(tId);
        if (!tId) {
            // Reset to default empty sections
            setSections([
                {
                    id: `sec-${Date.now()}-1`,
                    name: 'General Performance',
                    partName: 'Part A',
                    items: [
                        { id: `itm-${Date.now()}-1`, parameterName: 'Understanding Requirements', projectName: '', rating: '', remark: '' }
                    ]
                }
            ]);
            return;
        }

        const template = templates.find(t => t.id.toString() === tId);
        if (template) {
            try {
                const parsed = JSON.parse(template.templateData);
                const isBA = template.name?.toLowerCase().includes('business analysis');
                const newSections = [];
                if (parsed.parts) {
                    let forcePartB = false;
                    parsed.parts.forEach(part => {
                        part.activities.forEach(act => {
                            if (!isBA && act.name?.toLowerCase() === 'team work') {
                                forcePartB = true;
                            }
                            
                            const items = act.responsibilities.map(res => ({
                                id: `itm-${Date.now()}-${Math.random()}`,
                                parameterName: res.text,
                                projectName: '',
                                rating: '',
                                remark: ''
                            }));
                            newSections.push({
                                id: `sec-${Date.now()}-${Math.random()}`,
                                name: act.name,
                                partName: forcePartB ? 'Part B' : (part.name || 'Part A'),
                                items: items
                            });
                        });
                    });
                }
                
                // If it was saved directly from this UI, it might just have parsed.sections
                if (parsed.sections) {
                    let forcePartB = false;
                    const safeSections = parsed.sections.map(s => {
                        if (!isBA && s.name?.toLowerCase() === 'team work') {
                            forcePartB = true;
                        }
                        return {
                            ...s, 
                            partName: forcePartB ? 'Part B' : (s.partName || 'Part A'),
                            items: s.items.map(i => ({...i, rating: '', remark: '', projectName: ''})) // Clear ratings when loading template
                        };
                    });
                    setSections(safeSections);
                } else if (newSections.length > 0) {
                    setSections(newSections);
                }

                if (parsed.columnsConfig) {
                    setColumnsConfig(parsed.columnsConfig);
                }
            } catch (err) {
                console.error("Failed parsing template", err);
            }
        }
    };

    // --- Inline Editor Actions ---
    const addSection = (partName = 'Part A') => {
        if (isReadOnly) return;
        setSections([...sections, {
            id: `sec-${Date.now()}`,
            name: 'New Section',
            partName: partName,
            items: [{ id: `itm-${Date.now()}`, parameterName: 'New Parameter', projectName: '', rating: '', remark: '' }]
        }]);
    };

    const updateSectionName = (secId, newName) => {
        if (isReadOnly) return;
        setSections(sections.map(s => s.id === secId ? { ...s, name: newName } : s));
    };

    const deleteSection = (secId) => {
        if (isReadOnly) return;
        setSections(sections.filter(s => s.id !== secId));
    };

    const deletePart = (partName) => {
        if (isReadOnly) return;
        if (window.confirm(`Are you sure you want to delete all sections in ${partName}?`)) {
            setSections(sections.filter(s => (s.partName || 'Part A') !== partName));
        }
    };

    const addItem = (secId) => {
        if (isReadOnly) return;
        setSections(sections.map(s => {
            if (s.id === secId) {
                return { ...s, items: [...s.items, { id: `itm-${Date.now()}`, parameterName: '', projectName: '', rating: '', remark: '' }] };
            }
            return s;
        }));
    };

    const resetTableData = () => {
        if (isReadOnly) return;
        if (!window.confirm("Are you sure you want to clear all ratings and remarks?")) return;
        setSections(sections.map(s => ({
            ...s,
            items: s.items.map(i => ({ ...i, rating: '', remark: '', projectName: '' }))
        })));
    };

    const updateItem = (secId, itemId, field, value) => {
        if (isReadOnly) return;
        setSections(sections.map(s => {
            if (s.id === secId) {
                return {
                    ...s,
                    items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
                };
            }
            return s;
        }));
    };

    const deleteItem = (secId, itemId) => {
        if (isReadOnly) return;
        setSections(sections.map(s => {
            if (s.id === secId) {
                return { ...s, items: s.items.filter(i => i.id !== itemId) };
            }
            return s;
        }));
    };

    // --- Scoring ---
    const calculateScore = () => {
        let total = 0;
        let count = 0;
        sections.forEach(s => {
            s.items.forEach(i => {
                if (i.rating !== '' && i.rating !== null && !isNaN(i.rating)) {
                    total += Number(i.rating);
                    count++;
                }
            });
        });
        if (count === 0) return 0;
        return (total / count).toFixed(1);
    };

    // --- Save Actions ---
    const handleSaveReview = async (status = 'DRAFT') => {
        if (isReadOnly && !editInputsMode) return;
        
        if (!formData.employeeId) {
            alert("Please provide an Employee ID.");
            return;
        }

        const numericEmpId = parseInt(formData.employeeId);
        if (isNaN(numericEmpId)) {
            alert("Please enter a valid Employee ID.");
            return;
        }

        const payload = {
            employeeId: numericEmpId,
            employeeName: formData.employeeName,
            employeeRole: formData.employeeRole,
            employeeDepartment: formData.employeeDepartment,
            evaluatorId: tokenManager.getUserData()?.id,
            month: formData.month,
            year: formData.year,
            status: status,
            templateId: selectedTemplateId ? parseInt(selectedTemplateId) : null,
            totalScore: parseFloat(calculateScore()),
            reviewData: JSON.stringify({ sections: sections, columnsConfig: columnsConfig })
        };
        
        try {
            if (isNew) {
                const saved = await PerformanceAPI.createMPR(payload);
                setSaveStatus({ type: 'success', message: 'Review created successfully!' });
                navigate(`/performance/monthly/${saved.id}`, { replace: true });
            } else {
                await PerformanceAPI.updateMPR(id, payload);
                setSaveStatus({ type: 'success', message: 'Review updated successfully!' });
            }
            // exiting edit inputs mode after successful save
            if (editInputsMode) {
                setEditInputsMode(false);
                setBackupSections(null);
            }
            loadEmployeeAllReviews(numericEmpId);
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error(error);
            setSaveStatus({ type: 'error', message: 'Failed to save review.' });
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const handleSaveAsTemplate = async () => {
        if (sections.length === 0) {
            alert("Table is empty.");
            return;
        }
        
        const templateName = prompt("Enter a name for this new Template:");
        if (!templateName) return;

        const payload = {
            name: templateName,
            templateData: JSON.stringify({
                department: formData.department,
                jobRole: '',
                sections: sections, // Just save this raw inline format
                columnsConfig: columnsConfig
            })
        };

        try {
            await PerformanceAPI.createTemplate(payload);
            alert("Template saved successfully! You can reuse it in the future.");
            loadTemplates(); // Reload dropdown
        } catch (error) {
            console.error(error);
            alert("Failed to save template.");
        }
    };

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 60, paddingTop: 0 }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate('/performance/monthly')} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} color="#475569" /></button>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {isNew ? 'New Performance Review' : `Review Details - ${formData.employeeId}`}
                        </h1>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {!isReadOnly && (
                        <button 
                            onClick={resetTableData}
                            style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 800, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                    )}

                    <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 8, padding: 4 }}>
                        <button 
                            onClick={() => setViewMode('month')}
                            style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: viewMode === 'month' ? '#fff' : 'transparent', color: viewMode === 'month' ? '#0f172a' : '#64748b', fontWeight: 800, cursor: 'pointer', boxShadow: viewMode === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                        >Month View</button>
                        <button 
                            onClick={() => setViewMode('year')}
                            style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: viewMode === 'year' ? '#fff' : 'transparent', color: viewMode === 'year' ? '#0f172a' : '#64748b', fontWeight: 800, cursor: 'pointer', boxShadow: viewMode === 'year' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                        >Year View</button>
                    </div>

                    {!isNew && isReadOnly && role !== 'EMPLOYEE' && (
                        <>
                        <button 
                            onClick={() => {
                                // enter edit inputs mode
                                setBackupSections(JSON.parse(JSON.stringify(sections)));
                                setEditInputsMode(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                        >
                            <Edit2 size={16} /> Edit Inputs
                        </button>

                        <button 
                            onClick={() => setIsReadOnly(false)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(245,158,11,0.3)' }}
                        >
                            <Edit2 size={16} /> Edit Table
                        </button>
                        </>
                    )}

                    {/* Save / Cancel for Edit Inputs mode */}
                    {editInputsMode && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleSaveReview('DRAFT')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                                <Save size={16} /> Save
                            </button>
                            <button onClick={() => {
                                // cancel: restore backup and exit
                                if (backupSections) setSections(backupSections);
                                setBackupSections(null);
                                setEditInputsMode(false);
                            }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                                <X size={16} /> Cancel
                            </button>
                        </div>
                    )}
                    {editInputsMode && (
                        <div style={{ marginLeft: 12, fontSize: 12, color: '#334155' }}>
                            <strong>Debug:</strong> {`isReadOnly=${isReadOnly} editInputsMode=${editInputsMode} role=${role}`}
                        </div>
                    )}
                </div>
            </div>

            {saveStatus && (
                <div style={{ 
                    padding: '10px 16px', borderRadius: 8, marginBottom: 12,
                    background: saveStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: saveStatus.type === 'success' ? '#166534' : '#991b1b',
                    fontWeight: 700, fontSize: 14, textAlign: 'center', border: `1px solid ${saveStatus.type === 'success' ? '#86efac' : '#fecaca'}`
                }}>
                    {saveStatus.message}
                </div>
            )}
            
            {/* STEP 1: Basic Details Section (Single Row Layout) */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                
                {/* 1. Search Field */}
                <div style={{ flex: '1 1 200px', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Search Employee</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            value={searchTerm} 
                            onChange={e => { setSearchTerm(e.target.value); setSelectedEmployee(null); setShowDropdown(true); }}
                            disabled={role === 'EMPLOYEE'}
                            placeholder="Name or ID..."
                            style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px 0 30px', background: role === 'EMPLOYEE' ? '#f8fafc' : '#fff', fontSize: 13, fontWeight: 600 }} 
                        />
                        {showDropdown && searchResults.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 4, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: 200, overflowY: 'auto' }}>
                                {searchResults.map(emp => (
                                    <div key={emp.id} onClick={() => handleSelectEmployee(emp)} style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{emp.firstName} {emp.lastName}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{emp.employeeId} • {emp.designationTitle}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Selected Employee Card */}
                {formData.employeeId && (
                    <div style={{ flex: '1 1 250px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', display: 'flex', gap: 10, alignItems: 'center', height: 32 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                            {formData.employeeName.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formData.employeeName}</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <span style={{ fontSize: 11, background: 'transparent', padding: '0', borderRadius: 3, color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>{formData.employeeRole}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Month */}
                <div style={{ width: 110 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Month</label>
                    <select value={formData.month} onChange={e => setFormData({...formData, month: parseInt(e.target.value)})} style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 12, fontWeight: 600 }}>
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                    </select>
                </div>

                {/* 4. Year */}
                <div style={{ width: 85 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Year</label>
                    <select value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 12, fontWeight: 600 }}>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                {/* 5. Apply Template */}
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Apply Template</label>
                    <select value={selectedTemplateId} onChange={e => handleApplyTemplate(e.target.value)} disabled={isReadOnly} style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 12, fontWeight: 600, background: isReadOnly ? '#f8fafc' : '#fff' }}>
                        <option value="">Select template...</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                {/* 6. Total Score */}
                <div style={{ width: 110, background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 8, padding: '4px 10px', textAlign: 'center', height: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', lineHeight: 1 }}>Score</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#3b82f6' }}>
                        {calculateScore()} <span style={{ fontSize: 11, color: '#94a3b8' }}>/ 5</span>
                    </div>
                </div>
            </div>

            {/* Column Configuration Toggles */}
            {viewMode === 'month' && !isReadOnly && (
                <div style={{ display: 'flex', gap: 24, padding: '0 8px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#64748b' }}>TABLE COLUMNS:</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>
                        <input type="checkbox" checked={true} disabled style={{ accentColor: '#3b82f6', width: 16, height: 16 }} />
                        Responsibilities (Default)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={columnsConfig.showProject} 
                            onChange={e => setColumnsConfig({...columnsConfig, showProject: e.target.checked})}
                            style={{ accentColor: '#3b82f6', width: 16, height: 16 }} 
                        />
                        Project Name
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>
                        <input type="checkbox" checked={true} disabled style={{ accentColor: '#3b82f6', width: 16, height: 16 }} />
                        Rating (Default)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={columnsConfig.showRemarks} 
                            onChange={e => setColumnsConfig({...columnsConfig, showRemarks: e.target.checked})}
                            style={{ accentColor: '#3b82f6', width: 16, height: 16 }} 
                        />
                        Remarks
                    </label>
                </div>
            )}

            {/* STEP 2: Excel-Like Table Builder */}
            {viewMode === 'month' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...new Set(sections.map(s => s.partName || 'Part A'))].map(partName => {
                    const partSections = sections.filter(s => (s.partName || 'Part A') === partName);

                    return (
                        <div key={partName} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ position: 'sticky', top: -1, zIndex: 50, background: '#4b5563', padding: '8px 16px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{partName}</h3>
                                {!isReadOnly && (
                                    <button 
                                        onClick={() => deletePart(partName)}
                                        style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        <Trash2 size={14} /> Delete {partName}
                                    </button>
                                )}
                            </div>
                            
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
                                <thead style={{ position: 'sticky', top: 34, zIndex: 45, background: '#1e293b !important', color: '#cbd5e1', fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>
                                    <tr>
                                        <th style={{ padding: '8px 16px', width: '20%', background: '#1e293b' }}>ACTIVITY</th>
                                        <th style={{ padding: '8px 16px', borderLeft: '1px solid #334155', width: '35%', background: '#1e293b' }}>RESPONSIBILITIES</th>
                                        {columnsConfig.showProject && <th style={{ padding: '8px 16px', borderLeft: '1px solid #334155', width: '15%', background: '#1e293b' }}>PROJECT NAME</th>}
                                        <th style={{ padding: '8px 12px', textAlign: 'center', borderLeft: '1px solid #334155', width: '10%', background: '#1e293b' }}>RATING</th>
                                        {columnsConfig.showRemarks && <th style={{ padding: '8px 16px', borderLeft: '1px solid #334155', width: '15%', background: '#1e293b' }}>REMARKS</th>}
                                        <th style={{ padding: '8px 12px', width: '5%', background: '#1e293b' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {partSections.map((section, sIdx) => {
                                        // Calculate rowspan: 1 for each item, plus 1 for the 'Add Responsibility' row if not readonly
                                        const rowSpanCount = section.items.length + (!isReadOnly ? 1 : 0);
                                        
                                        return (
                                            <React.Fragment key={section.id}>
                                                {section.items.map((item, iIdx) => {
                                                    const ratingNum = Number(item.rating);
                                                    const isWarning = item.rating !== '' && ratingNum <= 2;
                                                    const isExcellent = item.rating !== '' && ratingNum >= 4;
                                                    const isAverage = item.rating !== '' && ratingNum === 3;
                                                    const rowBg = isWarning ? '#fff5f5' : (isExcellent ? '#f5fbf7' : (isAverage ? '#f8fafc' : '#fff'));
                                                    
                                                    return (
                                                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: rowBg, transition: 'all 0.2s' }}>
                                                            {/* Activity Column - Only rendered on the first row of each section */}
                                                                    {iIdx === 0 && (
                                                                <td rowSpan={rowSpanCount} style={{ padding: '4px 12px', background: sIdx % 2 === 0 ? '#ffffff' : '#f1f5f9', borderRight: '1px solid #e2e8f0', verticalAlign: 'middle', borderBottom: '2px solid #374151' }}>
                                                                    <textarea 
                                                                        rows={1}
                                                                        value={section.name} 
                                                                        onChange={e => updateSectionName(section.id, e.target.value)}
                                                                        onInput={(e) => {
                                                                            e.target.style.height = 'auto';
                                                                            e.target.style.height = e.target.scrollHeight + 'px';
                                                                        }}
                                                                        disabled={isReadOnly && !editInputsMode}
                                                                        placeholder="Activity Name..."
                                                                        style={{ 
                                                                            width: '100%', background: (isReadOnly && !editInputsMode) ? 'transparent' : '#fff', 
                                                                            border: (isReadOnly && !editInputsMode) ? 'none' : '1px solid #cbd5e1', borderRadius: 4, 
                                                                            padding: 4, fontSize: 14, fontWeight: 800, color: '#1e293b', resize: 'none', textAlign: 'center', overflow: 'hidden' 
                                                                        }}
                                                                    />
                                                                    {!isReadOnly && (
                                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                            <button 
                                                                                onClick={() => deleteSection(section.id)} 
                                                                                style={{ marginTop: 6, background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 4, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                                            >
                                                                                <Trash2 size={12} /> Delete Activity
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            )}
                                                            
                                                            {/* Responsibility Column */}
                                                            <td style={{ padding: '4px 12px', borderRight: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
                                                                <textarea 
                                                                    rows={1}
                                                                    value={item.parameterName}
                                                                    onChange={e => updateItem(section.id, item.id, 'parameterName', e.target.value)}
                                                                    onInput={(e) => {
                                                                        e.target.style.height = 'auto';
                                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                                    }}
                                                                    disabled={isReadOnly && !editInputsMode}
                                                                    placeholder={(isReadOnly && !editInputsMode) ? "" : "Enter responsibility..."}
                                                                    style={{ width: '100%', border: (isReadOnly && !editInputsMode) ? 'none' : '1px solid #e2e8f0', borderRadius: 4, padding: '4px 6px', background: (isReadOnly && !editInputsMode) ? 'transparent' : '#fff', fontSize: 13, color: '#334155', resize: 'none', overflow: 'hidden' }}
                                                                />
                                                            </td>

                                                            {/* Optional Project Name Column */}
                                                            {columnsConfig.showProject && (
                                                                <td style={{ padding: '4px 12px', borderRight: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
                                                                    <input 
                                                                        value={item.projectName || ''}
                                                                        onChange={e => updateItem(section.id, item.id, 'projectName', e.target.value)}
                                                                        disabled={isReadOnly && !editInputsMode}
                                                                        placeholder={isReadOnly ? "-" : "Project name..."}
                                                                        style={{ width: '100%', border: (isReadOnly && !editInputsMode) ? 'none' : '1px solid #e2e8f0', borderRadius: 4, padding: '4px 6px', background: (isReadOnly && !editInputsMode) ? 'transparent' : '#fff', fontSize: 13, color: '#475569' }}
                                                                    />
                                                                </td>
                                                            )}

                                                            {/* Rating Column */}
                                                            <td style={{ padding: '4px 12px', borderRight: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                                                <select 
                                                                    value={item.rating} 
                                                                    onChange={e => updateItem(section.id, item.id, 'rating', e.target.value)}
                                                                    disabled={isReadOnly && !editInputsMode}
                                                                    style={{ 
                                                                        width: 50, height: 28, borderRadius: 4, 
                                                                        border: isWarning ? '1px solid #ef4444' : (isExcellent ? '1px solid #22c55e' : (isAverage ? '1px solid #cbd5e1' : '1px solid #cbd5e1')), 
                                                                        textAlign: 'center', fontWeight: 800, fontSize: 13,
                                                                        background: (isReadOnly && !editInputsMode) ? 'transparent' : '#fff', 
                                                                        color: isWarning ? '#b91c1c' : (isExcellent ? '#15803d' : (isAverage ? '#000000' : '#0f172a')),
                                                                        appearance: (isReadOnly && !editInputsMode) ? 'none' : 'auto'
                                                                    }}
                                                                >
                                                                    <option value="" disabled>-</option>
                                                                    {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                                                                </select>
                                                            </td>

                                                            {/* Optional Remarks Column */}
                                                            {columnsConfig.showRemarks && (
                                                                <td style={{ padding: '4px 12px', borderRight: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
                                                                    <input 
                                                                        value={item.remark}
                                                                        onChange={e => updateItem(section.id, item.id, 'remark', e.target.value)}
                                                                        disabled={isReadOnly && !editInputsMode}
                                                                        placeholder={(isReadOnly && !editInputsMode) ? "" : "Optional remarks..."}
                                                                        style={{ width: '100%', border: (isReadOnly && !editInputsMode) ? 'none' : '1px solid #e2e8f0', borderRadius: 4, padding: '4px 6px', background: (isReadOnly && !editInputsMode) ? 'transparent' : '#fff', fontSize: 13, color: '#475569' }}
                                                                    />
                                                                </td>
                                                            )}

                                                            {/* Actions Column */}
                                                            <td style={{ padding: '4px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                                {!isReadOnly && (
                                                                    <button onClick={() => deleteItem(section.id, item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Row">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {/* Add Responsibility Button Row */}
                                                {!isReadOnly && (
                                                    <tr style={{ background: '#fff', borderBottom: '2px solid #374151' }}>
                                                        <td colSpan={1 + (columnsConfig.showProject ? 1 : 0) + 1 + (columnsConfig.showRemarks ? 1 : 0) + 1} style={{ padding: '6px 16px' }}>
                                                            <button 
                                                                onClick={() => addItem(section.id)}
                                                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 4, padding: '4px 12px', color: '#3b82f6', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                                                            >
                                                                <Plus size={14} /> Add Responsibility
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Add Section Button specifically for this Part */}
                            {!isReadOnly && (
                                <div style={{ padding: 16, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                                    <button 
                                        onClick={() => addSection(partName)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 40, background: '#fff', border: '2px dashed #cbd5e1', borderRadius: 8, color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        <Plus size={18} /> Add New Activity Group to {partName}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add New Part Button */}
                {!isReadOnly && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: -16 }}>
                        <button 
                            onClick={() => {
                                const newPartName = prompt("Enter a name for the new Part (e.g. 'Part C'):");
                                if (newPartName) addSection(newPartName);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}
                        >
                            <Plus size={18} /> Add Completely New Part
                        </button>
                    </div>
                )}
            </div>
            )}

            {/* YEAR VIEW TABLE */}
            {viewMode === 'year' && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#4b5563', padding: '12px 16px', borderBottom: '1px solid #374151', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Monthly Performance Report - {formData.year}</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', minWidth: 1000 }}>
                            <thead style={{ position: 'sticky', top: 4.5, zIndex: 45, background: '#e2e8f0 !important', color: '#334155', fontWeight: 800, fontSize: 12, letterSpacing: 0.5 }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', width: '15%', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', background: '#e2e8f0' }}>Team</th>
                                    <th style={{ padding: '12px 16px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', width: '25%', background: '#e2e8f0' }}>Responsibilities</th>
                                    {['Jan', 'Feb', 'Mar', 'April', 'May', 'June', 'July', 'August', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                        <th key={m} style={{ padding: '12px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'center', width: '5%', background: '#e2e8f0' }}>{m}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sections.map((section, sIdx) => {
                                    const rowSpanCount = section.items.length;
                                    return (
                                        <React.Fragment key={section.id}>
                                            {section.items.map((item, iIdx) => {
                                                return (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid #cbd5e1', background: '#fff' }}>
                                                        {iIdx === 0 && (
                                                            <td rowSpan={rowSpanCount} style={{ padding: '8px 16px', background: sIdx % 2 === 0 ? '#fdfdfd' : '#f8fafc', borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', borderBottom: '2px solid #374151', fontWeight: 800, color: '#1e293b' }}>
                                                                {section.name || 'Unnamed Activity'}
                                                            </td>
                                                        )}
                                                        <td style={{ padding: '8px 16px', borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', fontSize: 12, color: '#334155' }}>
                                                            {item.parameterName || '-'}
                                                        </td>
                                                        {/* 12 Months Columns */}
                                                        {Array.from({length: 12}, (_, mIdx) => {
                                                            const monthNum = mIdx + 1;
                                                            const ratingToShow = getRatingForMonth(monthNum, item.parameterName);
                                                            const colors = getRatingColor(ratingToShow);

                                                            return (
                                                                <td key={mIdx} style={{ padding: '4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', verticalAlign: 'middle' }}>
                                                                    <div style={{ background: colors.bg, color: colors.color, borderRadius: 6, padding: '4px 0', fontSize: 12, fontWeight: 700, minHeight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        {ratingToShow}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot style={{ background: '#f8fafc', fontWeight: 800 }}>
                                <tr>
                                    <td colSpan={2} style={{ padding: '12px 16px', borderRight: '1px solid #cbd5e1', borderTop: '2px solid #94a3b8', textAlign: 'right', fontSize: 13, color: '#0f172a', textTransform: 'uppercase' }}>
                                        Monthly Average Rating
                                    </td>
                                    {Array.from({length: 12}, (_, mIdx) => {
                                        const monthNum = mIdx + 1;
                                        const average = getAverageForMonth(monthNum);
                                        const colors = getRatingColor(average);

                                        return (
                                            <td key={mIdx} style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', borderTop: '2px solid #94a3b8', textAlign: 'center', verticalAlign: 'middle' }}>
                                                {average !== 'NA' ? (
                                                    <div style={{ background: colors.bg, color: colors.color, padding: '6px 0', borderRadius: 8, fontSize: 13, fontWeight: 900, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                        {average}
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{average}</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* STEP 3: Action Buttons */}
            {!isReadOnly && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <button 
                        onClick={handleSaveAsTemplate}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                    >
                        <Bookmark size={18} /> Save as Reusable Template
                    </button>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <button 
                            onClick={() => navigate('/performance/monthly')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                        >
                            <X size={18} /> Cancel Editing
                        </button>
                        <button 
                            onClick={() => handleSaveReview('DRAFT')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                        >
                            <Save size={18} /> Save Review Draft
                        </button>
                        <button 
                            onClick={() => handleSaveReview('SUBMITTED')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}
                        >
                            <Check size={18} /> Submit Review
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
