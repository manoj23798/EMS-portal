import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import { EmployeeAPI } from '../../services/api';

export default function EmployeeListPage() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                    <button className="btn btn-primary" onClick={() => navigate('/employees/new')}>
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
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', transition: 'color 0.2s' }} onClick={() => navigate(`/employees/${emp.id}/edit`)} title="Edit Employee">
                                                    <Edit size={18} />
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
        </div>
    );
}
