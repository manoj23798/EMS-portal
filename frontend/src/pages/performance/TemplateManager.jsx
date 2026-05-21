import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, GripVertical, Users, Briefcase, Building, Edit, ArrowLeft, X } from 'lucide-react';
import { PerformanceAPI } from '../../services/api';
import { SEEDED_TEMPLATES } from './seededTemplates';

export default function TemplateManager() {
    const [templates, setTemplates] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'edit'
    const [loading, setLoading] = useState(true);

    const defaultTemplate = {
        name: 'New Performance Template',
        department: '',
        jobRole: '',
        assignedEmployees: '',
        parts: [
            {
                id: 'part-a',
                name: 'PART A',
                activities: [
                    {
                        id: 'act-1',
                        name: 'Requirement Gathering',
                        responsibilities: [
                            { id: 'res-1', text: 'Effectively understands the requirement' }
                        ]
                    }
                ]
            },
            {
                id: 'part-b',
                name: 'PART B',
                activities: [
                    {
                        id: 'act-2',
                        name: 'Team Work',
                        responsibilities: [
                            { id: 'res-2', text: 'Helps teammates who need support' }
                        ]
                    }
                ]
            }
        ]
    };

    const [currentTemplate, setCurrentTemplate] = useState(defaultTemplate);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await PerformanceAPI.getAllTemplates();
            setTemplates(response.data);
        } catch (error) {
            console.error("Error loading templates:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setCurrentTemplate({ ...defaultTemplate });
        setViewMode('edit');
    };

    const handleEdit = (template) => {
        try {
            const parsedData = JSON.parse(template.templateData);
            setCurrentTemplate({
                id: template.id,
                name: template.name,
                department: parsedData.department || '',
                jobRole: parsedData.jobRole || '',
                assignedEmployees: parsedData.assignedEmployees || '',
                parts: parsedData.parts || defaultTemplate.parts
            });
            setViewMode('edit');
        } catch (error) {
            console.error("Failed to parse template JSON:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        try {
            await PerformanceAPI.deleteTemplate(id);
            loadTemplates();
        } catch (error) {
            console.error("Failed to delete template:", error);
            alert("Error deleting template");
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: currentTemplate.name,
                templateData: JSON.stringify({
                    department: currentTemplate.department,
                    jobRole: currentTemplate.jobRole,
                    assignedEmployees: currentTemplate.assignedEmployees,
                    parts: currentTemplate.parts
                })
            };

            if (currentTemplate.id) {
                await PerformanceAPI.updateTemplate(currentTemplate.id, payload);
                alert("Template updated successfully!");
            } else {
                await PerformanceAPI.createTemplate(payload);
                alert("Template created successfully!");
            }
            setViewMode('list');
            loadTemplates();
        } catch (error) {
            console.error("Failed to save template:", error);
            alert("Error saving template");
        }
    };

    // --- State Updaters for Builder ---
    const addActivity = (partId) => {
        setCurrentTemplate(prev => ({
            ...prev,
            parts: prev.parts.map(p => {
                if (p.id === partId) {
                    return { ...p, activities: [...p.activities, { id: Date.now().toString(), name: 'New Activity', responsibilities: [] }] };
                }
                return p;
            })
        }));
    };

    const updateActivityName = (partId, actId, name) => {
        setCurrentTemplate(prev => ({
            ...prev,
            parts: prev.parts.map(p => {
                if (p.id === partId) {
                    return { ...p, activities: p.activities.map(a => a.id === actId ? { ...a, name } : a) };
                }
                return p;
            })
        }));
    };

    const removeActivity = (partId, actId) => {
        setCurrentTemplate(prev => ({
            ...prev,
            parts: prev.parts.map(p => {
                if (p.id === partId) {
                    return { ...p, activities: p.activities.filter(a => a.id !== actId) };
                }
                return p;
            })
        }));
    };

    const addResponsibility = (partId, actId) => {
        setCurrentTemplate(prev => ({
            ...prev,
            parts: prev.parts.map(p => {
                if (p.id === partId) {
                    return { 
                        ...p, 
                        activities: p.activities.map(a => {
                            if (a.id === actId) {
                                return { ...a, responsibilities: [...a.responsibilities, { id: Date.now().toString(), text: 'New Responsibility' }] };
                            }
                            return a;
                        })
                    };
                }
                return p;
            })
        }));
    };

    const updateResponsibility = (partId, actId, resId, text) => {
        setCurrentTemplate(prev => ({
            ...prev,
            parts: prev.parts.map(p => {
                if (p.id === partId) {
                    return { 
                        ...p, 
                        activities: p.activities.map(a => {
                            if (a.id === actId) {
                                return { ...a, responsibilities: a.responsibilities.map(r => r.id === resId ? { ...r, text } : r) };
                            }
                            return a;
                        })
                    };
                }
                return p;
            })
        }));
    };

    const removeResponsibility = (partId, actId, resId) => {
        setCurrentTemplate(prev => ({
            ...prev,
            parts: prev.parts.map(p => {
                if (p.id === partId) {
                    return { 
                        ...p, 
                        activities: p.activities.map(a => {
                            if (a.id === actId) {
                                return { ...a, responsibilities: a.responsibilities.filter(r => r.id !== resId) };
                            }
                            return a;
                        })
                    };
                }
                return p;
            })
        }));
    };

    const removePart = (partId) => {
        if (window.confirm("Are you sure you want to delete this entire Part and all its activities?")) {
            setCurrentTemplate(prev => ({
                ...prev,
                parts: prev.parts.filter(p => p.id !== partId)
            }));
        }
    };

    const seedTemplates = async () => {
        if (!window.confirm("This will create comprehensive templates based on your MPR_template.txt file. Proceed?")) return;
        setLoading(true);
        try {
            for (const t of SEEDED_TEMPLATES) {
                const payload = {
                    name: t.name,
                    templateData: JSON.stringify({
                        department: t.department,
                        jobRole: t.jobRole,
                        assignedEmployees: t.assignedEmployees,
                        parts: t.parts
                    })
                };
                await PerformanceAPI.createTemplate(payload);
            }
            alert("Comprehensive templates successfully seeded!");
            loadTemplates();
        } catch (error) {
            console.error("Seed failed:", error);
            alert("Error seeding templates.");
        } finally {
            setLoading(false);
        }
    };

    if (viewMode === 'list') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Template Manager</h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Manage evaluation templates for different roles and departments.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button 
                            onClick={seedTemplates}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                        >
                            Load Examples
                        </button>
                        <button 
                            onClick={handleCreateNew}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                        >
                            <Plus size={18} /> Create Template
                        </button>
                    </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 700 }}>TEMPLATE NAME</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 700 }}>DEPARTMENT</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 700 }}>JOB ROLE</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 13, color: '#64748b', fontWeight: 700 }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ padding: 24, textAlign: 'center' }}>Loading...</td></tr>
                            ) : templates.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No templates found. Create one to get started.</td></tr>
                            ) : (
                                templates.map(t => {
                                    const parsed = JSON.parse(t.templateData);
                                    return (
                                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: 600, color: '#0f172a' }}>{t.name}</td>
                                            <td style={{ padding: '16px 24px', color: '#475569' }}>{parsed.department || '-'}</td>
                                            <td style={{ padding: '16px 24px', color: '#475569' }}>{parsed.jobRole || '-'}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                                    <button onClick={() => handleEdit(t)} style={{ padding: 6, background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 6, cursor: 'pointer' }}><Edit size={16}/></button>
                                                    <button onClick={() => handleDelete(t.id)} style={{ padding: 6, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => setViewMode('list')} style={{ background: '#f1f5f9', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20}/></button>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{currentTemplate.id ? 'Edit Template' : 'New Template'}</h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Design multi-part templates and assign them to specific roles or employees.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                        onClick={() => setViewMode('list')}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                    >
                        <X size={18} /> Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                    >
                        <Save size={18} /> Save Template
                    </button>
                </div>
            </div>

            {/* Template Configuration */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 8 }}>TEMPLATE NAME</label>
                    <input 
                        value={currentTemplate.name} onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                        style={{ width: '100%', height: 42, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 16, fontWeight: 700 }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 8 }}><Building size={16}/> DEPARTMENT</label>
                        <input 
                            placeholder="e.g. Engineering"
                            value={currentTemplate.department} onChange={e => setCurrentTemplate({...currentTemplate, department: e.target.value})}
                            style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 14 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 8 }}><Briefcase size={16}/> JOB ROLE</label>
                        <input 
                            placeholder="e.g. QA Tester"
                            value={currentTemplate.jobRole} onChange={e => setCurrentTemplate({...currentTemplate, jobRole: e.target.value})}
                            style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 14 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 8 }}><Users size={16}/> ASSIGN EMPLOYEES (Optional)</label>
                        <input 
                            placeholder="e.g. emp_123, emp_456"
                            value={currentTemplate.assignedEmployees} onChange={e => setCurrentTemplate({...currentTemplate, assignedEmployees: e.target.value})}
                            style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 14 }}
                        />
                    </div>
                </div>
            </div>

            {/* Template Structure (Parts A & B) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {currentTemplate.parts.map((part) => (
                    <div key={part.id} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 16, overflow: 'hidden' }}>
                        {/* Part Header */}
                        <div style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{part.name}</h2>
                            <button 
                                onClick={() => removePart(part.id)}
                                style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Trash2 size={16} /> Delete {part.name}
                            </button>
                        </div>

                        {/* Activities */}
                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {part.activities.map((activity, aIdx) => (
                                <div key={activity.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#fafaf9' }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ background: '#3b82f6', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                                {aIdx + 1}
                                            </div>
                                            <div style={{ flex: 1, maxWidth: 400 }}>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>ACTIVITY NAME</label>
                                                <input 
                                                    value={activity.name} onChange={e => updateActivityName(part.id, activity.id, e.target.value)}
                                                    style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 14, fontWeight: 700, background: '#fff' }}
                                                />
                                            </div>
                                        </div>
                                        <button onClick={() => removeActivity(part.id, activity.id)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Responsibilities */}
                                    <div style={{ paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>RESPONSIBILITIES (ITEMS TO BE RATED)</label>
                                        
                                        {activity.responsibilities.map((res) => (
                                            <div key={res.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <GripVertical size={16} color="#cbd5e1" style={{ cursor: 'grab' }} />
                                                <input 
                                                    placeholder="Enter responsibility metric..."
                                                    value={res.text} onChange={e => updateResponsibility(part.id, activity.id, res.id, e.target.value)}
                                                    style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 13, background: '#fff' }}
                                                />
                                                <button onClick={() => removeResponsibility(part.id, activity.id, res.id)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, display: 'flex' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}

                                        <button 
                                            onClick={() => addResponsibility(part.id, activity.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f97316', background: 'transparent', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 8, width: 'fit-content' }}
                                        >
                                            <Plus size={16} /> Add Responsibility Line
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button 
                                onClick={() => addActivity(part.id)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 48, background: '#f1f5f9', color: '#3b82f6', border: '2px dashed #cbd5e1', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <Plus size={20} /> Add New Activity to {part.name}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
