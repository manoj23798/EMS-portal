import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import { DepartmentAPI, DesignationAPI, DocumentAPI, EmployeeAPI } from '../services/api';

export default function EmployeeEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [photoFile, setPhotoFile] = useState(null);
    const [employeeData, setEmployeeData] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phoneNumber: '',
        dateOfBirth: '', gender: '', address: '', joiningDate: '',
        employmentType: 'Full-Time', emergencyContactName: '',
        emergencyContactPhone: '', workLocation: '', departmentId: '', designationId: '',
        aadhaar: '', pan: '', username: '', password: '', role: ''
    });

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const [empRes, deptRes, desigRes] = await Promise.all([
                EmployeeAPI.getById(id),
                DepartmentAPI.getAll(),
                DesignationAPI.getAll()
            ]);
            const data = empRes.data;
            setEmployeeData(data);
            setDepartments(deptRes.data);
            setDesignations(desigRes.data);

            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                dateOfBirth: data.dateOfBirth || '',
                gender: data.gender || '',
                address: data.address || '',
                joiningDate: data.joiningDate || '',
                employmentType: data.employmentType || 'Full-Time',
                emergencyContactName: data.emergencyContactName || '',
                emergencyContactPhone: data.emergencyContactPhone || '',
                workLocation: data.workLocation || '',
                departmentId: data.departmentId || '', // Need to ensure getById returns departmentId, wait it only returns departmentName right now. Oh wait, my backend EmployeeResponse returns departmentName but NOT departmentId.
                // Let's assume the user has to re-select if we don't have departmentId in EmployeeResponse, or we could update EmployeeResponse.
                // For now, I'll update the backend to also return departmentId and designationId.
                aadhaar: data.aadhaar || '',
                pan: data.pan || '',
                username: data.username || '',
                role: data.role || ''
                // We typically don't pre-fill password for editing
            });
        } catch (err) {
            console.error(err);
            alert('Failed to load employee details');
            navigate('/employees');
        } finally {
            setLoading(false);
        }
    };

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
            if (!payload.departmentId) delete payload.departmentId;
            if (!payload.designationId) delete payload.designationId;

            await EmployeeAPI.update(id, payload);
            if (photoFile) {
                await DocumentAPI.upload(id, photoFile, 'PROFILE_PHOTO');
            }
            navigate(`/employees/${id}`);
        } catch (err) {
            console.error(err);
            alert('Error updating employee. Check the console for details.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Employee Form...</div>;

    return (
        <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => navigate(`/employees/${id}`)}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="card-title">Edit Employee</h2>
                </div>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>

                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--sidebar-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', overflow: 'hidden' }}>
                            {photoFile ? (
                                <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : employeeData?.profilePhotoUrl ? (
                                <img src={`http://localhost:8087${employeeData.profilePhotoUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Upload size={24} color="var(--text-muted)" />
                            )}
                        </div>
                        <div>
                            <h4 style={{ marginBottom: '4px', color: 'var(--text-main)' }}>Profile Photo</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>JPG, GIF or PNG. Max size of 800K</p>
                            <label className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                Change Photo
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                            </label>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Personal Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">First Name *</label>
                            <input type="text" name="firstName" className="form-input" required value={formData.firstName} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name *</label>
                            <input type="text" name="lastName" className="form-input" required value={formData.lastName} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address *</label>
                            <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="text" name="phoneNumber" className="form-input" value={formData.phoneNumber} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input type="date" name="dateOfBirth" className="form-input" value={formData.dateOfBirth} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: '32px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Employment Details</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Joining Date *</label>
                            <input type="date" name="joiningDate" className="form-input" required value={formData.joiningDate} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <select name="departmentId" className="form-select" onChange={handleChange} value={formData.departmentId}>
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Designation</label>
                            <select name="designationId" className="form-select" onChange={handleChange} value={formData.designationId}>
                                <option value="">Select Designation</option>
                                {designations
                                    .filter(d => !formData.departmentId || d.departmentId.toString() === formData.departmentId.toString())
                                    .map(d => (
                                        <option key={d.id} value={d.id}>{d.title}</option>
                                    ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Employment Type</label>
                            <select name="employmentType" className="form-select" onChange={handleChange} value={formData.employmentType}>
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Work Location</label>
                            <input type="text" name="workLocation" className="form-input" value={formData.workLocation} onChange={handleChange} />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: '32px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Emergency Contact</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Contact Name</label>
                            <input type="text" name="emergencyContactName" className="form-input" value={formData.emergencyContactName} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Phone</label>
                            <input type="text" name="emergencyContactPhone" className="form-input" value={formData.emergencyContactPhone} onChange={handleChange} />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: '32px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Government Details</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Aadhaar Number</label>
                            <input type="text" name="aadhaar" className="form-input" pattern="\d{12}" title="Must be exactly 12 digits" value={formData.aadhaar} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">PAN Number</label>
                            <input type="text" name="pan" className="form-input" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" title="Format: ABCDE1234F" style={{ textTransform: 'uppercase' }} value={formData.pan} onChange={handleChange} />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: '32px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Account Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Role *</label>
                            <select name="role" className="form-select" required onChange={handleChange} value={formData.role}>
                                <option value="">Select Role</option>
                                <option value="Employee">Employee</option>
                                <option value="HR">HR</option>
                                <option value="Admin">Admin</option>
                                <option value="PM">Project Manager</option>
                                <option value="IT Manager">IT Manager</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input type="text" name="username" className="form-input" value={formData.username} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password (Leave blank to keep current)</label>
                            <input type="password" name="password" className="form-input" onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(`/employees/${id}`)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            <Save size={18} /> {saving ? 'Updating...' : 'Update Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
