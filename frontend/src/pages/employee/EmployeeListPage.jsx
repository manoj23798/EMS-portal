import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Eye, Save, Upload, X } from 'lucide-react';
import { DepartmentAPI, DesignationAPI, DocumentAPI, EmployeeAPI } from '../../services/api';

export default function EmployeeListPage() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const { data } = await EmployeeAPI.getAll();
            setEmployees(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.departmentName && emp.departmentName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ padding: '24px' }}>
            <div className="card">
            <div className="card-header">
                <h2 className="card-title">Employees Directory</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="form-input"
                            style={{ paddingLeft: 36 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> Add Employee
                    </button>
                </div>
            </div>
            <div className="card-body">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading directory...</div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Designation</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map(emp => (
                                    <tr key={emp.id}>
                                        <td style={{ fontWeight: 500 }}>{emp.employeeId}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(67, 97, 238, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{emp.firstName} {emp.lastName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{emp.departmentName || 'Not Assigned'}</td>
                                        <td>{emp.designationTitle || 'N/A'}</td>
                                        <td>
                                            <span className={`status-badge ${emp.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', transition: 'color 0.2s' }} onClick={() => navigate(`/employees/${emp.id}`)} title="View Profile">
                                                    <Eye size={18} className="hover:text-primary" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            No employees match your criteria. Add a new employee to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Employee Modal */}
            {showCreateModal && (
                <CreateEmployeeModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchEmployees();
                    }}
                />
            )}
            </div>
        </div>
    );
}

/* ─── Premium Create Employee Modal ─── */
function CreateEmployeeModal({ onClose, onSuccess }) {
    const [saving, setSaving] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [photoFile, setPhotoFile] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phoneNumber: '',
        dateOfBirth: '', gender: '', joiningDate: '',
        employmentType: 'Full-Time', workLocation: '', departmentId: '', designationId: ''
    });

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [deptRes, desigRes] = await Promise.all([
                    DepartmentAPI.getAll(),
                    DesignationAPI.getAll()
                ]);
                setDepartments(deptRes.data);
                setDesignations(desigRes.data);
            } catch (err) {
                console.error("Failed to fetch master data", err);
            }
        };
        fetchMasterData();
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData };
            Object.keys(payload).forEach(key => {
                if (payload[key] === '') delete payload[key];
            });

            const { data: createdEmployee } = await EmployeeAPI.create(payload);

            if (photoFile) {
                await DocumentAPI.upload(createdEmployee.id, photoFile, 'PROFILE_PHOTO');
            }

            onSuccess();
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || err.response?.data || 'Error creating employee.';
            alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        } finally {
            setSaving(false);
        }
    };

    const overlayStyle = {
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease'
    };

    const modalStyle = {
        background: '#fff', borderRadius: 20, width: '95%', maxWidth: 880,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.18)', animation: 'slideUp 0.25s ease',
        overflow: 'hidden'
    };

    const headerStyle = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 28px', borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)'
    };

    const sectionTitle = {
        fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)',
        marginBottom: 14, paddingBottom: 8,
        borderBottom: '2px solid rgba(67, 97, 238, 0.15)', letterSpacing: 0.3
    };

    const inputStyle = {
        width: '100%', height: 40, padding: '0 12px', borderRadius: 10,
        border: '1px solid #e2e8f0', fontSize: 13, background: '#fff',
        outline: 'none', transition: 'border 0.2s', fontWeight: 500, color: '#1e293b'
    };

    const labelStyle = {
        display: 'block', fontSize: 11, fontWeight: 700,
        color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4
    };

    return (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
            <div style={modalStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1e293b' }}>Create New Employee</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>Fill in the details below to add a new team member</p>
                    </div>
                    <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                        <X size={18} color="#64748b" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

                    {/* Photo Upload */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: 16, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', overflow: 'hidden', flexShrink: 0 }}>
                            {photoFile ? (
                                <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Upload size={22} color="#94a3b8" />
                            )}
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Profile Photo</h4>
                            <p style={{ margin: '2px 0 8px', fontSize: 11, color: '#94a3b8' }}>JPG, PNG or GIF. Max 800KB</p>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                <Upload size={14} /> Upload
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                            </label>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <h3 style={sectionTitle}>Personal Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
                        <div><label style={labelStyle}>First Name *</label><input type="text" name="firstName" required style={inputStyle} onChange={handleChange} /></div>
                        <div><label style={labelStyle}>Last Name *</label><input type="text" name="lastName" required style={inputStyle} onChange={handleChange} /></div>
                        <div><label style={labelStyle}>Email Address</label><input type="email" name="email" style={inputStyle} onChange={handleChange} /></div>
                        <div><label style={labelStyle}>Phone Number</label><input type="text" name="phoneNumber" style={inputStyle} onChange={handleChange} /></div>
                        <div><label style={labelStyle}>Date of Birth</label><input type="date" name="dateOfBirth" style={inputStyle} onChange={handleChange} /></div>
                        <div>
                            <label style={labelStyle}>Gender</label>
                            <select name="gender" style={inputStyle} onChange={handleChange}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Employment Details */}
                    <h3 style={sectionTitle}>Employment Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
                        <div><label style={labelStyle}>Joining Date</label><input type="date" name="joiningDate" style={inputStyle} onChange={handleChange} /></div>
                        <div>
                            <label style={labelStyle}>Department</label>
                            <select name="departmentId" style={inputStyle} onChange={handleChange} value={formData.departmentId}>
                                <option value="">Select Department</option>
                                {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Designation</label>
                            <select name="designationId" style={inputStyle} onChange={handleChange} value={formData.designationId}>
                                <option value="">Select Designation</option>
                                {designations.filter(d => !formData.departmentId || d.departmentId.toString() === formData.departmentId.toString()).map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Employment Type</label>
                            <select name="employmentType" style={inputStyle} onChange={handleChange} value={formData.employmentType}>
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </div>
                        <div><label style={labelStyle}>Work Location</label><input type="text" name="workLocation" style={inputStyle} onChange={handleChange} /></div>
                    </div>


                    {/* Footer Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                        <button type="button" onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 13, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(67, 97, 238, 0.3)' }}>
                            <Save size={16} /> {saving ? 'Creating...' : 'Create Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
