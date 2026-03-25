import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Briefcase, Calendar } from 'lucide-react';
import { EmployeeAPI } from '../../services/api';

export default function EmployeeProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const { data } = await EmployeeAPI.getById(id);
            setEmployee(data);
        } catch (err) {
            console.error(err);
            alert('Failed to load employee profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (window.confirm('Are you sure you want to deactivate this employee?')) {
            try {
                await EmployeeAPI.deactivate(id);
                navigate('/employees');
            } catch (err) {
                console.error(err);
                alert('Deactivation failed');
            }
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;
    if (!employee) return <div style={{ padding: '40px', textAlign: 'center' }}>Employee Not Found</div>;

    return (
        <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => navigate('/employees')}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="card-title">Employee Profile</h2>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => navigate(`/employees/${id}/edit`)}>
                        <Edit size={16} /> Edit
                    </button>
                    <button className="btn btn-danger" onClick={handleDeactivate}>
                        <Trash2 size={16} /> Deactivate
                    </button>
                </div>
            </div>

            <div className="card-body">
                <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '32px', marginBottom: '32px' }}>
                    <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', overflow: 'hidden' }}>
                        {employee.profilePhotoUrl ? (
                            <img src={`http://localhost:8087${employee.profilePhotoUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`
                        )}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                            {employee.firstName} {employee.lastName}
                        </h1>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                            <Briefcase size={16} color="var(--text-muted)" />
                            <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                {employee.designationTitle || 'Designation Not Set'}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span style={{ color: 'var(--text-muted)' }}>{employee.departmentName || 'Department Not Set'}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <Mail size={16} /> {employee.email}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <Phone size={16} /> {employee.phoneNumber || 'N/A'}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <MapPin size={16} /> {employee.workLocation || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '16px' }}>Personal Details</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <li>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Date of Birth</div>
                                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{employee.dateOfBirth || 'Not provided'}</div>
                            </li>
                            <li>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Gender</div>
                                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{employee.gender || 'Not specified'}</div>
                            </li>
                            <li>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Address</div>
                                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{employee.address || 'Not provided'}</div>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '16px' }}>Employment Details</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <li>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Employee ID</div>
                                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{employee.employeeId}</div>
                            </li>
                            <li>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Joining Date</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 500 }}>
                                    <Calendar size={14} color="var(--text-muted)" />
                                    {employee.joiningDate}
                                </div>
                            </li>
                            <li>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Employment Type</div>
                                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{employee.employmentType}</div>
                            </li>
                            <li>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                                    <span className={`status-badge ${employee.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                                        {employee.status}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
