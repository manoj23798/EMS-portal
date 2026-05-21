import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, FileText, GraduationCap, Briefcase, DollarSign,
    Building2, AlertTriangle, Upload, Trash2, Eye, Download,
    Plus, Mail, Phone, MapPin, Calendar, ShieldCheck, X, Save,
    Camera, ChevronRight, Lock, ChevronDown, CheckCircle2,
    UserPlus, ClipboardCheck, MessageSquare, LogOut, CheckCircle,
    Info, ExternalLink, RefreshCw, Shield, Pencil
} from 'lucide-react';
import { OnboardingAPI, EmployeeAPI, CandidateAPI, ExitManagementAPI, DepartmentAPI, DesignationAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';
import DocumentViewer from '../../components/DocumentViewer';

const THEME = {
    primary: '#f97316',      // Main Orange
    primaryLight: '#fff7ed', // Light Orange
    primaryDark: '#ea580c',  // Deep Orange
    greyDark: '#1e293b',    // Darker Slate for text
    greyMain: '#45484cff',    // Grey (Labels/Icons)
    greyLight: '#eff2f5ff',   // Slightly darker grey for better visibility
    border: '#cbd5e1',      // More prominent grey border
    white: '#ffffff'
};

const FALLBACK_PHOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";

function FileUploader({ onFile, accept, children, disabled }) {
    const inputRef = useRef(null);
    const handleClick = (e) => {
        e?.preventDefault();
        if (disabled) return;
        inputRef.current?.click();
    };
    const handleChange = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try { await onFile(f); } finally { e.target.value = ''; }
    };
    return (
        <>
            <div onClick={handleClick} style={{ display: 'inline-block' }}>{children}</div>
            <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} disabled={disabled} />
        </>
    );
}

function HeaderStatusPill({ label, icon, completed, color = THEME.border, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 10, border: `1.5px solid ${color === THEME.border ? THEME.border : color}`,
                background: THEME.white, boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'pointer', transition: 'all 0.2s',
                transform: 'translateY(0)',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
            }}
        >
            <div style={{ color: color === THEME.border ? '#64748b' : color, display: 'flex' }}>{icon}</div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>{label}</span>
            {completed && <CheckCircle size={13} color="#22c55e" style={{ marginLeft: 2 }} />}
        </div>
    );
}

export default function EmployeeProfile() {
    const { id: paramId } = useParams();
    const navigate = useNavigate();
    const currentUser = tokenManager.getUserData();
    const userRole = tokenManager.getUserRole();
    const isHR = ['ADMIN', 'HR'].includes(userRole);

    const employeeId = paramId || currentUser?.id;

    const [employee, setEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState('candidate');
    const [loading, setLoading] = useState(true);
    const [showChecklistPod, setShowChecklistPod] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);

    const [education, setEducation] = useState([]);
    const [employment, setEmployment] = useState([]);
    const [candidateData, setCandidateData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [uploadMessage, setUploadMessage] = useState(null);
    const [cropImage, setCropImage] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [photoTimestamp, setPhotoTimestamp] = useState(Date.now());
    const [isChecklistCompleted, setIsChecklistCompleted] = useState(false);
    const [isBgvCompleted, setIsBgvCompleted] = useState(false);
    const [isEditingSkills, setIsEditingSkills] = useState(false);
    const [skillsDraft, setSkillsDraft] = useState('');

    useEffect(() => {
        if (employeeId) {
            setIsChecklistCompleted(localStorage.getItem(`checklist_completed_${employeeId}`) === 'true');
            setIsBgvCompleted(localStorage.getItem(`bgv_completed_${employeeId}`) === 'true');
        }
    }, [employeeId]);

    useEffect(() => {
        setSkillsDraft(candidateData?.skills || '');
    }, [candidateData]);

    useEffect(() => {
        if (employeeId) loadAllData();
    }, [employeeId]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [empRes, candRes, docRes, workRes, deptRes, desigRes] = await Promise.allSettled([
                EmployeeAPI.getById(employeeId),
                CandidateAPI.get(employeeId),
                OnboardingAPI.getDocuments(employeeId),
                OnboardingAPI.getEmploymentHistory(employeeId),
                DepartmentAPI.getAll(),
                DesignationAPI.getAll()
            ]);

            if (empRes.status === 'fulfilled') {
                setEmployee(empRes.value.data);
                setPhotoTimestamp(Date.now());
            }
            if (candRes.status === 'fulfilled') setCandidateData(candRes.value.data || null);
            if (docRes.status === 'fulfilled') setDocuments(docRes.value.data || []);
            if (workRes.status === 'fulfilled') setEmployment(workRes.value.data || []);
            if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data || []);
            if (desigRes.status === 'fulfilled') setDesignations(desigRes.value.data || []);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleUpload = async (file, type, category) => {
        try {
            const response = await OnboardingAPI.uploadDocument(employeeId, file, type, category);
            const doc = response.data;
            setDocuments(prev => {
                // remove previous of same type+category then add new
                const filtered = prev.filter(d => !(d.documentType === type && d.category === category));
                return [doc, ...filtered];
            });
            setUploadMessage(`${type} uploaded`);
            setTimeout(() => setUploadMessage(null), 3000);
        } catch (error) {
            console.error("Upload error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Unknown error";
            setUploadMessage(`Upload failed: ${errorMsg}`);
            setTimeout(() => setUploadMessage(null), 4000);
        }
    };

    const handleDeleteDoc = async (id) => {
        if (!window.confirm("Delete this document?")) return;
        try {
            await OnboardingAPI.deleteDocument(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
            setUploadMessage('Document deleted');
            setTimeout(() => setUploadMessage(null), 2500);
        } catch (error) {
            console.error('Delete error', error);
            setUploadMessage('Delete failed');
            setTimeout(() => setUploadMessage(null), 3000);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!isHR) return;
        try {
            const deptId = departments.find(d => d.name === employee.departmentName)?.id;
            const desigId = designations.find(d => d.title === employee.designationTitle)?.id;

            const payload = {
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                phoneNumber: employee.phoneNumber || '',
                dateOfBirth: employee.dateOfBirth || null,
                gender: employee.gender || '',
                address: employee.address || '',
                joiningDate: employee.joiningDate || null,
                employmentType: employee.employmentType || '',
                profilePhotoUrl: employee.profilePhotoUrl || '',
                emergencyContactName: employee.emergencyContactName || '',
                emergencyContactPhone: employee.emergencyContactPhone || '',
                workLocation: employee.workLocation || '',
                aadhaar: employee.aadhaar || '',
                pan: employee.pan || '',
                username: employee.username || '',
                role: employee.role || '',
                departmentId: deptId || null,
                designationId: desigId || null,
                status: newStatus
            };

            await EmployeeAPI.update(employee.id, payload);
            await loadAllData();
            setUploadMessage(`Status updated to ${newStatus}`);
            setTimeout(() => setUploadMessage(null), 2500);
        } catch (error) {
            console.error('Status update error:', error);
            const errorMsg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : JSON.stringify(error.response?.data)) || error.message;
            setUploadMessage(`Status update failed: ${errorMsg}`);
            setTimeout(() => setUploadMessage(null), 6000);
        }
    };

    const handleSkillsSave = async () => {
        const normalizedSkills = skillsDraft
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .join(', ');

        try {
            await CandidateAPI.save(employeeId, {
                ...(candidateData || getDefaultCandidateData()),
                skills: normalizedSkills
            });
            setCandidateData(prev => ({ ...(prev || {}), skills: normalizedSkills }));
            setSkillsDraft(normalizedSkills);
            setIsEditingSkills(false);
            setUploadMessage('Skills updated');
            setTimeout(() => setUploadMessage(null), 2500);
        } catch (error) {
            console.error('Skills update error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Update failed';
            setUploadMessage(`Skills update failed: ${errorMsg}`);
            setTimeout(() => setUploadMessage(null), 4000);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: THEME.primary, fontWeight: 700 }}>Loading...</div>;
    if (!employee) return <div style={{ padding: 40, textAlign: 'center' }}>Employee not found</div>;

    const tabs = [
        { id: 'candidate', label: 'Candidate Info', icon: <UserPlus size={16} /> },
        { id: 'history', label: 'Employee History', icon: <Briefcase size={16} /> },
        { id: 'personal', label: 'ID Proofs', icon: <FileText size={16} /> },
        { id: 'company', label: 'Company Documents', icon: <Building2 size={16} /> },
        { id: 'emergency', label: 'Emergency', icon: <AlertTriangle size={16} /> },
        { id: 'feedback', label: 'Induction Feedback', icon: <MessageSquare size={16} /> },
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'Outfit, sans-serif' }}>
            {/* COMPACT Header Card */}
            <div style={{ background: THEME.white, borderRadius: 24, border: `1px solid ${THEME.border}`, overflow: 'hidden', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ height: 56, background: '#f1f5f9', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`, opacity: 0.6 }} />
                </div>
                <div style={{ padding: '0 28px 12px 28px', position: 'relative' }}>
                    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                        {/* Profile Image with Overlay */}
                        <div style={{ position: 'relative', marginTop: -30, zIndex: 10 }}>
                            <div style={{ padding: 6, background: THEME.white, borderRadius: 20, boxShadow: '0 8px 18px rgba(0,0,0,0.06)' }}>
                                <img
                                    src={employee.profilePhotoUrl ? (employee.profilePhotoUrl.startsWith('http') || employee.profilePhotoUrl.startsWith('data:') ? employee.profilePhotoUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8087'}${employee.profilePhotoUrl.startsWith('/') ? employee.profilePhotoUrl : `/${employee.profilePhotoUrl}`}`) : FALLBACK_PHOTO}
                                    alt={employee.firstName}
                                    style={{ width: 84, height: 84, borderRadius: 18, background: THEME.greyLight, objectFit: 'cover' }}
                                />
                            </div>
                            {isHR && (
                                <FileUploader onFile={(f) => {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                        setCropImage(e.target.result);
                                        setZoom(1);
                                        setOffsetX(0);
                                        setOffsetY(0);
                                    };
                                    reader.readAsDataURL(f);
                                }}>
                                    <div style={{ position: 'absolute', bottom: -4, right: -4, background: THEME.primary, color: THEME.white, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `3px solid ${THEME.white}`, boxShadow: '0 4px 10px rgba(249, 115, 22, 0.3)' }}>
                                        <Camera size={14} />
                                    </div>
                                </FileUploader>
                            )}
                        </div>

                        {/* Text Details Area */}
                        <div style={{ flex: 1, paddingTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <select
                                            value={employee.status?.toUpperCase() || 'ACTIVE'}
                                            disabled={!isHR}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            style={{
                                                border: 'none',
                                                borderBottom: `2px solid ${['ACTIVE', 'ONBOARDING'].includes(employee.status?.toUpperCase()) ? '#22c55e' : '#ef4444'
                                                    }`,
                                                background: 'transparent',
                                                color: ['ACTIVE', 'ONBOARDING'].includes(employee.status?.toUpperCase()) ? '#22c55e' : '#ef4444',
                                                fontSize: 13,
                                                fontWeight: 900,
                                                cursor: isHR ? 'pointer' : 'default',
                                                paddingBottom: 2,
                                                outline: 'none',
                                                appearance: 'none',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">In-active</option>
                                            <option value="ONBOARDING">Onboarding</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                                        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#1e293b' }}>{employee.firstName} {employee.lastName}</h1>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: '#475569', letterSpacing: 0.5 }}>{employee.employeeId}</span>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginTop: 4 }}>{employee.designation?.title || 'Professional'} • {employee.department?.name || 'Corporate'}</div>
                                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 14, fontWeight: 900, color: THEME.primary }}>SKILLS :</span>
                                        {isEditingSkills ? (
                                            <>
                                                <input
                                                    value={skillsDraft}
                                                    onChange={(e) => setSkillsDraft(e.target.value)}
                                                    placeholder="Java, SQL, React"
                                                    style={{
                                                        height: 32,
                                                        minWidth: 260,
                                                        border: `1px solid ${THEME.border}`,
                                                        borderRadius: 8,
                                                        padding: '0 10px',
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: THEME.greyDark,
                                                        outline: 'none'
                                                    }}
                                                />
                                                <button
                                                    onClick={handleSkillsSave}
                                                    style={{
                                                        border: 'none',
                                                        background: THEME.primary,
                                                        color: '#fff',
                                                        borderRadius: 8,
                                                        height: 32,
                                                        padding: '0 12px',
                                                        fontSize: 12,
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6
                                                    }}
                                                >
                                                    <Save size={14} /> Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSkillsDraft(candidateData?.skills || '');
                                                        setIsEditingSkills(false);
                                                    }}
                                                    style={{
                                                        border: `1px solid ${THEME.border}`,
                                                        background: '#fff',
                                                        color: THEME.greyDark,
                                                        borderRadius: 8,
                                                        height: 32,
                                                        padding: '0 10px',
                                                        fontSize: 12,
                                                        fontWeight: 800,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 700 }}>{formatSkillsForDisplay(candidateData?.skills)}</span>
                                                {isHR && (
                                                    <button
                                                        onClick={() => setIsEditingSkills(true)}
                                                        title="Edit skills"
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            color: THEME.greyDark,
                                                            cursor: 'pointer',
                                                            width: 26,
                                                            height: 26,
                                                            borderRadius: 6,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Status Pills on the Right */}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <HeaderStatusPill
                                        label="Joining Checklist"
                                        icon={<ClipboardCheck size={14} />}
                                        completed={isChecklistCompleted}
                                        color={isChecklistCompleted ? "#22c55e" : THEME.border}
                                        onClick={() => setShowChecklistPod(true)}
                                    />
                                    <HeaderStatusPill
                                        label="BGV"
                                        icon={<ShieldCheck size={14} />}
                                        completed={isBgvCompleted}
                                        color={isBgvCompleted ? "#22c55e" : THEME.border}
                                        onClick={() => setActiveTab('verification')}
                                    />
                                    <HeaderStatusPill
                                        label="Exit Management"
                                        icon={<LogOut size={14} />}
                                        color="#ef4444"
                                        onClick={() => setActiveTab('relieving')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {uploadMessage && (
                <div style={{ margin: '8px 0', padding: '8px 12px', background: '#111827cc', color: '#fff', borderRadius: 8, textAlign: 'center', fontWeight: 800 }}>{uploadMessage}</div>
            )}

            {/* OPTIMIZED PILL TABS */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', padding: '4px', scrollbarWidth: 'none' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '8px 18px', border: activeTab === tab.id ? 'none' : `1px solid ${THEME.border}`,
                        borderRadius: 99, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        fontSize: 13, fontWeight: 800, transition: 'all 0.2s',
                        background: activeTab === tab.id ? THEME.primary : THEME.white,
                        color: activeTab === tab.id ? THEME.white : THEME.greyDark,
                        boxShadow: activeTab === tab.id ? '0 6px 16px rgba(249, 115, 22, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                        flexShrink: 0,
                    }}>
                        {React.cloneElement(tab.icon, { size: 16, color: activeTab === tab.id ? THEME.white : THEME.greyDark })}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONDENSED Content Area with Sidebar Preview */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, background: THEME.white, borderRadius: 20, border: `1px solid ${THEME.border}`, padding: '16px 20px', minHeight: 260 }}>
                    {activeTab === 'candidate' && (
                        <CandidateInfoSection
                            employee={employee}
                            employeeId={employeeId}
                            isHR={isHR}
                            data={candidateData}
                            onUpdate={loadAllData}
                            departments={departments}
                            designations={designations}
                        />
                    )}
                    {activeTab === 'history' && <EmployeeHistorySection employeeId={employeeId} isHR={isHR} data={candidateData} workData={employment} documents={documents} onUpdate={loadAllData} onPreview={setPreviewDoc} setUploadMessage={setUploadMessage} />}
                    {activeTab === 'personal' && <PersonalDocsSection docs={documents.filter(d => d.category === 'PERSONAL')} isHR={isHR} onUpload={handleUpload} onDelete={handleDeleteDoc} onPreview={setPreviewDoc} />}
                    {activeTab === 'company' && <CompanyDocsSection docs={documents.filter(d => d.category === 'COMPANY')} isHR={isHR} onUpload={handleUpload} onDelete={handleDeleteDoc} onPreview={setPreviewDoc} />}
                    {activeTab === 'emergency' && <EmergencySection employee={employee} isHR={isHR} onUpdate={loadAllData} />}

                    {activeTab === 'onboarding' && <OnboardingChecklistSection employeeId={employeeId} isHR={isHR} documents={documents} employee={employee} data={candidateData} onRefresh={loadAllData} onPreview={setPreviewDoc} activeTab={activeTab} employment={employment} isChecklistCompleted={isChecklistCompleted} setIsChecklistCompleted={setIsChecklistCompleted} />}
                    {activeTab === 'feedback' && <InductionFeedbackSection employeeId={employeeId} isHR={isHR} />}
                    {activeTab === 'verification' && <BGVSection employeeId={employeeId} isHR={isHR} isBgvCompleted={isBgvCompleted} setIsBgvCompleted={setIsBgvCompleted} />}
                    {activeTab === 'relieving' && <ExitManagementSection employeeId={employeeId} isHR={isHR} onPreview={setPreviewDoc} />}
                </div>

                {showChecklistPod && (
                    <ChecklistPod
                        onClose={() => setShowChecklistPod(false)}
                        employeeId={employeeId}
                        isHR={isHR}
                        documents={documents}
                        employee={employee}
                        data={candidateData}
                        onRefresh={loadAllData}
                        onPreview={setPreviewDoc}
                        activeTab={activeTab}
                        employment={employment}
                        isChecklistCompleted={isChecklistCompleted}
                        setIsChecklistCompleted={setIsChecklistCompleted}
                    />
                )}

                {previewDoc && (
                    <SidebarPreview
                        doc={previewDoc}
                        onClose={() => setPreviewDoc(null)}
                    />
                )}

                {cropImage && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                        backdropFilter: 'blur(4px)', padding: 16
                    }}>
                        <div style={{
                            background: '#fff', borderRadius: 24, width: '100%', maxWidth: 400,
                            padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 900, color: THEME.greyDark }}>Adjust profile photo</h3>
                            <p style={{ margin: '0 0 20px 0', fontSize: 13, color: THEME.greyMain, fontWeight: 700 }}>Drag to position, use slider to zoom</p>

                            <div
                                style={{
                                    width: 200, height: 200, borderRadius: '50%', overflow: 'hidden',
                                    margin: '0 auto 20px auto', position: 'relative', background: '#f1f5f9',
                                    border: `3px solid ${THEME.primary}`, boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.4)',
                                    cursor: 'move', userSelect: 'none'
                                }}
                                onMouseDown={(e) => {
                                    setIsDragging(true);
                                    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
                                }}
                                onMouseMove={(e) => {
                                    if (!isDragging) return;
                                    setOffsetX(e.clientX - dragStart.x);
                                    setOffsetY(e.clientY - dragStart.y);
                                }}
                                onMouseUp={() => setIsDragging(false)}
                                onMouseLeave={() => setIsDragging(false)}
                            >
                                <img
                                    src={cropImage}
                                    alt="Crop Preview"
                                    style={{
                                        width: '100%', height: '100%', objectFit: 'contain',
                                        transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                                        pointerEvents: 'none', transition: isDragging ? 'none' : 'transform 0.05s ease-out'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <span style={{ fontSize: 11, fontWeight: 900, color: THEME.greyMain }}>ZOOM</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="3"
                                        step="0.05"
                                        value={zoom}
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        style={{ flex: 1, accentColor: THEME.primary, height: 6, borderRadius: 3, cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: 11, fontWeight: 900, color: THEME.greyDark, minWidth: 28 }}>{Math.round(zoom * 100)}%</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => {
                                        setCropImage(null);
                                        setZoom(1);
                                        setOffsetX(0);
                                        setOffsetY(0);
                                    }}
                                    style={{
                                        flex: 1, background: '#f1f5f9', color: THEME.greyDark, border: 'none',
                                        padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                                        cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const canvas = document.createElement('canvas');
                                        canvas.width = 300;
                                        canvas.height = 300;
                                        const ctx = canvas.getContext('2d');

                                        const img = new Image();
                                        img.src = cropImage;
                                        img.onload = async () => {
                                            ctx.clearRect(0, 0, 300, 300);
                                            const scale = 300 / 200;
                                            ctx.save();
                                            ctx.translate(150, 150);
                                            ctx.translate(offsetX * scale, offsetY * scale);
                                            ctx.scale(zoom, zoom);

                                            const imgRatio = img.width / img.height;
                                            let drawW, drawH;
                                            if (imgRatio > 1) {
                                                drawH = 200;
                                                drawW = 200 * imgRatio;
                                            } else {
                                                drawW = 200;
                                                drawH = 200 / imgRatio;
                                            }

                                            ctx.drawImage(img, -drawW * scale / 2, -drawH * scale / 2, drawW * scale, drawH * scale);
                                            ctx.restore();

                                            canvas.toBlob(async (blob) => {
                                                const file = new File([blob], "profile_photo.jpg", { type: "image/jpeg" });
                                                try {
                                                    setUploadMessage('Uploading cropped photo...');
                                                    await EmployeeAPI.uploadPhoto(employee.id, file);
                                                    await loadAllData();
                                                    setUploadMessage('Profile photo updated');
                                                    setTimeout(() => setUploadMessage(null), 2500);
                                                } catch (error) {
                                                    console.error('Photo upload error:', error);
                                                    setUploadMessage('Photo upload failed');
                                                    setTimeout(() => setUploadMessage(null), 3000);
                                                } finally {
                                                    setCropImage(null);
                                                    setZoom(1);
                                                    setOffsetX(0);
                                                    setOffsetY(0);
                                                }
                                            }, "image/jpeg", 0.9);
                                        };
                                    }}
                                    style={{
                                        flex: 1, background: THEME.primary, color: '#fff', border: 'none',
                                        padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                                        cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 10px rgba(249, 115, 22, 0.3)'
                                    }}
                                >
                                    Apply & Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ChecklistPod({ onClose, ...props }) {
    return (
        <div style={{
            width: 450,
            background: THEME.white,
            borderLeft: `1px solid ${THEME.border}`,
            boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
            height: 'calc(100vh - 40px)',
            position: 'sticky',
            top: 20,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            borderRadius: '20px 0 0 20px'
        }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: THEME.greyDark }}>Joining Checklist</h3>
                <button onClick={onClose} style={{ background: THEME.greyLight, border: 'none', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={18} />
                </button>
            </div>
            <div className="checklist-pod-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                <OnboardingChecklistSection {...props} isPod={true} />
            </div>
        </div>
    );
}

function SidebarPreview({ doc, onClose }) {
    if (!doc) return null;

    const url = doc.documentUrl;
    const isPDF = url?.toLowerCase().endsWith('.pdf');
    const [previewSrc, setPreviewSrc] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState('');

    const resolveFullUrl = (u) => {
        if (!u) return '';
        if (/^https?:\/\//i.test(u) || /^\/\//.test(u)) return u;
        const base = import.meta.env.VITE_API_URL || '';
        if (!base) return u;
        const cleanBase = base.replace(/\/$/, '');
        const cleanPath = u.replace(/^\//, '');
        return `${cleanBase}/${cleanPath}`;
    };

    const fullUrl = resolveFullUrl(url);

    useEffect(() => {
        let objectUrl = null;
        const loadProtectedFile = async () => {
            if (!fullUrl) return;
            setLoadingPreview(true);
            setPreviewError('');
            try {
                const token = tokenManager.getToken?.();
                const res = await fetch(fullUrl, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (!res.ok) throw new Error(`Preview failed (${res.status})`);
                const blob = await res.blob();
                objectUrl = URL.createObjectURL(blob);
                setPreviewSrc(objectUrl);
            } catch (err) {
                console.error('Preview load error:', err);
                setPreviewError(err.message || 'Unable to load preview');
                setPreviewSrc('');
            } finally {
                setLoadingPreview(false);
            }
        };

        loadProtectedFile();
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [fullUrl]);

    return (
        <div style={{
            width: 450,
            background: THEME.white,
            borderRadius: 24,
            border: `2px solid ${THEME.primary}`,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 24,
            height: 'calc(100vh - 100px)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: THEME.primaryLight, color: THEME.primary, padding: 8, borderRadius: 8 }}>
                        <FileText size={18} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: THEME.greyDark }}>{doc.documentType || 'Document'}</h4>
                        <div style={{ fontSize: 10, color: THEME.greyMain, fontWeight: 700 }}>PREVIEW MODE</div>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: THEME.greyLight, border: 'none', cursor: 'pointer', color: THEME.greyMain, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, background: THEME.greyLight, borderRadius: 16, overflow: 'hidden', border: `1px solid ${THEME.border}`, position: 'relative' }}>
                {loadingPreview && <div style={{ padding: 16, color: THEME.greyMain, fontWeight: 700 }}>Loading preview...</div>}
                {!loadingPreview && previewError && <div style={{ padding: 16, color: '#dc2626', fontWeight: 700 }}>{previewError}</div>}
                {!loadingPreview && !previewError && (isPDF ? (
                    <iframe src={`${previewSrc}#toolbar=0`} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF" />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                        <img src={previewSrc} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} alt="Preview" />
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <a href={previewSrc || fullUrl} download target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none', background: THEME.primary, color: THEME.white, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 900 }}>
                    <Download size={16} /> Download File
                </a>
                <button onClick={() => window.open(previewSrc || fullUrl, '_blank')} style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.white, color: THEME.greyDark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExternalLink size={18} />
                </button>
            </div>
        </div>
    );
}

function getDefaultCandidateData() {
    return {
        source: '',
        skills: '',
        recruiter: '',
        expectedCtc: '',
        offeredCtc: '',
        noticePeriod: '',
        relocation: '',
        relativeName: '',
        relativeDept: '',
        relativeDivision: '',
        relativeLocation: '',
        relativeRelation: '',
        bank: {
            holder: '',
            bankName: '',
            accNo: '',
            branch: '',
            ifsc: '',
            pfNo: ''
        },
        interview: {
            round1: { mode: 'Round 1', interviewer: '', date: '', by: '', status: '', joined: '', remarks: '' },
            round2: { mode: 'Round 2', interviewer: '', date: '', by: '', status: '', joined: '', remarks: '' },
            round3: { mode: 'Round 3', interviewer: '', date: '', by: '', status: '', joined: '', remarks: '' }
        }
    };
}

function formatSkillsForDisplay(skills) {
    if (!skills) return 'Not added';
    return skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .join(', ');
}

function CandidateInfoSection({ employee, employeeId, isHR, data, onUpdate, departments = [], designations = [] }) {
    const [edit, setEdit] = useState(false);
    const [localData, setLocalData] = useState(data || getDefaultCandidateData());
    const [empData, setEmpData] = useState({ ...employee });

    useEffect(() => {
        setLocalData(data || getDefaultCandidateData());
        setEmpData({ ...employee });
    }, [data, employee]);

    const handleSave = async () => {
        try {
            await Promise.all([
                CandidateAPI.save(employeeId, localData),
                EmployeeAPI.update(employee.id, empData)
            ]);
            setEdit(false); alert("All information saved."); onUpdate();
        }
        catch (e) { alert("Save failed."); }
    };

    const inputStyle = { width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12, background: edit ? THEME.white : THEME.greyLight, color: THEME.greyDark, fontWeight: 600, outline: 'none' };
    const labelStyle = { display: 'block', fontSize: 10, fontWeight: 900, color: THEME.greyMain, marginBottom: 4, textTransform: 'uppercase' };
    const sectionTitleStyle = { fontSize: 15, fontWeight: 900, color: THEME.greyDark, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 };

    if (!localData) return <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>;

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 32, padding: '8px 0'
            }}>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: THEME.greyDark }}>Candidate Information</h3>
                {isHR && (
                    <button onClick={() => edit ? handleSave() : setEdit(true)} style={{ background: THEME.primary, color: THEME.white, border: 'none', padding: '10px 28px', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)' }}>
                        {edit ? <><Save size={18} /> Save All Info</> : <><RefreshCw size={18} /> Edit Form</>}
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
                {/* Left Column: Form Details */}
                <div>
                    {/* Personal Information */}
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ width: 4, height: 18, background: THEME.primary, borderRadius: 2 }} />
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: THEME.greyDark }}>Personal Information</h4>
                            <div style={{ flex: 1, height: 1, background: THEME.border, marginLeft: 8 }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            <div><label style={labelStyle}>First Name *</label><input disabled={!edit} style={inputStyle} value={empData.firstName || ''} onChange={e => setEmpData({ ...empData, firstName: e.target.value })} /></div>
                            <div><label style={labelStyle}>Last Name *</label><input disabled={!edit} style={inputStyle} value={empData.lastName || ''} onChange={e => setEmpData({ ...empData, lastName: e.target.value })} /></div>
                            <div><label style={labelStyle}>Email Address *</label><input disabled={!edit} style={inputStyle} value={empData.email || ''} onChange={e => setEmpData({ ...empData, email: e.target.value })} /></div>

                            <div><label style={labelStyle}>Phone Number</label><input disabled={!edit} style={inputStyle} value={empData.phoneNumber || ''} onChange={e => setEmpData({ ...empData, phoneNumber: e.target.value })} /></div>
                            <div><label style={labelStyle}>Date of Birth</label><input disabled={!edit} type="date" style={inputStyle} value={empData.dateOfBirth || ''} onChange={e => setEmpData({ ...empData, dateOfBirth: e.target.value })} /></div>
                            <div><label style={labelStyle}>Gender</label>
                                <select disabled={!edit} style={inputStyle} value={empData.gender || ''} onChange={e => setEmpData({ ...empData, gender: e.target.value })}>
                                    <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ width: 4, height: 18, background: THEME.primary, borderRadius: 2 }} />
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: THEME.greyDark }}>Employment Details</h4>
                            <div style={{ flex: 1, height: 1, background: THEME.border, marginLeft: 8 }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            <div><label style={labelStyle}>Joining Date *</label><input disabled={!edit} type="date" style={inputStyle} value={empData.joiningDate || ''} onChange={e => setEmpData({ ...empData, joiningDate: e.target.value })} /></div>
                            <div><label style={labelStyle}>Department</label>
                                <select
                                    disabled={!edit}
                                    style={inputStyle}
                                    value={empData.department?.id || ''}
                                    onChange={e => {
                                        const dept = departments.find(d => d.id === parseInt(e.target.value));
                                        setEmpData({ ...empData, department: dept });
                                    }}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div><label style={labelStyle}>Designation</label>
                                <select
                                    disabled={!edit}
                                    style={inputStyle}
                                    value={empData.designation?.id || ''}
                                    onChange={e => {
                                        const desig = designations.find(d => d.id === parseInt(e.target.value));
                                        setEmpData({ ...empData, designation: desig });
                                    }}
                                >
                                    <option value="">Select Designation</option>
                                    {designations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                                </select>
                            </div>

                            <div><label style={labelStyle}>Employment Type</label>
                                <select disabled={!edit} style={inputStyle} value={empData.employmentType || ''} onChange={e => setEmpData({ ...empData, employmentType: e.target.value })}>
                                    <option value="Full-Time">Full-Time</option><option value="Contract">Contract</option>
                                </select>
                            </div>
                            <div><label style={labelStyle}>Work Location</label><input disabled={!edit} style={inputStyle} value={empData.workLocation || ''} onChange={e => setEmpData({ ...empData, workLocation: e.target.value })} /></div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Photo & Account */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Profile Photo Section */}
                    <div style={{ padding: 24, background: THEME.white, borderRadius: 24, border: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', background: THEME.greyLight, border: `1px dashed ${THEME.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {employee.profilePhotoUrl ? (
                                <img src={employee.profilePhotoUrl.startsWith('http') || employee.profilePhotoUrl.startsWith('data:') ? employee.profilePhotoUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8087'}${employee.profilePhotoUrl.startsWith('/') ? employee.profilePhotoUrl : `/${employee.profilePhotoUrl}`}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                            ) : (
                                <Upload size={24} color={THEME.greyMain} />
                            )}
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 900, color: THEME.greyDark }}>Profile Photo</h4>
                            <label style={{
                                background: 'rgba(249, 115, 22, 0.1)', color: THEME.primary, border: 'none',
                                padding: '6px 16px', borderRadius: 8, fontWeight: 800, fontSize: 11,
                                cursor: edit ? 'pointer' : 'default', opacity: edit ? 1 : 0.6,
                                display: 'inline-block'
                            }}>
                                {employee.profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                                <input type="file" hidden disabled={!edit} onChange={(e) => {
                                    if (e.target.files[0]) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            setCropImage(ev.target.result);
                                            setZoom(1);
                                            setOffsetX(0);
                                            setOffsetY(0);
                                        };
                                        reader.readAsDataURL(e.target.files[0]);
                                    }
                                }} />
                            </label>
                        </div>
                    </div>

                    {/* Account Info Section */}
                    <div style={{
                        background: 'rgba(249, 115, 22, 0.05)',
                        border: '1px solid rgba(249, 115, 22, 0.15)',
                        borderRadius: 24,
                        padding: 24
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <div style={{ width: 14, height: 14, border: `2px solid ${THEME.primary}`, borderRadius: 3, transform: 'rotate(45deg)' }} />
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: THEME.primary }}>Account Info</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div><label style={labelStyle}>Role *</label><input disabled style={{ ...inputStyle, background: THEME.white }} value={employee.role || ''} /></div>
                            <div><label style={labelStyle}>Username</label><input disabled={!edit} style={{ ...inputStyle, background: edit ? THEME.white : 'transparent' }} value={empData.username || ''} onChange={e => setEmpData({ ...empData, username: e.target.value })} /></div>
                            <div><label style={labelStyle}>Password</label><input disabled={!edit} type="password" style={{ ...inputStyle, background: edit ? THEME.white : 'transparent' }} placeholder="••••••••" value={empData.password || ''} onChange={e => setEmpData({ ...empData, password: e.target.value })} /></div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: 32 }}>
                <h4 style={sectionTitleStyle}><div style={{ width: 3, height: 12, background: THEME.primary, borderRadius: 2 }} /> Recruitment Information <div style={{ flex: 1, borderBottom: '3px solid #cbd5e1' }} /></h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div><label style={labelStyle}>Job Applied For</label><input disabled={!edit} style={inputStyle} value={localData.jobAppliedFor || ''} onChange={e => setLocalData({ ...localData, jobAppliedFor: e.target.value })} /></div>
                    <div><label style={labelStyle}>Marital Status</label><select disabled={!edit} style={inputStyle} value={localData.maritalStatus || ''} onChange={e => setLocalData({ ...localData, maritalStatus: e.target.value })}><option value="">Select</option><option value="Single">Single</option><option value="Married">Married</option></select></div>
                    <div><label style={labelStyle}>Alternate Contact No</label><input disabled={!edit} style={inputStyle} value={localData.alternateNo || ''} onChange={e => setLocalData({ ...localData, alternateNo: e.target.value })} /></div>
                    <div><label style={labelStyle}>Source of Position</label>
                        <select disabled={!edit} style={inputStyle} value={localData.source || ''} onChange={e => setLocalData({ ...localData, source: e.target.value })}>
                            <option value="">Select Source</option>
                            {['Internal Employee Ref', 'Job Portal', 'Paper Ad', 'Consultants', 'Job Fair', 'Friends', 'Walk-in', 'Others'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.5fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div><label style={labelStyle}>Current CTC (LPA)</label><input disabled={!edit} style={inputStyle} value={localData.currentCTC || ''} onChange={e => setLocalData({ ...localData, currentCTC: e.target.value })} /></div>
                    <div><label style={labelStyle}>Notice Period (MM)</label><input disabled={!edit} style={inputStyle} value={localData.noticePeriodMM || ''} onChange={e => setLocalData({ ...localData, noticePeriodMM: e.target.value })} /></div>
                    <div><label style={labelStyle}>Total Exp (YY / MM)</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <input disabled={!edit} style={inputStyle} placeholder="YY" value={localData.totalExpYY || ''} onChange={e => setLocalData({ ...localData, totalExpYY: e.target.value })} />
                            <input disabled={!edit} style={inputStyle} placeholder="MM" value={localData.totalExpMM || ''} onChange={e => setLocalData({ ...localData, totalExpMM: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Did you apply at Elintsys earlier?</label>
                        <select disabled={!edit} style={inputStyle} value={localData.appliedEarlier || ''} onChange={e => setLocalData({ ...localData, appliedEarlier: e.target.value })}>
                            <option value="NO">NO</option><option value="YES">YES</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Relative working in Elintsys?</label>
                        <select disabled={!edit} style={inputStyle} value={localData.relativeWorking || ''} onChange={e => setLocalData({ ...localData, relativeWorking: e.target.value })}>
                            <option value="NO">NO</option><option value="YES">YES</option>
                        </select>
                    </div>
                </div>

                {(localData.appliedEarlier === 'YES' || localData.relativeWorking === 'YES') && (
                    <div style={{ marginBottom: 0, padding: 20, background: THEME.greyLight, borderRadius: 16, border: `1px solid ${THEME.border}` }}>
                        {localData.appliedEarlier === 'YES' && (
                            <div style={{ marginBottom: localData.relativeWorking === 'YES' ? 20 : 0 }}>
                                <label style={{ ...labelStyle, fontSize: 11 }}>Previous Application Details</label>
                                <input disabled={!edit} style={inputStyle} placeholder="Enter details..." value={localData.appliedDetails} onChange={e => setLocalData({ ...localData, appliedDetails: e.target.value })} />
                            </div>
                        )}
                        {localData.relativeWorking === 'YES' && (
                            <div>
                                <label style={{ ...labelStyle, fontSize: 11, marginBottom: 12 }}>Relative Details</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                                    <div><label style={{ ...labelStyle, fontSize: 9 }}>Name</label><input disabled={!edit} style={inputStyle} value={localData.relativeName} onChange={e => setLocalData({ ...localData, relativeName: e.target.value })} /></div>
                                    <div><label style={{ ...labelStyle, fontSize: 9 }}>Dept</label><input disabled={!edit} style={inputStyle} value={localData.relativeDept} onChange={e => setLocalData({ ...localData, relativeDept: e.target.value })} /></div>
                                    <div><label style={{ ...labelStyle, fontSize: 9 }}>Division</label><input disabled={!edit} style={inputStyle} value={localData.relativeDivision} onChange={e => setLocalData({ ...localData, relativeDivision: e.target.value })} /></div>
                                    <div><label style={{ ...labelStyle, fontSize: 9 }}>Location</label><input disabled={!edit} style={inputStyle} value={localData.relativeLocation} onChange={e => setLocalData({ ...localData, relativeLocation: e.target.value })} /></div>
                                    <div><label style={{ ...labelStyle, fontSize: 9 }}>Relationship</label><input disabled={!edit} style={inputStyle} value={localData.relativeRelation} onChange={e => setLocalData({ ...localData, relativeRelation: e.target.value })} /></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ marginBottom: 32 }}>
                <h4 style={sectionTitleStyle}><div style={{ width: 3, height: 14, background: THEME.primary, borderRadius: 2 }} /> Bank Details <div style={{ flex: 1, borderBottom: '3px solid #cbd5e1' }} /></h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div><label style={labelStyle}>A/C Holder Name</label><input disabled={!edit} style={inputStyle} value={localData.bank?.holder || ''} onChange={e => setLocalData({ ...localData, bank: { ...localData.bank, holder: e.target.value } })} /></div>
                    <div><label style={labelStyle}>Bank Name</label><input disabled={!edit} style={inputStyle} value={localData.bank?.bankName || ''} onChange={e => setLocalData({ ...localData, bank: { ...localData.bank, bankName: e.target.value } })} /></div>
                    <div><label style={labelStyle}>A/C Number</label><input disabled={!edit} style={inputStyle} value={localData.bank?.accNo || ''} onChange={e => setLocalData({ ...localData, bank: { ...localData.bank, accNo: e.target.value } })} /></div>
                    <div><label style={labelStyle}>Branch</label><input disabled={!edit} style={inputStyle} value={localData.bank?.branch || ''} onChange={e => setLocalData({ ...localData, bank: { ...localData.bank, branch: e.target.value } })} /></div>
                    <div><label style={labelStyle}>IFSC Code</label><input disabled={!edit} style={inputStyle} value={localData.bank?.ifsc || ''} onChange={e => setLocalData({ ...localData, bank: { ...localData.bank, ifsc: e.target.value } })} /></div>
                    <div><label style={labelStyle}>PF Number</label><input disabled={!edit} style={inputStyle} value={localData.bank?.pfNo || ''} onChange={e => setLocalData({ ...localData, bank: { ...localData.bank, pfNo: e.target.value } })} /></div>
                </div>
            </div>

            {/* Mode of Interview & Status */}
            <div style={{ marginBottom: 32, paddingLeft: 25, position: 'relative' }}>
                <h4 style={sectionTitleStyle}><div style={{ width: 3, height: 14, background: THEME.primary, borderRadius: 2 }} /> Mode of Interview & Status <div style={{ flex: 1, borderBottom: '3px solid #adadade0' }} /></h4>
                <div style={{ position: 'relative' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: THEME.greyLight }}>
                                {['Interview Round', 'Interviewer', 'Date', 'Interviewer By', 'Status (Pass/Fail)', 'Joined', 'Remarks'].map(h => <th key={h} style={{ padding: 10, border: `1px solid ${THEME.border}`, color: THEME.greyMain, fontWeight: 900 }}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {localData.interview && Object.keys(localData.interview).map((key, i, arr) => (
                                <tr key={key}>
                                    <td style={{ padding: 10, border: `1px solid ${THEME.border}`, fontWeight: 800, position: 'relative' }}>
                                        {localData.interview[key].mode}
                                    </td>
                                    {['interviewer', 'date', 'by', 'status', 'joined', 'remarks'].map(field => (
                                        <td key={field} style={{ padding: 0, border: `1px solid ${THEME.border}` }}>
                                            {field === 'status' ? (
                                                <select disabled={!edit} style={{ ...inputStyle, border: 'none', borderRadius: 0, background: 'transparent' }} value={localData.interview[key][field] || ''} onChange={e => { const d = { ...localData }; d.interview[key][field] = e.target.value; setLocalData(d); }}>
                                                    <option value="">Select</option><option value="PASS">Pass</option><option value="FAIL">Fail</option>
                                                </select>
                                            ) : field === 'joined' ? (
                                                <select disabled={!edit} style={{ ...inputStyle, border: 'none', borderRadius: 0, background: 'transparent' }} value={localData.interview[key][field] || ''} onChange={e => { const d = { ...localData }; d.interview[key][field] = e.target.value; setLocalData(d); }}>
                                                    <option value="">Select</option><option value="YES">Yes</option><option value="NO">No</option>
                                                </select>
                                            ) : (
                                                <input type={field === 'date' ? 'date' : 'text'} disabled={!edit} style={{ ...inputStyle, border: 'none', borderRadius: 0, background: 'transparent' }} value={localData.interview[key][field] || ''} onChange={e => { const d = { ...localData }; d.interview[key][field] = e.target.value; setLocalData(d); }} />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    try {
        const cleanStr = String(dateStr).trim();
        // Check if it already matches "dd - mm - yyyy" or "dd-mm-yyyy"
        if (/^\d{2}\s*[-/]\s*\d{2}\s*[-/]\s*\d{4}$/.test(cleanStr)) {
            const parts = cleanStr.split(/[-/]/).map(p => p.trim());
            return `${parts[0]} - ${parts[1]} - ${parts[2]}`;
        }

        // Parse the date
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            const match = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
            if (match) {
                const day = match[1].padStart(2, '0');
                const month = match[2].padStart(2, '0');
                const year = match[3];
                return `${day} - ${month} - ${year}`;
            }
            return dateStr;
        }

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day} - ${month} - ${year}`;
    } catch (e) {
        return dateStr;
    }
};

function EmployeeHistorySection({ employeeId, isHR, data, workData, documents, onUpdate, onPreview, setUploadMessage }) {
    const [edit, setEdit] = useState(false);
    const [localData, setLocalData] = useState({
        workHistory: workData || [],
        academic: []
    });
    const [expandedDocs, setExpandedDocs] = useState(null);

    const showMessage = (msg) => {
        if (setUploadMessage) {
            setUploadMessage(msg);
            setTimeout(() => setUploadMessage(null), 3000);
        } else {
            alert(msg);
        }
    };

    useEffect(() => {
        const academic = data?.academic || [];
        const defaultLevels = [
            { level: '10th', defaults: { course: '10th', institute: '', percentage: '', year: '', spec: '' } },
            { level: '12th/Diploma', defaults: { course: '12th', institute: '', percentage: '', year: '', spec: '', type: '12th' } },
            { level: 'UG', defaults: { course: 'UG', institute: '', percentage: '', year: '', spec: '' } },
            { level: 'PG', defaults: { course: 'PG', institute: '', percentage: '', year: '', spec: '' } }
        ];

        const mappedAcademic = defaultLevels.map(lvl => {
            const existing = academic.find(a =>
                (lvl.level === '12th/Diploma' && (a.course === '12th' || a.course === 'Diploma')) ||
                (a.course === lvl.level)
            );
            if (existing) {
                const res = { ...lvl.defaults, ...existing };
                if (lvl.level === '12th/Diploma') res.type = existing.course || '12th';
                return res;
            }
            return lvl.defaults;
        });

        setLocalData({
            workHistory: workData || [],
            academic: mappedAcademic
        });
    }, [data, workData]);

    const handleDocUpload = async (id, file, label) => {
        try {
            await OnboardingAPI.uploadEmploymentDoc(id, file, label);
            onUpdate();
            showMessage(`${label} uploaded`);
        } catch (e) { showMessage("Upload failed"); }
    };

    const handleDeleteWorkDoc = async (workHistoryId, key, label) => {
        if (!window.confirm(`Delete ${label}?`)) return;
        try {
            const updatedList = localData.workHistory.map(w => {
                if (w.id === workHistoryId) {
                    return { ...w, [key]: null };
                }
                return w;
            });
            setLocalData({ ...localData, workHistory: updatedList });
            await OnboardingAPI.saveEmploymentHistoryBatch(employeeId, updatedList);
            onUpdate();
            showMessage(`${label} deleted`);
        } catch (e) { showMessage("Delete failed"); }
    };

    const handleEduDocUpload = async (file, type) => {
        try {
            await OnboardingAPI.uploadDocument(employeeId, file, type, 'ONBOARDING');
            onUpdate();
            showMessage(`${type} uploaded`);
        } catch (e) { showMessage("Upload failed"); }
    };

    const handleDeleteEduDoc = async (docId) => {
        if (!window.confirm("Delete this document?")) return;
        try {
            await OnboardingAPI.deleteDocument(docId);
            onUpdate();
        } catch (e) { showMessage("Delete failed"); }
    };
    const handleSave = async () => {
        try {
            try {
                await CandidateAPI.save(employeeId, { ...data, academic: localData.academic });
            } catch (candError) {
                console.error("Candidate Save Error:", candError);
                const candMsg = candError.response?.data?.message || (typeof candError.response?.data === 'string' ? candError.response.data : JSON.stringify(candError.response?.data)) || candError.message;
                throw new Error(`Candidate Save: ${candMsg}`);
            }

            try {
                await OnboardingAPI.saveEmploymentHistoryBatch(employeeId, localData.workHistory);
            } catch (workError) {
                console.error("Work History Save Error:", workError);
                const workMsg = workError.response?.data?.message || (typeof workError.response?.data === 'string' ? workError.response.data : JSON.stringify(workError.response?.data)) || workError.message;
                throw new Error(`Employment History Save: ${workMsg}`);
            }

            setEdit(false);
            showMessage("History saved.");
            onUpdate();
        }
        catch (e) {
            showMessage(`Save failed: ${e.message}`);
        }
    };



    const inputStyle = { width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12, background: edit ? THEME.white : THEME.greyLight, color: THEME.greyDark, fontWeight: 600, outline: 'none' };
    const labelStyle = { display: 'block', fontSize: 10, fontWeight: 900, color: THEME.greyMain, marginBottom: 4, textTransform: 'uppercase' };
    const sectionTitleStyle = { fontSize: 22, fontWeight: 900, color: THEME.greyDark, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 };

    const TimelineLine = ({ index, length, top = 32, bottom = -45 }) => (
        index < length - 1 && (
            <div style={{
                position: 'absolute', left: -22, top: top, bottom: bottom,
                width: 4, background: THEME.primary, borderRadius: 2, zIndex: 1
            }} />
        )
    );

    const TimelineNode = ({ index, top = 5 }) => (
        <div style={{
            position: 'absolute', left: -34, top: top, width: 28, height: 28,
            borderRadius: '50%', background: THEME.primary, color: THEME.white,
            fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10, boxShadow: '0 0 0 4px #fff'
        }}>{index + 1}</div>
    );

    return (
        <div style={{ position: 'relative' }}>
            {isHR && (
                <div style={{ position: 'absolute', right: 0, top: -45 }}>
                    <button onClick={() => edit ? handleSave() : setEdit(true)} style={{ background: THEME.primary, color: THEME.white, border: 'none', padding: '10px 28px', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)' }}>
                        {edit ? <><Save size={18} /> Save History</> : <><RefreshCw size={18} /> Edit History</>}
                    </button>
                </div>
            )}

            {/* Work History (Premium Timeline Style) */}
            <div style={{ marginBottom: 48, paddingLeft: 40, position: 'relative' }}>
                <h4 style={sectionTitleStyle}><div style={{ width: 3, height: 14, background: THEME.primary, borderRadius: 2 }} /> Work History </h4>
                <div style={{ position: 'relative' }}>
                    {localData.workHistory.map((w, i) => (
                        <div key={i} style={{ position: 'relative', marginBottom: 64, maxWidth: 700 }}>
                            <TimelineLine index={i} length={localData.workHistory.length} />
                            <TimelineNode index={i} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                                    <div style={{ fontSize: 26, fontWeight: 900, color: THEME.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{w.companyName || 'Company'}</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#484b50ff' }}>{w.role || 'Position'}</div>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: THEME.primary, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {formatDateToDDMMYYYY(w.startDate) || 'Start'} <span style={{ color: THEME.primary, opacity: 0.8 }}>→</span> {w.endDate?.toLowerCase() === 'present' ? 'Present' : (formatDateToDDMMYYYY(w.endDate) || 'Present')}
                                    {edit && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Delete this experience?")) {
                                                    const newList = localData.workHistory.filter((_, idx) => idx !== i);
                                                    setLocalData({ ...localData, workHistory: newList });
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                                            title="Delete Experience"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ width: '100%', height: 1.5, background: '#64748b', marginBottom: 20, opacity: 0.3 }} />

                            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                                <div style={{
                                    padding: '8px 16px', borderRadius: 12, background: '#fff7ed',
                                    fontSize: 13, fontWeight: 900, color: THEME.primary, border: `1px solid #ffedd5`
                                }}>
                                    CTC: {String(w.ctc || '0').replace(/\s*LPA/gi, '')} LPA
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>REASON:</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', fontStyle: 'italic' }}>
                                        {w.reasonForLeaving || 'Not specified'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <button
                                    onClick={() => setExpandedDocs(expandedDocs === `work_${i}` ? null : `work_${i}`)}
                                    style={{ background: 'none', border: 'none', color: THEME.primary, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <ChevronRight size={18} style={{ transform: expandedDocs === `work_${i}` ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                                    Verification Documents
                                </button>

                                {expandedDocs === `work_${i}` && (
                                    <div style={{ marginTop: 12, padding: 16, background: '#f8fafc', borderRadius: 12, border: `1px solid ${THEME.border}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                        {[
                                            { label: 'Offer Letter', key: 'offerLetterUrl' },
                                            { label: 'Relieving Letter', key: 'relievingLetterUrl' },
                                            { label: 'Experience Certificate', key: 'experienceLetterUrl' },
                                            { label: 'Pay Slip', key: 'payslipsUrl' },
                                            { label: 'Hike Letter', key: 'hikeLettersUrl' },
                                            { label: 'Form 16', key: 'form16Url' },
                                            { label: 'Bank Statement', key: 'bankStatementUrl' }
                                        ].map(doc => (
                                            <div key={doc.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: THEME.white, borderRadius: 10, border: `1px solid ${THEME.border}` }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: THEME.greyDark }}>{doc.label}</span>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {w[doc.key] ? (
                                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                            <button onClick={() => onPreview({ documentUrl: w[doc.key], documentType: doc.label })} style={{ padding: 2, color: THEME.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="View"><Eye size={16} /></button>
                                                            <button onClick={() => handleDeleteWorkDoc(w.id, doc.key, doc.label)} style={{ padding: 2, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <FileUploader onFile={(f) => handleDocUpload(w.id, f, doc.label)}><div style={{ cursor: 'pointer', color: THEME.primary }}><Plus size={16} /></div></FileUploader>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {edit && (
                                <div style={{ marginTop: 20, background: '#f8fafc', padding: 20, borderRadius: 16, border: `1px dashed ${THEME.border}` }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                        <div><label style={labelStyle}>Company Name</label><input style={inputStyle} value={w.companyName || ''} onChange={e => { const newList = [...localData.workHistory]; newList[i].companyName = e.target.value; setLocalData({ ...localData, workHistory: newList }); }} /></div>
                                        <div><label style={labelStyle}>Designation</label><input style={inputStyle} value={w.role || ''} onChange={e => { const newList = [...localData.workHistory]; newList[i].role = e.target.value; setLocalData({ ...localData, workHistory: newList }); }} /></div>
                                        <div><label style={labelStyle}>CTC (LPA)</label><input style={inputStyle} value={w.ctc || ''} onChange={e => { const newList = [...localData.workHistory]; newList[i].ctc = e.target.value; setLocalData({ ...localData, workHistory: newList }); }} /></div>
                                        <div><label style={labelStyle}>Start Date</label><input style={inputStyle} value={w.startDate || ''} onChange={e => { const newList = [...localData.workHistory]; newList[i].startDate = e.target.value; setLocalData({ ...localData, workHistory: newList }); }} /></div>
                                        <div><label style={labelStyle}>End Date</label><input style={inputStyle} value={w.endDate || ''} onChange={e => { const newList = [...localData.workHistory]; newList[i].endDate = e.target.value; setLocalData({ ...localData, workHistory: newList }); }} /></div>
                                        <div><label style={labelStyle}>Reason For Leaving</label><input style={inputStyle} value={w.reasonForLeaving || ''} onChange={e => { const newList = [...localData.workHistory]; newList[i].reasonForLeaving = e.target.value; setLocalData({ ...localData, workHistory: newList }); }} /></div>
                                    </div>
                                    <button onClick={() => { if (window.confirm("Delete experience?")) { const newList = localData.workHistory.filter((_, idx) => idx !== i); setLocalData({ ...localData, workHistory: newList }); } }} style={{ marginTop: 12, color: '#ef4444', background: 'none', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Delete This Entry</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {edit && <button onClick={() => setLocalData({ ...localData, workHistory: [...localData.workHistory, { companyName: '', role: '', startDate: '', endDate: '', ctc: '', location: '', reasonForLeaving: '' }] })} style={{ marginTop: 8, background: 'none', border: 'none', color: THEME.primary, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}><Plus size={16} /> Add New Experience</button>}
            </div>

            {/* Academic Performance (Fixed Levels) */}
            <div style={{ marginBottom: 32, paddingLeft: 40, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, maxWidth: 700 }}>
                    <h4 style={{ ...sectionTitleStyle, margin: 0 }}><div style={{ width: 3, height: 14, background: THEME.primary, borderRadius: 2 }} /> Academic Performance</h4>
                    <div style={{ width: 180 }}>
                        <EduDocSlot
                            label="Transfer Certificate (TC)"
                            docType="Transfer Certificate"
                            documents={documents}
                            isHR={isHR}
                            onUpload={handleEduDocUpload}
                            onDelete={handleDeleteEduDoc}
                            onPreview={onPreview}
                        />
                    </div>
                </div>
                <div style={{ position: 'relative' }}>
                    {localData.academic.map((a, i) => {
                        const levels = ['10th', '12th/Diploma', 'UG', 'PG'];
                        return (
                            <div key={i} style={{ position: 'relative', marginBottom: 80, maxWidth: 700 }}>
                                <TimelineLine index={i} length={localData.academic.length} />
                                <TimelineNode index={i} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {i === 1 ? (
                                            <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10, gap: 2 }}>
                                                {['12th', 'Diploma'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => {
                                                            const newList = [...localData.academic];
                                                            newList[i].type = type;
                                                            setLocalData({ ...localData, academic: newList });
                                                        }}
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: 8,
                                                            fontSize: 13,
                                                            fontWeight: 900,
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            background: (a.type || '12th') === type ? THEME.primary : 'transparent',
                                                            color: (a.type || '12th') === type ? THEME.white : '#64748b',
                                                            transition: '0.2s',
                                                            textTransform: 'uppercase'
                                                        }}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 24, fontWeight: 900, color: THEME.primary, textTransform: 'uppercase' }}>{a.course || a.degree || levels[i] || 'Academic Record'}</div>
                                        )}
                                        <div style={{ fontSize: 17, fontWeight: 700, color: '#64748b' }}>{a.institute || 'Institution Name'}</div>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>
                                        {a.year || 'Passing Year'}
                                    </div>
                                </div>

                                <div style={{ width: '100%', height: 1.5, background: '#64748b', marginBottom: 12, opacity: 0.3 }} />

                                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                                    <div style={{
                                        padding: '8px 16px', borderRadius: 12, background: '#fff7ed',
                                        fontSize: 13, fontWeight: 900, color: THEME.primary, border: `1px solid #ffedd5`
                                    }}>
                                        Score: {a.percentage || '0'} %
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>SPECIALIZATION:</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>
                                            {a.spec || (i === 0 ? 'General' : 'N/A')}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <button
                                        onClick={() => setExpandedDocs(expandedDocs === `edu_${i}` ? null : `edu_${i}`)}
                                        style={{ background: 'none', border: 'none', color: THEME.primary, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        <ChevronRight size={18} style={{ transform: expandedDocs === `edu_${i}` ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                                        Verification Documents
                                    </button>

                                    {expandedDocs === `edu_${i}` && (
                                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-start', gap: 16, background: '#f8fafc', padding: 20, borderRadius: 16, border: `1px solid ${THEME.border}` }}>
                                            {(i === 0 || (i === 1 && (a.type || '12th') !== 'Diploma')) ? (
                                                <div style={{ width: 140 }}>
                                                    <EduDocSlot
                                                        label="Mark Sheet"
                                                        docType={i === 0 ? '10th Marksheet' : '12th Marksheet'}
                                                        documents={documents} isHR={isHR} onUpload={handleEduDocUpload} onDelete={handleDeleteEduDoc} onPreview={onPreview}
                                                    />
                                                </div>
                                            ) : (i === 1 && (a.type || '12th') === 'Diploma') ? (
                                                <>
                                                    <div style={{ width: 130 }}>
                                                        <EduDocSlot
                                                            label="Provisional"
                                                            docType="Diploma Prov"
                                                            documents={documents} isHR={isHR} onUpload={handleEduDocUpload} onDelete={handleDeleteEduDoc} onPreview={onPreview}
                                                        />
                                                    </div>
                                                    <div style={{ width: 130 }}>
                                                        <EduDocSlot
                                                            label="Convocation"
                                                            docType="Diploma Conv"
                                                            documents={documents} isHR={isHR} onUpload={handleEduDocUpload} onDelete={handleDeleteEduDoc} onPreview={onPreview}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ width: 130 }}>
                                                        <EduDocSlot
                                                            label="Convocation"
                                                            docType={`${a.course || levels[i]} Convocation`}
                                                            documents={documents} isHR={isHR} onUpload={handleEduDocUpload} onDelete={handleDeleteEduDoc} onPreview={onPreview}
                                                        />
                                                    </div>
                                                    <div style={{ width: 130 }}>
                                                        <EduDocSlot
                                                            label="Provisional"
                                                            docType={`${a.course || levels[i]} Provisional`}
                                                            documents={documents} isHR={isHR} onUpload={handleEduDocUpload} onDelete={handleDeleteEduDoc} onPreview={onPreview}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {edit && (
                                    <div style={{ marginTop: 20, background: '#f8fafc', padding: 20, borderRadius: 16, border: `1px dashed ${THEME.border}` }}>
                                        {/* 12th / Diploma Switch */}
                                        {i === 1 && (
                                            <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                                                {['12th', 'Diploma'].map(type => (
                                                    <button key={type} onClick={() => { const newList = [...localData.academic]; newList[i].type = type; setLocalData({ ...localData, academic: newList }); }} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: a.type === type ? THEME.primary : THEME.white, color: a.type === type ? THEME.white : THEME.greyDark, border: `1px solid ${THEME.border}`, cursor: 'pointer' }}>{type}</button>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                            {a.isNew && (
                                                <div style={{ gridColumn: 'span 3' }}>
                                                    <label style={labelStyle}>Degree / Course Name *</label>
                                                    <input style={inputStyle} value={a.course || ''} onChange={e => { const newList = [...localData.academic]; newList[i].course = e.target.value; setLocalData({ ...localData, academic: newList }); }} placeholder="e.g. PhD, Certification, PG Diploma" />
                                                </div>
                                            )}
                                            <div><label style={labelStyle}>Institute Name</label><input style={inputStyle} value={a.institute || ''} onChange={e => { const newList = [...localData.academic]; newList[i].institute = e.target.value; setLocalData({ ...localData, academic: newList }); }} /></div>
                                            <div><label style={labelStyle}>Specialization</label><input style={inputStyle} value={a.spec || ''} onChange={e => { const newList = [...localData.academic]; newList[i].spec = e.target.value; setLocalData({ ...localData, academic: newList }); }} /></div>
                                            <div><label style={labelStyle}>Percentage / CGPA</label><input style={inputStyle} value={a.percentage || ''} onChange={e => { const newList = [...localData.academic]; newList[i].percentage = e.target.value; setLocalData({ ...localData, academic: newList }); }} /></div>
                                            <div><label style={labelStyle}>Passing Year</label><input style={inputStyle} value={a.year || ''} onChange={e => { const newList = [...localData.academic]; newList[i].year = e.target.value; setLocalData({ ...localData, academic: newList }); }} /></div>
                                        </div>
                                        {(i === 3 || a.isNew) && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Delete this academic record?")) {
                                                        const newList = localData.academic.filter((_, idx) => idx !== i);
                                                        setLocalData({ ...localData, academic: newList });
                                                    }
                                                }}
                                                style={{ marginTop: 12, color: '#ef4444', background: 'none', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                            >
                                                <Trash2 size={12} /> Delete This Academic Entry
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {edit && (
                        <button
                            onClick={() => setLocalData({
                                ...localData,
                                academic: [...localData.academic, { course: '', institute: '', percentage: '', year: '', spec: '', isNew: true }]
                            })}
                            style={{ marginTop: 16, background: 'none', border: 'none', color: THEME.primary, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}
                        >
                            <Plus size={16} /> Add New Academic Entry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function OnboardingChecklistSection({ employeeId, isHR, documents, employee, data, onRefresh, onPreview, isPod = false, activeTab, employment, isChecklistCompleted, setIsChecklistCompleted }) {
    const [checklistData, setChecklistData] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0);

    const companies = employment && employment.length > 0
        ? employment.map(e => e.companyName || e.company || 'Previous Company')
        : ['TSC', 'Zoho'];

    const refIdProof = useRef(null);
    const refEduProof = useRef(null);
    const refAgreements = useRef(null);
    const refPrevCompany = useRef(null);
    const refInduction = useRef(null);
    const refBgv = useRef(null);
    const refMailSystem = useRef(null);

    useEffect(() => {
        if (!activeTab || !isPod) return;
        let targetRef = null;
        if (activeTab === 'personal') targetRef = refIdProof;
        else if (activeTab === 'history') targetRef = refEduProof;
        else if (activeTab === 'company') targetRef = refAgreements;
        else if (activeTab === 'feedback') targetRef = refInduction;
        else if (activeTab === 'verification') targetRef = refBgv;
        else if (activeTab === 'candidate') targetRef = refIdProof;
        else if (activeTab === 'emergency') targetRef = refAgreements;

        if (targetRef && targetRef.current) {
            const container = targetRef.current.closest('.checklist-pod-scroll-container');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const targetRect = targetRef.current.getBoundingClientRect();
                const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
                container.scrollTo({
                    top: relativeTop - 12,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeTab]);

    useEffect(() => { fetchChecklist(); }, [employeeId]);

    const fetchChecklist = async () => {
        try {
            const res = await OnboardingAPI.getChecklist(employeeId);
            setChecklistData(res.data?.checklistData || {});
        }
        catch (e) { setChecklistData({}); }
        finally { setLoading(false); }
    };

    const updateField = async (key, value) => {
        if (!isHR) return;
        try {
            const newData = { ...checklistData, [key]: value };
            setChecklistData(newData);
            await OnboardingAPI.saveChecklist(employeeId, newData);
        } catch (e) { alert("Failed to update field"); }
    };

    const handleUpload = async (itemName, file, category = 'ONBOARDING') => {
        try {
            await OnboardingAPI.uploadDocument(employeeId, file, itemName, category);
            onRefresh();
        } catch (e) { alert("Upload failed"); }
    };

    const inputStyle = { width: '100%', height: 32, padding: '0 8px', borderRadius: 6, border: `1px solid ${THEME.border}`, fontSize: 11, background: THEME.white, outline: 'none' };
    const labelStyle = { fontSize: 10, fontWeight: 800, color: THEME.greyMain, marginBottom: 4, display: 'block' };

    const CheckItem = ({ label, id, docType = label, category = 'ONBOARDING' }) => {
        const doc = documents.find(d => d.documentType === docType && d.category === category);
        let isDone = checklistData[id] === 'COMPLETED' || !!doc;
        let previewUrl = null;

        // Special data-based checks
        if (label === 'Employee Emergency form' && employee?.emergencyContactName) isDone = true;
        if (label === 'Bank Account' && data?.bank?.accNo) isDone = true;
        if (label === 'Photo' && employee?.profilePhotoUrl) isDone = true;

        if (id.startsWith('prev_') && companies && companies.length > 0) {
            const currentCompany = companies[selectedCompanyIndex % companies.length];
            const companyRecord = employment?.find(e => (e.companyName || e.company) === currentCompany);
            if (companyRecord) {
                if (label === 'Offer Letter' && companyRecord.offerLetterUrl) { isDone = true; previewUrl = companyRecord.offerLetterUrl; }
                if (label === 'Experience Certificate' && companyRecord.experienceLetterUrl) { isDone = true; previewUrl = companyRecord.experienceLetterUrl; }
                if (label === 'Relieving Letter' && companyRecord.relievingLetterUrl) { isDone = true; previewUrl = companyRecord.relievingLetterUrl; }
                if (label === 'Pay Slip' && companyRecord.payslipsUrl) { isDone = true; previewUrl = companyRecord.payslipsUrl; }
                if (label === 'Bank Statement' && companyRecord.bankStatementUrl) { isDone = true; previewUrl = companyRecord.bankStatementUrl; }
            }
        }

        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: THEME.white, borderRadius: 10, border: `1px solid ${isDone ? THEME.primary : THEME.border}`, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateField(id, isDone ? 'PENDING' : 'COMPLETED')} disabled={!isHR} style={{ background: isDone ? THEME.primary : 'none', border: `2px solid ${isDone ? THEME.primary : THEME.border}`, width: 18, height: 18, borderRadius: 5, cursor: isHR ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.white }}>
                        {isDone && <CheckCircle size={12} />}
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? THEME.greyDark : THEME.greyMain }}>{label}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {(doc || previewUrl) && (
                        <button onClick={() => onPreview(doc || { documentUrl: previewUrl, documentType: label })} style={{ color: THEME.primary, background: 'none', border: 'none', cursor: 'pointer' }}><Eye size={14} /></button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: THEME.greyDark }}>Employee Joining Check List</h3>
                <button
                    onClick={() => {
                        const newVal = !isChecklistCompleted;
                        setIsChecklistCompleted(newVal);
                        localStorage.setItem(`checklist_completed_${employeeId}`, String(newVal));
                    }}
                    title={isChecklistCompleted ? 'Checklist Completed' : 'Mark Checklist Completed'}
                    style={{
                        background: isChecklistCompleted ? '#22c55e' : THEME.primary,
                        color: THEME.white,
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: isChecklistCompleted ? '0 4px 10px rgba(34, 197, 94, 0.18)' : '0 4px 10px rgba(249, 115, 22, 0.18)',
                        transition: 'all 0.15s'
                    }}
                >
                    {isChecklistCompleted ? <><CheckCircle size={14} /> Completed</> : <><CheckCircle size={14} /> Mark Completed</>}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isPod ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
                {/* 1. ID Proof */}
                <div ref={refIdProof} style={{ background: THEME.greyLight, padding: 16, borderRadius: 16 }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 900, color: THEME.primary }}>1. ID PROOF</h4>
                    {['Voter Id', 'Aadhaar Card', 'PAN Card', 'Passport Photo', 'Passport'].map(item => <CheckItem key={item} label={item} id={`id_${item.replace(/ /g, '')}`} category="PERSONAL" />)}
                </div>

                {/* 2. Education */}
                <div ref={refEduProof} style={{ background: THEME.greyLight, padding: 16, borderRadius: 16 }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 900, color: THEME.primary }}>2. EDUCATION PROOF</h4>
                    {['10th Marksheet', '12th Marksheet', 'Diploma Prov', 'Diploma Conv', 'UG Prov', 'UG Conv', 'PG Prov', 'PG Conv', 'TC'].map(item => <CheckItem key={item} label={item} id={`edu_${item.replace(/ /g, '')}`} />)}
                </div>

                {/* 3. Previous Experience */}
                <div ref={refPrevCompany} style={{ background: THEME.greyLight, padding: 16, borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: THEME.primary }}>3. PREVIOUS COMPANY PROOF</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: THEME.white, padding: '2px 8px', borderRadius: 8, border: `1px solid ${THEME.border}` }}>
                            <button
                                onClick={() => setSelectedCompanyIndex(prev => (prev - 1 + companies.length) % companies.length)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 900, color: THEME.primary, padding: '0 4px', display: 'flex', alignItems: 'center' }}
                            >
                                &lt;
                            </button>
                            <span style={{ fontSize: 10, fontWeight: 900, color: THEME.greyDark, textTransform: 'uppercase', minWidth: 40, textAlign: 'center' }}>
                                {companies[selectedCompanyIndex % companies.length]}
                            </span>
                            <button
                                onClick={() => setSelectedCompanyIndex(prev => (prev + 1) % companies.length)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 900, color: THEME.primary, padding: '0 4px', display: 'flex', alignItems: 'center' }}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                    {['Offer Letter', 'Experience Certificate', 'Relieving Letter', 'Pay Slip', 'Bank Statement'].map(item => {
                        const currentCompany = companies[selectedCompanyIndex % companies.length];
                        return (
                            <CheckItem
                                key={item}
                                label={item}
                                docType={`${currentCompany} - ${item}`}
                                id={`prev_${currentCompany.replace(/ /g, '')}_${item.replace(/ /g, '')}`}
                            />
                        );
                    })}
                </div>

                {/* 4. Agreement & Uniform */}
                <div ref={refAgreements} style={{ background: THEME.greyLight, padding: 16, borderRadius: 16 }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 900, color: THEME.primary }}>4. AGREEMENTS</h4>
                    <div style={{ marginBottom: 16 }}>
                        {['NDA', 'NCA', 'Onsite Agreement', 'Employee Emergency form', 'Appointment Letter', 'Bank Account'].map(item => <CheckItem key={item} label={item} id={`agr_${item.replace(/ /g, '')}`} />)}
                    </div>

                    <div style={{ background: '#f8fafc', padding: '16px 12px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: 11, fontWeight: 900, color: THEME.greyDark }}>UNIFORM DETAILS</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={labelStyle}>Uniform Pant</label><input disabled={!isHR} style={{ ...inputStyle, background: THEME.white }} placeholder="Size" value={checklistData.pantSize || ''} onChange={e => updateField('pantSize', e.target.value)} /></div>
                            <div><label style={labelStyle}>Uniform Shirt</label><input disabled={!isHR} style={{ ...inputStyle, background: THEME.white }} placeholder="Size" value={checklistData.shirtSize || ''} onChange={e => updateField('shirtSize', e.target.value)} /></div>
                        </div>
                    </div>
                </div>

                {/* 5. Induction */}
                <div ref={refInduction} style={{ background: THEME.greyLight, padding: 16, borderRadius: 16 }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 900, color: THEME.primary }}>5. INDUCTION</h4>
                    <div style={{ display: 'grid', gap: 10 }}>
                        <div><label style={labelStyle}>Orientation Date</label><input disabled={!isHR} type="date" style={inputStyle} value={checklistData.inductionDate || ''} onChange={e => updateField('inductionDate', e.target.value)} /></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}><input type="checkbox" checked={checklistData.inductionConducted === 'YES'} onChange={e => updateField('inductionConducted', e.target.checked ? 'YES' : 'NO')} /><span style={{ fontSize: 11, fontWeight: 700 }}>Conducted?</span></div>
                        <div><label style={labelStyle}>Conducted By</label><input disabled={!isHR} style={inputStyle} value={checklistData.inductionBy || ''} onChange={e => updateField('inductionBy', e.target.value)} /></div>
                    </div>
                </div>

                {/* 6. BGV */}
                <div ref={refBgv} style={{ background: THEME.greyLight, padding: 16, borderRadius: 16 }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 900, color: THEME.primary }}>6. BACKGROUND VERIFICATION</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><label style={labelStyle}>Initiate Date</label><input disabled={!isHR} type="date" style={inputStyle} value={checklistData.bgvInitDate || ''} onChange={e => updateField('bgvInitDate', e.target.value)} /></div>
                        <div><label style={labelStyle}>Initiate By</label><input disabled={!isHR} style={inputStyle} value={checklistData.bgvInitBy || ''} onChange={e => updateField('bgvInitBy', e.target.value)} /></div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Mode of Verification</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <select disabled={!isHR} style={inputStyle} value={checklistData.bgvMode || ''} onChange={e => updateField('bgvMode', e.target.value)}><option value="">Select Mode</option><option value="Mail">Mail</option><option value="Oral">Oral</option></select>
                                <select disabled={!isHR} style={inputStyle} value={checklistData.bgvStatus || ''} onChange={e => updateField('bgvStatus', e.target.value)}><option value="">Result</option><option value="Positive">Positive</option><option value="Negative">Negative</option></select>
                            </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Receiving Date</label><input disabled={!isHR} type="date" style={inputStyle} value={checklistData.bgvRecDate || ''} onChange={e => updateField('bgvRecDate', e.target.value)} /></div>
                    </div>
                </div>

                {/* 7. Mail & System */}
                <div ref={refMailSystem} style={{ background: THEME.greyLight, padding: 16, borderRadius: 16, gridColumn: isPod ? 'span 1' : 'span 3' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 900, color: THEME.primary }}>7. MAIL & SYSTEM DETAILS</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: isPod ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 15 }}>
                        <div><label style={labelStyle}>Mail ID Request Date</label><input disabled={!isHR} type="date" style={inputStyle} value={checklistData.mailReqDate || ''} onChange={e => updateField('mailReqDate', e.target.value)} /></div>
                        <div><label style={labelStyle}>Initiated By</label><input disabled={!isHR} style={inputStyle} value={checklistData.mailInitBy || ''} onChange={e => updateField('mailInitBy', e.target.value)} /></div>
                        <div><label style={labelStyle}>Mail Created Date</label><input disabled={!isHR} type="date" style={inputStyle} value={checklistData.mailCreatedDate || ''} onChange={e => updateField('mailCreatedDate', e.target.value)} /></div>
                        <div><label style={labelStyle}>Created By</label><input disabled={!isHR} style={inputStyle} value={checklistData.mailCreatedBy || ''} onChange={e => updateField('mailCreatedBy', e.target.value)} /></div>

                        <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Official Mail ID (@elintsys / integro)</label><input disabled={!isHR} style={inputStyle} value={checklistData.officialMail || ''} onChange={e => updateField('officialMail', e.target.value)} /></div>
                        <div><label style={labelStyle}>VPN Request Date</label><input disabled={!isHR} type="date" style={inputStyle} value={checklistData.vpnReqDate || ''} onChange={e => updateField('vpnReqDate', e.target.value)} /></div>
                        <div><label style={labelStyle}>VPN Details</label><input disabled={!isHR} style={inputStyle} value={checklistData.vpnDetails || ''} onChange={e => updateField('vpnDetails', e.target.value)} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InductionFeedbackSection({ employeeId, isHR }) {
    const [data, setData] = useState({
        preEmployment: { q1: '', q2: '', q3: '', q4: '', q5: '' },
        induction: { q6: '', q7: '', q8: '', q9: '', q10: '', q11: '', q12: '', q13: '', q14: '', q15: '', q16: '', q17: '', q18: '' },
        training: { q19: '', q20: '', q21: '', q22: '', q23: '', q24: '', q25: '' }
    });
    const [edit, setEdit] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await OnboardingAPI.getFeedback(employeeId);
                if (res.data?.feedbackData) setData(res.data.feedbackData);
            }
            catch (e) { }
        };
        fetch();
    }, [employeeId]);

    const handleSave = async () => {
        try { await OnboardingAPI.saveFeedback(employeeId, data); setEdit(false); alert("Feedback saved."); }
        catch (e) { alert("Save failed."); }
    };

    const qStyle = { marginBottom: 16, padding: 16, background: THEME.white, borderRadius: 12, border: `1px solid ${THEME.border}` };
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: THEME.greyDark, marginBottom: 10 };

    const renderQuestions = (section, qs) => (
        <div style={{ display: 'grid', gap: 12 }}>
            {qs.map(q => (
                <div key={q.id} style={qStyle}>
                    <label style={labelStyle}>{q.text}</label>
                    {edit ? (
                        <textarea
                            style={{
                                width: '100%', minHeight: 80, padding: 12, borderRadius: 10,
                                border: `1px solid ${THEME.border}`, fontSize: 13,
                                background: THEME.white, outline: 'none', resize: 'vertical'
                            }}
                            placeholder="Type your feedback here..."
                            value={data[section][q.id] || ''}
                            onChange={e => { const d = { ...data }; d[section][q.id] = e.target.value; setData(d); }}
                        />
                    ) : (
                        <div style={{
                            padding: '12px 16px', background: THEME.greyLight, borderRadius: 10,
                            fontSize: 13, color: THEME.greyDark, fontStyle: data[section][q.id] ? 'normal' : 'italic',
                            borderLeft: `4px solid ${THEME.primary}`
                        }}>
                            {data[section][q.id] || 'No feedback provided yet.'}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: THEME.greyDark }}>Induction Feedback</h3>
                <button onClick={() => edit ? handleSave() : setEdit(true)} style={{ background: THEME.primary, color: THEME.white, border: 'none', padding: '8px 24px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                    {edit ? 'Save Feedback' : 'Edit Feedback'}
                </button>
            </div>

            <div style={{ marginBottom: 32 }}>
                <h4 style={{ color: THEME.primary, fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, marginBottom: 16 }}>I. Pre-Employment Experience</h4>
                {renderQuestions('preEmployment', [
                    { id: 'q1', text: '1. How were you recruited to Elintsys?' },
                    { id: 'q2', text: '2. How satisfied were you with the number of interviews/rounds conducted by Elintsys?' },
                    { id: 'q3', text: '3. How satisfied were you with the organization and scheduling of your interviews?' },
                    { id: 'q4', text: '4. How satisfied were you with the length of time it took from the time you applied to the time you were hired?' },
                    { id: 'q5', text: '5. Overall, how satisfied were you with Elintsys interview process?' }
                ])}
            </div>

            <div style={{ marginBottom: 32 }}>
                <h4 style={{ color: THEME.primary, fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, marginBottom: 16 }}>II. New Employee Induction</h4>
                {renderQuestions('induction', [
                    { id: 'q6', text: '6. How satisfied were you with your first day of induction?' },
                    { id: 'q7', text: '7. How satisfied were you with the welcome you received from your HR team?' },
                    { id: 'q8', text: '8. Did you undergo joining procedure/formalities before induction?' },
                    { id: 'q9', text: '9. Were you informed about company history during induction?' },
                    { id: 'q10', text: '10. Were you inducted on Vision, mission, code of conduct of Elintsys?' },
                    { id: 'q11', text: '11. Were you inducted on organization structure & business overview?' },
                    { id: 'q12', text: '12. Were your job description & responsibilities informed?' },
                    { id: 'q13', text: '13. Inducted on HR policies & procedures of Elintsys?' },
                    { id: 'q14', text: '14. Were you inducted on process flow/SDLC of Elintsys?' },
                    { id: 'q15', text: '15. Were you inducted on office etiquettes?' },
                    { id: 'q16', text: '16. Were you informed on reporting procedure?' },
                    { id: 'q17', text: '17. How satisfied on Inter department induction?' },
                    { id: 'q18', text: '18. How satisfied are you with infrastructure/system allocation/stationery/phone provide to you to complete job.' }
                ])}
            </div>

            <div style={{ marginBottom: 32 }}>
                <h4 style={{ color: THEME.primary, fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, marginBottom: 16 }}>III. Training Comments</h4>
                {renderQuestions('training', [
                    { id: 'q19', text: "19. How satisfied were you with your manager's ability to lead and provide direction to you?" },
                    { id: 'q20', text: '20. When you were hired, what percentage of your skills matched those required to perform your job?' },
                    { id: 'q21', text: '21. How satisfied were you with the Technical training?' },
                    { id: 'q22', text: '22. How satisfied were you with the flexibility and ease of completing the technical training?' },
                    { id: 'q23', text: '23. How satisfied were you with the assistance provided by your manager to complete your training?' },
                    { id: 'q24', text: '24. How satisfied were you with the availability of your mentor or co-worker to assist you in completing your training?' },
                    { id: 'q25', text: '25. How satisfied were you with the length of time given to complete training during work hours?' }
                ])}
            </div>
        </div>
    );
}

function BGVSection({ employeeId, isHR, isBgvCompleted, setIsBgvCompleted }) {
    const [data, setData] = useState({
        applicantName: '', employeeCode: '', designation: '', doj: '', dor: '',
        remunerations: '', reportedTo: '', reasonForLeaving: '', rehireEligible: 'YES',
        rehireReason: '', companyPolicyReason: '', otherReason: '',
        exitStatus: 'Completed', pendingWithEmployer: '', pendingWithEmployee: '',
        documentsGenuine: 'YES', tenureIssues: '', additionalRemarks: '',
        respondentNameDesignation: '', respondentContact: ''
    });
    const [edit, setEdit] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await OnboardingAPI.getVerification(employeeId);
                if (res.data?.verificationData) setData({ ...data, ...res.data.verificationData });
            }
            catch (e) { }
        };
        fetch();
    }, [employeeId]);

    const handleSave = async () => {
        try {
            await OnboardingAPI.saveVerification(employeeId, data);
            setEdit(false);
            alert("BGV data saved successfully.");
        }
        catch (e) { alert("Save failed."); }
    };

    const inputStyle = {
        width: '100%', height: 42, padding: '0 14px', borderRadius: 10,
        border: `1px solid ${THEME.border}`, fontSize: 13,
        background: edit ? THEME.white : THEME.greyLight, outline: 'none',
        transition: '0.2s', color: THEME.greyDark, fontWeight: 600
    };
    const labelStyle = {
        display: 'block', fontSize: 11, fontWeight: 800,
        color: THEME.greyMain, marginBottom: 6, textTransform: 'uppercase'
    };
    const subHeaderStyle = {
        color: THEME.primary, fontWeight: 900, fontSize: 12,
        letterSpacing: 1, marginBottom: 16, marginTop: 24,
        paddingBottom: 8, borderBottom: `2px solid ${THEME.primaryLight}`
    };

    return (
        <div style={{ maxWidth: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: THEME.greyDark }}>Employee Background Verification</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => {
                            const newVal = !isBgvCompleted;
                            setIsBgvCompleted(newVal);
                            localStorage.setItem(`bgv_completed_${employeeId}`, String(newVal));
                        }}
                        style={{
                            background: isBgvCompleted ? '#22c55e' : THEME.primary,
                            color: THEME.white,
                            border: 'none',
                            padding: '8px 24px',
                            borderRadius: 10,
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: isBgvCompleted ? '0 4px 12px rgba(34, 197, 94, 0.2)' : '0 4px 12px rgba(249, 115, 22, 0.2)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isBgvCompleted && <CheckCircle size={16} />}
                        {isBgvCompleted ? 'BGV Completed' : 'Mark BGV Completed'}
                    </button>
                    {isHR && (
                        <button onClick={() => edit ? handleSave() : setEdit(true)} style={{ background: THEME.primary, color: THEME.white, border: 'none', padding: '8px 24px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {edit ? <><Save size={16} /> Save BGV Form</> : <><RefreshCw size={16} /> Update BGV</>}
                        </button>
                    )}
                </div>
            </div>

            {/* I. Employee Details */}
            <h4 style={subHeaderStyle}>I. EMPLOYEE DETAILS (AS PER RECORDS)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 24 }}>
                <div><label style={labelStyle}>Date of Joining</label><input disabled={!edit} type="date" style={inputStyle} value={data.doj || ''} onChange={e => setData({ ...data, doj: e.target.value })} /></div>
                <div><label style={labelStyle}>Date of Relieving (LWD)</label><input disabled={!edit} type="date" style={inputStyle} value={data.dor || ''} onChange={e => setData({ ...data, dor: e.target.value })} /></div>
                <div><label style={labelStyle}>Remunerations</label><input disabled={!edit} style={inputStyle} value={data.remunerations || ''} onChange={e => setData({ ...data, remunerations: e.target.value })} /></div>

                <div><label style={labelStyle}>Reported to (Supervisor)</label><input disabled={!edit} style={inputStyle} value={data.reportedTo || ''} onChange={e => setData({ ...data, reportedTo: e.target.value })} /></div>
                <div><label style={labelStyle}>Reason for Leaving</label><input disabled={!edit} style={inputStyle} value={data.reasonForLeaving || ''} onChange={e => setData({ ...data, reasonForLeaving: e.target.value })} /></div>
                <div>
                    <label style={labelStyle}>Candidate eligible to Rehire?</label>
                    <select disabled={!edit} style={inputStyle} value={data.rehireEligible || 'YES'} onChange={e => setData({ ...data, rehireEligible: e.target.value })}>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </div>

                <div><label style={labelStyle}>As Per Company Policy</label><input disabled={!edit} style={inputStyle} value={data.companyPolicyReason || ''} onChange={e => setData({ ...data, companyPolicyReason: e.target.value })} /></div>
                <div><label style={labelStyle}>Any Other Reason</label><input disabled={!edit} style={inputStyle} value={data.otherReason || ''} onChange={e => setData({ ...data, otherReason: e.target.value })} /></div>
                {data.rehireEligible === 'NO' ? (
                    <div><label style={labelStyle}>Reason for No Rehire</label><input disabled={!edit} style={inputStyle} value={data.rehireReason || ''} onChange={e => setData({ ...data, rehireReason: e.target.value })} /></div>
                ) : <div />}
            </div>

            {/* Bottom Two-Column Dashboard Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 30, marginBottom: 40 }}>
                {/* Left Column: III. Document Authenticity & Tenure */}
                <div>
                    <h4 style={subHeaderStyle}>III. DOCUMENT AUTHENTICITY & TENURE</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <div>
                            <label style={labelStyle}>Are the Attached Documents Genuine?</label>
                            <select disabled={!edit} style={inputStyle} value={data.documentsGenuine || 'YES'} onChange={e => setData({ ...data, documentsGenuine: e.target.value })}>
                                <option value="YES">YES</option>
                                <option value="NO">NO</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Any issues reported during tenure (Ethics, Credibility, Reputation)?</label>
                            <textarea disabled={!edit} style={{ ...inputStyle, height: 70, padding: 10, resize: 'none' }} value={data.tenureIssues || ''} onChange={e => setData({ ...data, tenureIssues: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Additional Remarks</label>
                            <textarea disabled={!edit} style={{ ...inputStyle, height: 70, padding: 10, resize: 'none' }} value={data.additionalRemarks || ''} onChange={e => setData({ ...data, additionalRemarks: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Right Column: II. Exit Formalities Status & IV. Respondent Details */}
                <div>
                    <div>
                        <h4 style={subHeaderStyle}>II. EXIT FORMALITIES STATUS</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 20 }}>
                            <div>
                                <label style={labelStyle}>Status (Pending / Completed)</label>
                                <select disabled={!edit} style={inputStyle} value={data.exitStatus || 'Completed'} onChange={e => setData({ ...data, exitStatus: e.target.value })}>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                            {data.exitStatus === 'Pending' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div><label style={labelStyle}>Pending with Employer</label><input disabled={!edit} style={inputStyle} value={data.pendingWithEmployer || ''} onChange={e => setData({ ...data, pendingWithEmployer: e.target.value })} /></div>
                                    <div><label style={labelStyle}>Pending with Employee</label><input disabled={!edit} style={inputStyle} value={data.pendingWithEmployee || ''} onChange={e => setData({ ...data, pendingWithEmployee: e.target.value })} /></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <h4 style={subHeaderStyle}>IV. RESPONDENT DETAILS</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div><label style={labelStyle}>Name & Designation</label><input disabled={!edit} style={inputStyle} value={data.respondentNameDesignation || ''} onChange={e => setData({ ...data, respondentNameDesignation: e.target.value })} /></div>
                            <div><label style={labelStyle}>Contact Details</label><input disabled={!edit} style={inputStyle} value={data.respondentContact || ''} onChange={e => setData({ ...data, respondentContact: e.target.value })} /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ExitManagementSection({ employeeId, isHR, onPreview }) {
    const [data, setData] = useState({
        separationType: 'Resignation',
        resignationLetter: 'NO', resignationDate: '', acceptanceDate: '',
        terminationReason: '', terminationDate: '', terminationLetterSent: 'NO', relievingDate: '',
        abscondDate: '', showCauseSent: 'NO', showCauseDate: '', employeeResponse: 'NO',
        nocConducted: 'NO', pmName: '', nocDate: '',
        exitInterview: 'NO',
        propertyID: 'NO', propertyKey: 'NO', propertyLaptop: 'NO', propertyPass: 'NO',
        propertyTo: '', propertyDate: '',
        mailBlocked: 'NO', mailBlockedDate: '', mailBlockedBy: '',
        docRelieving: 'NO', docRelievingDate: '',
        docService: 'NO', docServiceDate: '',
        docPaySlip: 'NO', docAppraisal: 'NA', docPFExit: 'NA', docFinalSettlement: 'NO'
    });
    const [edit, setEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [exitDocs, setExitDocs] = useState([]);

    const fetchExitDocs = async () => {
        try {
            const res = await OnboardingAPI.getDocuments(employeeId, 'EXIT');
            setExitDocs(res.data || []);
        } catch (e) { }
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await ExitManagementAPI.get(employeeId);
                if (res.data?.exitData) setData({ ...data, ...res.data.exitData });
            }
            catch (e) { }
            finally { setLoading(false); }
        };
        fetch();
        fetchExitDocs();
    }, [employeeId]);

    const handleSave = async () => {
        try {
            await ExitManagementAPI.save(employeeId, data);
            setEdit(false);
            alert("Exit Management data saved successfully.");
        }
        catch (e) { alert("Save failed."); }
    };

    const handleUploadExitDoc = async (file, type) => {
        try {
            await OnboardingAPI.uploadDocument(employeeId, file, type, 'EXIT');
            fetchExitDocs();
            alert(`${type} uploaded successfully!`);
        } catch (e) {
            alert("Upload failed");
        }
    };

    const handleDeleteExitDoc = async (docId) => {
        if (!window.confirm("Delete this document?")) return;
        try {
            await OnboardingAPI.deleteDocument(docId);
            fetchExitDocs();
            alert("Document deleted successfully!");
        } catch (e) {
            alert("Delete failed");
        }
    };

    const InlineDocSlot = ({ type }) => {
        const doc = exitDocs.find(d => d.documentType === type);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, background: THEME.primaryLight, padding: '4px 8px', borderRadius: 6, border: `1px dashed ${THEME.primary}` }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: THEME.primary, textTransform: 'uppercase', marginRight: 'auto' }}>File: {doc ? 'Uploaded' : 'No File'}</span>
                {doc && (
                    <button onClick={() => onPreview(doc)} style={{ background: 'none', border: 'none', color: THEME.primary, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }} title="View">
                        <Eye size={12} />
                    </button>
                )}
                {doc && (
                    <button onClick={() => handleDeleteExitDoc(doc.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }} title="Delete">
                        <Trash2 size={12} />
                    </button>
                )}
                <FileUploader onFile={(f) => handleUploadExitDoc(f, type)}>
                    <button style={{ background: 'none', border: 'none', color: THEME.primary, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }} title={doc ? "Re-upload" : "Upload file"}>
                        <Upload size={12} />
                    </button>
                </FileUploader>
            </div>
        );
    };

    const inputStyle = {
        width: '100%', height: 40, padding: '0 12px', borderRadius: 8,
        border: `1px solid ${THEME.border}`, fontSize: 12,
        background: edit ? THEME.white : THEME.greyLight, outline: 'none',
        transition: '0.2s', color: THEME.greyDark, fontWeight: 600
    };
    const labelStyle = {
        display: 'block', fontSize: 10, fontWeight: 800,
        color: THEME.greyMain, marginBottom: 4, textTransform: 'uppercase'
    };
    const subHeaderStyle = {
        color: THEME.primary, fontWeight: 900, fontSize: 11,
        letterSpacing: 1, marginBottom: 12, marginTop: 20,
        paddingBottom: 6, borderBottom: `2px solid ${THEME.primaryLight}`
    };

    if (loading) return <div>Loading exit details...</div>;

    return (
        <div style={{ maxWidth: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: THEME.greyDark }}>Employee Relieving Check List</h3>
                {isHR && (
                    <button onClick={() => edit ? handleSave() : setEdit(true)} style={{ background: THEME.primary, color: THEME.white, border: 'none', padding: '8px 20px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {edit ? <><Save size={14} /> Save Check List</> : <><RefreshCw size={14} /> Update List</>}
                    </button>
                )}
            </div>

            {/* I. Nature of Separation */}
            <h4 style={subHeaderStyle}>I. NATURE OF SEPARATION</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, background: THEME.greyLight, padding: 15, borderRadius: 12, marginBottom: 20 }}>
                <div>
                    <label style={labelStyle}>Separation Type</label>
                    <select disabled={!edit} style={inputStyle} value={data.separationType} onChange={e => setData({ ...data, separationType: e.target.value })}>
                        <option value="Resignation">Resignation</option>
                        <option value="Termination">Termination / Relieved</option>
                        <option value="Abscond">Abscond</option>
                    </select>
                </div>

                {data.separationType === 'Resignation' && (
                    <>
                        <div>
                            <label style={labelStyle}>Resignation Letter</label>
                            <select disabled={!edit} style={inputStyle} value={data.resignationLetter} onChange={e => setData({ ...data, resignationLetter: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select>
                            <InlineDocSlot type="Resignation Letter" />
                        </div>
                        <div><label style={labelStyle}>Letter Submitted Date</label><input disabled={!edit} type="date" style={inputStyle} value={data.resignationDate} onChange={e => setData({ ...data, resignationDate: e.target.value })} /></div>
                        <div><label style={labelStyle}>Acceptance Email/Date</label><input disabled={!edit} style={inputStyle} value={data.acceptanceDate} onChange={e => setData({ ...data, acceptanceDate: e.target.value })} /></div>
                    </>
                )}

                {data.separationType === 'Termination' && (
                    <>
                        <div><label style={labelStyle}>Reason for Termination</label><input disabled={!edit} style={inputStyle} value={data.terminationReason} onChange={e => setData({ ...data, terminationReason: e.target.value })} /></div>
                        <div><label style={labelStyle}>Termination Date</label><input disabled={!edit} type="date" style={inputStyle} value={data.terminationDate} onChange={e => setData({ ...data, terminationDate: e.target.value })} /></div>
                        <div>
                            <label style={labelStyle}>Letter Sent?</label>
                            <select disabled={!edit} style={inputStyle} value={data.terminationLetterSent} onChange={e => setData({ ...data, terminationLetterSent: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select>
                            <InlineDocSlot type="Termination Letter" />
                        </div>
                        <div><label style={labelStyle}>Relieving Date</label><input disabled={!edit} type="date" style={inputStyle} value={data.relievingDate} onChange={e => setData({ ...data, relievingDate: e.target.value })} /></div>
                    </>
                )}

                {data.separationType === 'Abscond' && (
                    <>
                        <div><label style={labelStyle}>Did not report since</label><input disabled={!edit} type="date" style={inputStyle} value={data.abscondDate} onChange={e => setData({ ...data, abscondDate: e.target.value })} /></div>
                        <div>
                            <label style={labelStyle}>Show Cause Sent?</label>
                            <select disabled={!edit} style={inputStyle} value={data.showCauseSent} onChange={e => setData({ ...data, showCauseSent: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select>
                            <InlineDocSlot type="Show Cause Notice" />
                        </div>
                        <div><label style={labelStyle}>Notice Sent Date</label><input disabled={!edit} type="date" style={inputStyle} value={data.showCauseDate} onChange={e => setData({ ...data, showCauseDate: e.target.value })} /></div>
                        <div>
                            <label style={labelStyle}>Response from Employee?</label>
                            <select disabled={!edit} style={inputStyle} value={data.employeeResponse} onChange={e => setData({ ...data, employeeResponse: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select>
                            <InlineDocSlot type="Employee Response" />
                        </div>
                    </>
                )}
            </div>

            {/* II. NOC Details */}
            <h4 style={subHeaderStyle}>II. NOC DETAILS (KNOWLEDGE TRANSFER)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 20 }}>
                <div>
                    <label style={labelStyle}>NOC from Project Manager?</label>
                    <select disabled={!edit} style={inputStyle} value={data.nocConducted} onChange={e => setData({ ...data, nocConducted: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select>
                    <InlineDocSlot type="NOC Document" />
                </div>
                <div><label style={labelStyle}>Name of Project Manager</label><input disabled={!edit} style={inputStyle} value={data.pmName} onChange={e => setData({ ...data, pmName: e.target.value })} /></div>
                <div><label style={labelStyle}>Date of NOC</label><input disabled={!edit} type="date" style={inputStyle} value={data.nocDate} onChange={e => setData({ ...data, nocDate: e.target.value })} /></div>
            </div>

            {/* III. Exit Formalities */}
            <h4 style={subHeaderStyle}>III. EXIT FORMALITIES</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 20 }}>
                <div>
                    <label style={labelStyle}>Exit Interview Process</label>
                    <select disabled={!edit} style={inputStyle} value={data.exitInterview} onChange={e => setData({ ...data, exitInterview: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select>
                    <InlineDocSlot type="Exit Interview Form" />
                </div>

                <div style={{ gridColumn: 'span 3', background: THEME.white, border: `1px solid ${THEME.border}`, padding: 15, borderRadius: 12 }}>
                    <label style={{ ...labelStyle, marginBottom: 12 }}>Office Property Surrender Status</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                        <div><label style={{ ...labelStyle, fontSize: 9 }}>ID Card</label><select disabled={!edit} style={inputStyle} value={data.propertyID} onChange={e => setData({ ...data, propertyID: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select></div>
                        <div><label style={{ ...labelStyle, fontSize: 9 }}>Key</label><select disabled={!edit} style={inputStyle} value={data.propertyKey} onChange={e => setData({ ...data, propertyKey: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select></div>
                        <div><label style={{ ...labelStyle, fontSize: 9 }}>Laptop</label><select disabled={!edit} style={inputStyle} value={data.propertyLaptop} onChange={e => setData({ ...data, propertyLaptop: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select></div>
                        <div><label style={{ ...labelStyle, fontSize: 9 }}>Gate Pass</label><select disabled={!edit} style={inputStyle} value={data.propertyPass} onChange={e => setData({ ...data, propertyPass: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        <div><label style={labelStyle}>Surrender To</label><input disabled={!edit} style={inputStyle} value={data.propertyTo} onChange={e => setData({ ...data, propertyTo: e.target.value })} /></div>
                        <div><label style={labelStyle}>Surrender Date</label><input disabled={!edit} type="date" style={inputStyle} value={data.propertyDate} onChange={e => setData({ ...data, propertyDate: e.target.value })} /></div>
                    </div>
                </div>

                <div style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
                    <div><label style={labelStyle}>Mail Blocked?</label><select disabled={!edit} style={inputStyle} value={data.mailBlocked} onChange={e => setData({ ...data, mailBlocked: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select></div>
                    <div><label style={labelStyle}>Mail Blocked Date</label><input disabled={!edit} type="date" style={inputStyle} value={data.mailBlockedDate} onChange={e => setData({ ...data, mailBlockedDate: e.target.value })} /></div>
                    <div><label style={labelStyle}>Blocked By</label><input disabled={!edit} style={inputStyle} value={data.mailBlockedBy} onChange={e => setData({ ...data, mailBlockedBy: e.target.value })} /></div>
                </div>
            </div>

            {/* IV. Exit Documents to Employee */}
            <h4 style={subHeaderStyle}>IV. EXIT DOCUMENTS TO EMPLOYEE</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 20 }}>
                <div>
                    <label style={labelStyle}>Relieving Letter</label>
                    <select disabled={!edit} style={inputStyle} value={data.docRelieving} onChange={e => setData({ ...data, docRelieving: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option><option value="NA">NA</option></select>
                    <InlineDocSlot type="Relieving Letter" />
                </div>
                <div><label style={labelStyle}>Letter Date</label><input disabled={!edit} type="date" style={inputStyle} value={data.docRelievingDate} onChange={e => setData({ ...data, docRelievingDate: e.target.value })} /></div>

                <div>
                    <label style={labelStyle}>Service Letter</label>
                    <select disabled={!edit} style={inputStyle} value={data.docService} onChange={e => setData({ ...data, docService: e.target.value })}><option value="YES">YES</option><option value="NA">NA</option></select>
                    <InlineDocSlot type="Service Certificate" />
                </div>

                <div>
                    <label style={labelStyle}>Pay Slip</label>
                    <select disabled={!edit} style={inputStyle} value={data.docPaySlip} onChange={e => setData({ ...data, docPaySlip: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select>
                    <InlineDocSlot type="Final Settlement Payslip" />
                </div>
                <div>
                    <label style={labelStyle}>Appraisal Letter</label>
                    <select disabled={!edit} style={inputStyle} value={data.docAppraisal} onChange={e => setData({ ...data, docAppraisal: e.target.value })}><option value="NA">NA</option><option value="YES">YES</option></select>
                    <InlineDocSlot type="Appraisal Letter" />
                </div>
                <div>
                    <label style={labelStyle}>PF Exit</label>
                    <select disabled={!edit} style={inputStyle} value={data.docPFExit} onChange={e => setData({ ...data, docPFExit: e.target.value })}><option value="NA">NA</option><option value="YES">YES</option></select>
                    <InlineDocSlot type="PF Exit Document" />
                </div>

                <div>
                    <label style={labelStyle}>Final Settlement</label>
                    <select disabled={!edit} style={inputStyle} value={data.docFinalSettlement} onChange={e => setData({ ...data, docFinalSettlement: e.target.value })}><option value="YES">YES</option><option value="NO">NO</option></select>
                    <InlineDocSlot type="Final Settlement Sheet" />
                </div>
            </div>

            {/* V. Exit Documents Attachments */}
            <h4 style={subHeaderStyle}>V. EXIT DOCUMENTS ATTACHMENTS</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    'Resignation Letter',
                    'Relieving Letter',
                    'Service Certificate',
                    'Final Settlement Payslip'
                ].map(type => {
                    const doc = exitDocs.find(d => d.documentType === type);
                    return (
                        <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: THEME.white, borderRadius: 12, border: `1px solid ${THEME.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <FileText size={20} color={THEME.primary} />
                                <div>
                                    <div style={{ fontWeight: 800, color: THEME.greyDark, fontSize: 13 }}>{type}</div>
                                    <div style={{ fontSize: 11, color: THEME.greyMain }}>{doc ? 'Uploaded' : 'Action Required'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {doc && (
                                    <button onClick={() => onPreview(doc)} style={{ background: 'none', border: 'none', color: THEME.primary, cursor: 'pointer', padding: 4 }} title="View">
                                        <Eye size={16} />
                                    </button>
                                )}
                                {doc && (
                                    <button onClick={() => handleDeleteExitDoc(doc.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <FileUploader onFile={(f) => handleUploadExitDoc(f, type)}>
                                    <button style={{ background: THEME.primary, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Upload size={12} /> {doc ? 'Re-upload' : 'Upload'}
                                    </button>
                                </FileUploader>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


function PersonalDocsSection({ docs, isHR, onUpload, onDelete, onPreview }) {
    const [uploadingType, setUploadingType] = useState(null);
    const list = [
        { t: 'PAN Card', k: 'p' },
        { t: 'Aadhaar Card', k: 'a' },
        { t: 'Passport Photo', k: 'ph' },
        { t: 'Voter Id', k: 'v' },
        { t: 'Passport', k: 'ps' }
    ];
    return (
        <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: THEME.greyDark, marginBottom: 20 }}>Personal Documents</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {list.map(req => {
                    const doc = docs.find(d => d.documentType === req.t);
                    const isUploading = uploadingType === req.k;
                    return (
                        <div key={req.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: THEME.white, borderRadius: 12, border: `1px solid ${THEME.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <FileText size={20} color={THEME.greyMain} />
                                <div>
                                    <div style={{ fontWeight: 800, color: THEME.greyDark, fontSize: 14 }}>{req.t}</div>
                                    <div style={{ fontSize: 11, color: THEME.greyMain }}>{doc ? 'Uploaded' : 'Action Required'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {doc && <button onClick={() => onPreview(doc)} style={{ color: THEME.primary, background: 'none', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Preview</button>}
                                {doc && isHR && <button onClick={() => onDelete(doc.id)} style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Delete</button>}
                                {isHR && (
                                    <FileUploader onFile={async (f) => { setUploadingType(req.k); try { await onUpload(f, req.t, 'PERSONAL'); } finally { setUploadingType(null); } }} disabled={isUploading}>
                                        <div style={{ background: isUploading ? '#ccc' : THEME.primary, color: '#fff', padding: '6px 16px', borderRadius: 6, cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 800, display: 'inline-block' }}>{isUploading ? 'Uploading...' : doc ? 'Change' : 'Upload'}</div>
                                    </FileUploader>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EducationFormSection({ employeeId, data, isHR, onRefresh, onPreview }) {
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({ degreeName: '', institutionName: '', passingYear: '' });
    const [file, setFile] = useState(null);
    return (
        <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ fontSize: 18, fontWeight: 900, color: THEME.greyDark }}>Education Details</h3>{isHR && <button onClick={() => setShow(!show)} style={{ background: THEME.primary, color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>{show ? 'Cancel' : '+ Add'}</button>}</div>
            {show && <form style={{ background: THEME.greyLight, padding: 20, borderRadius: 16, marginBottom: 20 }} onSubmit={async (e) => { e.preventDefault(); const res = await OnboardingAPI.saveEducation(employeeId, form); if (file) await OnboardingAPI.uploadEducationDocument(res.data.id, file); setShow(false); onRefresh(); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}><input required placeholder="Degree/Class" value={form.degreeName} onChange={e => setForm({ ...form, degreeName: e.target.value })} style={{ height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12 }} /><input required placeholder="Institution" value={form.institutionName} onChange={e => setForm({ ...form, institutionName: e.target.value })} style={{ height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12 }} /><input required placeholder="Year" value={form.passingYear} onChange={e => setForm({ ...form, passingYear: e.target.value })} style={{ height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12 }} /><input type="file" required onChange={e => setFile(e.target.files[0])} style={{ fontSize: 11 }} /></div>
                <button type="submit" style={{ background: THEME.primary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>Save Record</button></form>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>{data.map(edu => (<div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderRadius: 12, border: `1px solid ${THEME.border}` }}><div><div style={{ fontWeight: 800, fontSize: 14 }}>{edu.degreeName}</div><div style={{ fontSize: 12, color: THEME.greyMain }}>{edu.institutionName} • {edu.passingYear}</div></div>{edu.documentUrl && <button onClick={() => onPreview({ documentUrl: edu.documentUrl, documentType: 'Certificate' })} style={{ color: THEME.primary, background: 'none', border: 'none', fontWeight: 800, fontSize: 12 }}>View</button>}</div>))}</div>
        </div>
    );
}

function EmploymentFormSection({ employeeId, data, isHR, onRefresh, onPreview }) {
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({ companyName: '', role: '', startDate: '', endDate: '', ctc: '' });
    const handleUp = async (file, id, type) => {
        if (file) {
            try {
                await OnboardingAPI.uploadEmploymentDoc(id, file, type);
                await onRefresh();
                alert(`${type} uploaded successfully!`);
            } catch (error) {
                console.error("Employment doc upload error:", error);
                alert("Upload failed: " + (error.response?.data?.message || error.message));
            }
        }
    };
    return (
        <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ fontSize: 18, fontWeight: 900, color: THEME.greyDark }}>Employment History</h3>{isHR && <button onClick={() => setShow(!show)} style={{ background: THEME.primary, color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>{show ? 'Cancel' : '+ Add'}</button>}</div>
            {show && <form style={{ background: THEME.greyLight, padding: 20, borderRadius: 16, marginBottom: 20 }} onSubmit={async (e) => { e.preventDefault(); await OnboardingAPI.saveEmploymentHistory(employeeId, form); setShow(false); onRefresh(); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}><input required placeholder="Company" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} style={{ height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12 }} /><input required placeholder="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12 }} /><input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12 }} /><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={{ height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12 }} /><input placeholder="CTC" value={form.ctc} onChange={e => setForm({ ...form, ctc: e.target.value })} style={{ height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 12 }} /></div>
                <button type="submit" style={{ background: THEME.primary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>Save Experience</button></form>}
            <div style={{ paddingLeft: 24, borderLeft: `3px solid ${THEME.greyLight}` }}>{data.map(item => (<div key={item.id} style={{ marginBottom: 24, background: '#fff', padding: 20, borderRadius: 16, border: `1px solid ${THEME.border}` }}><div style={{ fontWeight: 900, fontSize: 15 }}>{item.role}</div><div style={{ color: THEME.primary, fontWeight: 800, fontSize: 13 }}>{item.companyName}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginTop: 16 }}>
                {['Offer', 'Relieving', 'Experience', 'Payslip', 'Hike', 'Form16', 'Bank'].map(t => (<HistoryDocSlot key={t} label={t} url={item[t.toLowerCase() + (t === 'Payslip' ? 's' : '') + (t === 'Bank' ? 'Statement' : '') + (['Offer', 'Relieving', 'Experience'].includes(t) ? 'Letter' : '') + (t === 'Hike' ? 'Letters' : '') + 'Url'] || item[t.toLowerCase() + 'Url']} onUpload={(file) => handleUp(file, item.id, t.toLowerCase())} onPreview={onPreview} isHR={isHR} />))}
            </div></div>))}</div>
        </div>
    );
}

function HistoryDocSlot({ label, url, onUpload, onPreview, isHR }) {
    const [uploading, setUploading] = useState(false);
    return (<div style={{ padding: 8, borderRadius: 10, background: url ? THEME.primaryLight : THEME.greyLight, border: `1px solid ${url ? THEME.primary : THEME.border}`, textAlign: 'center' }}><div style={{ fontSize: 9, fontWeight: 900, color: THEME.greyMain, marginBottom: 6 }}>{label}</div>
        {url ? (<button onClick={() => onPreview({ documentUrl: url, documentType: label })} style={{ background: THEME.primary, color: '#fff', padding: '3px 8px', borderRadius: 4, border: 'none', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>View</button>) : (isHR && (
            <FileUploader onFile={async (f) => { setUploading(true); try { await onUpload(f); } finally { setUploading(false); } }} disabled={uploading}>
                <div style={{ background: uploading ? '#ccc' : '#fff', color: THEME.greyMain, padding: '3px 8px', borderRadius: 4, border: `1px solid ${THEME.border}`, fontSize: 10, fontWeight: 800, cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-block', opacity: uploading ? 0.5 : 1 }}>{uploading ? '...' : 'Add'}</div>
            </FileUploader>
        ))}
    </div>);
}

function CompanyDocsSection({ docs, isHR, onUpload, onDelete, onPreview }) {
    const [uploadingType, setUploadingType] = useState(null);

    const categories = [
        {
            name: "Employment & Joining",
            items: ['Offer Letter', 'Appointment Letter', 'Confirmation Letter']
        },
        {
            name: "Legal & Agreements",
            items: ['NDA', 'NCA', 'Onsite Agreement']
        },
        {
            name: "Career & Compensation",
            items: ['Appraisal Letter', 'Hike Letter']
        },
        {
            name: "Official Correspondence",
            items: ['NOC', 'Memo', 'Warning Letter']
        },
        {
            name: "Exit Documents",
            items: ['Relieving Letter', 'Experience Letter']
        },
        {
            name: "Company Policies",
            items: ['Policy Manual']
        }
    ];

    return (
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: THEME.greyDark, marginBottom: 16 }}>Company Documents</h3>
            <div style={{ display: 'grid', gap: 14 }}>
                {categories.map(cat => (
                    <div key={cat.name} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: 10, fontWeight: 900, color: THEME.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat.name}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                            {cat.items.map(t => {
                                const doc = docs.find(d => d.documentType === t);
                                const isUploading = uploadingType === t;
                                return (
                                    <div key={t} style={{ padding: '8px 12px', background: '#fff', borderRadius: 8, border: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                            <Building2 size={14} color={THEME.greyMain} style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: 11, fontWeight: 800, color: THEME.greyDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                                            {doc && (
                                                <button onClick={() => onPreview(doc)} style={{ color: THEME.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }} title="View">
                                                    <Eye size={14} />
                                                </button>
                                            )}
                                            {isHR && doc && (
                                                <button onClick={() => onDelete(doc.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }} title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            {isHR && (
                                                <FileUploader onFile={async (f) => { setUploadingType(t); try { await onUpload(f, t, 'COMPANY'); } finally { setUploadingType(null); } }} disabled={isUploading}>
                                                    <div style={{ color: isUploading ? '#ccc' : THEME.primary, background: 'none', border: 'none', cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', opacity: isUploading ? 0.5 : 1, padding: 2 }} title="Upload">
                                                        <Upload size={14} className={isUploading ? 'animate-spin' : ''} />
                                                    </div>
                                                </FileUploader>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EduDocSlot({ label, docType, documents, isHR, onUpload, onDelete, onPreview }) {
    const doc = documents.find(d => d.documentType === docType);
    const [uploading, setUploading] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: THEME.greyMain, textTransform: 'uppercase' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: THEME.white, padding: '6px 10px', borderRadius: 6, border: `1px solid ${THEME.border}`, minHeight: 36 }}>
                {doc ? (
                    <>
                        <button onClick={() => onPreview(doc)} style={{ padding: 1, color: THEME.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="View"><Eye size={16} /></button>
                        {isHR && (
                            <FileUploader onFile={async (f) => { setUploading(true); try { await onUpload(f, docType); } finally { setUploading(false); } }} disabled={uploading}>
                                <button style={{ padding: 1, color: THEME.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Re-upload"><RefreshCw size={16} className={uploading ? 'animate-spin' : ''} /></button>
                            </FileUploader>
                        )}
                        {isHR && <button onClick={() => onDelete(doc.id)} style={{ padding: 1, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={16} /></button>}
                    </>
                ) : (
                    isHR && (
                        <FileUploader onFile={async (f) => { setUploading(true); try { await onUpload(f, docType); } finally { setUploading(false); } }} disabled={uploading}>
                            <button style={{
                                background: 'none', border: 'none', color: THEME.primary, cursor: 'pointer',
                                fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4
                            }}>
                                <Plus size={16} /> Upload
                            </button>
                        </FileUploader>
                    )
                )}
            </div>
        </div>
    );
}

function EmergencySection({ employee, isHR, onUpdate }) {
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState({ name: employee.emergencyContactName || '', phone: employee.emergencyContactPhone || '', address: employee.emergencyContactAddress || '' });
    return (
        <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ fontSize: 18, fontWeight: 900, color: THEME.greyDark }}>Emergency Details</h3>{isHR && !edit && <button onClick={() => setEdit(true)} style={{ color: THEME.primary, fontWeight: 800, border: 'none', background: 'none', fontSize: 13 }}>Edit</button>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div><label style={{ fontSize: 11, fontWeight: 800, color: THEME.greyMain }}>CONTACT NAME</label>{edit ? <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 12 }} /> : <div style={{ fontSize: 14, fontWeight: 800, background: THEME.greyLight, padding: 12, borderRadius: 8 }}>{data.name || '-'}</div>}</div>
                <div><label style={{ fontSize: 11, fontWeight: 800, color: THEME.greyMain }}>PHONE</label>{edit ? <input value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: `1px solid ${THEME.border}`, fontSize: 12 }} /> : <div style={{ fontSize: 14, fontWeight: 800, background: THEME.greyLight, padding: 12, borderRadius: 8 }}>{data.phone || '-'}</div>}</div>
            </div>
            {edit && <div style={{ marginTop: 20, display: 'flex', gap: 10 }}><button onClick={async () => { await OnboardingAPI.updateEmergency(employee.id, data); setEdit(false); onUpdate(); }} style={{ background: THEME.primary, color: '#fff', padding: '10px 32px', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 12 }}>Save</button><button onClick={() => setEdit(false)} style={{ background: '#fff', border: `1px solid ${THEME.border}`, padding: '10px 32px', borderRadius: 10, fontSize: 12 }}>Cancel</button></div>}
        </div>
    );
}
