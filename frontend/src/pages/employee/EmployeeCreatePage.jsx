import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import { DepartmentAPI, DesignationAPI, DocumentAPI, EmployeeAPI } from '../../services/api';

export default function EmployeeCreatePage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [photoFile, setPhotoFile] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phoneNumber: '',
        dateOfBirth: '', gender: '', address: '', joiningDate: '',
        employmentType: 'Full-Time', emergencyContactName: '',
        emergencyContactPhone: '', workLocation: '', departmentId: '', designationId: '',
        aadhaar: '', pan: '', username: '', password: '', role: ''
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
                if (payload[key] === '') {
                    delete payload[key];
                }
            });

            const { data: createdEmployee } = await EmployeeAPI.create(payload);

            if (photoFile) {
                await DocumentAPI.upload(createdEmployee.id, photoFile, 'PROFILE_PHOTO');
            }

            navigate('/employees');
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || err.response?.data || 'Error creating employee. Check the console for details.';
            alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => navigate('/employees')}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="card-title">Add New Employee</h2>
                </div>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>

                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--sidebar-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', overflow: 'hidden' }}>
                            {photoFile ? (
                                <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Upload size={24} color="var(--text-muted)" />
                            )}
                        </div>
                        <div>
                            <h4 style={{ marginBottom: '4px', color: 'var(--text-main)' }}>Profile Photo</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>JPG, GIF or PNG. Max size of 800K</p>
                            <label className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                Upload Photo
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                            </label>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Personal Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">First Name *</label>
                            <input type="text" name="firstName" className="form-input" required onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name *</label>
                            <input type="text" name="lastName" className="form-input" required onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address *</label>
                            <input type="email" name="email" className="form-input" required onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="text" name="phoneNumber" className="form-input" onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input type="date" name="dateOfBirth" className="form-input" onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select name="gender" className="form-select" onChange={handleChange}>
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
                            <input type="date" name="joiningDate" className="form-input" required onChange={handleChange} />
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
                            <input type="text" name="workLocation" className="form-input" onChange={handleChange} />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: '32px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Emergency Contact</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Contact Name</label>
                            <input type="text" name="emergencyContactName" className="form-input" onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Phone</label>
                            <input type="text" name="emergencyContactPhone" className="form-input" onChange={handleChange} />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: '32px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Government Details</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Aadhaar Number</label>
                            <input type="text" name="aadhaar" className="form-input" pattern="\d{12}" title="Must be exactly 12 digits" onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">PAN Number</label>
                            <input type="text" name="pan" className="form-input" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" title="Format: ABCDE1234F" style={{ textTransform: 'uppercase' }} onChange={handleChange} />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: '32px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Account Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Role *</label>
                            <select name="role" className="form-select" required onChange={handleChange} value={formData.role}>
                                <option value="">Select Role</option>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="HR">HR</option>
                                <option value="ADMIN">Admin</option>
                                <option value="PROJECT_MANAGER">Project Manager</option>
                                <option value="IT_MANAGER">IT Manager</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input type="text" name="username" className="form-input" onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" name="password" className="form-input" onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/employees')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            <Save size={18} /> {saving ? 'Saving...' : 'Save Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
