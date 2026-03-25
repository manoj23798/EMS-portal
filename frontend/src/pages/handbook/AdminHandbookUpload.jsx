import React, { useState, useEffect } from 'react';
import { handbookService } from '../../services/handbookService';
import { ChevronLeft, Upload, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminHandbookUpload() {
    const navigate = useNavigate();
    const { id } = useParams(); // If id exists, it's edit mode
    const isEditMode = !!id;

    const [categories, setCategories] = useState([]);
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [version, setVersion] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchCategoriesAndPolicy = async () => {
            try {
                const catRes = await handbookService.getAllCategories();
                setCategories(catRes.data);

                if (isEditMode) {
                    const polRes = await handbookService.getPolicyById(id);
                    const policy = polRes.data;
                    setTitle(policy.title);
                    setCategoryId(policy.categoryId || '');
                    setDescription(policy.description || '');
                    setVersion(policy.version);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load necessary data");
            }
        };
        fetchCategoriesAndPolicy();
    }, [id, isEditMode]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate size (10MB max)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("File is too large. Maximum size is 10MB");
                return;
            }
            // Validate type
            if (!selectedFile.name.toLowerCase().endsWith('.pdf') && !selectedFile.name.toLowerCase().endsWith('.docx')) {
                setError("Only PDF and DOCX files are allowed");
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('categoryId', categoryId);
            formData.append('description', description);
            if (version) formData.append('version', version);
            
            // File is required for upload, optional for edit
            if (!isEditMode && !file) {
                setError("Please select a document to upload");
                setLoading(false);
                return;
            }
            if (file) formData.append('file', file);

            if (isEditMode) {
                await handbookService.updatePolicy(id, formData);
            } else {
                await handbookService.uploadPolicy(formData);
            }

            setSuccess(true);
            setTimeout(() => navigate('/admin/handbook'), 1500);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <button onClick={() => navigate('/admin/handbook')} className="btn btn-outline" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ChevronLeft size={16} /> Back to Policies
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>
                {isEditMode ? 'Edit Policy' : 'Upload New Policy'}
            </h2>

            <div className="card">
                {error && <div className="alert alert-danger" style={{ marginBottom: '24px' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ marginBottom: '24px' }}>Successfully {isEditMode ? 'updated' : 'uploaded'}! Redirecting...</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label className="form-label">Policy Title *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            <select
                                className="form-input"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.categoryName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description (optional)</label>
                        <textarea
                            className="form-input"
                            rows="4"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label className="form-label">{isEditMode ? 'Manual Version Override (optional)' : 'Initial Version (Default 1.0)'}</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={isEditMode ? "Leave blank to auto-increment" : "1.0"}
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Attached Document {isEditMode ? '(Optional to update)' : '*'}</label>
                            <div style={{ 
                                border: '2px dashed var(--border)', 
                                padding: '24px', 
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                                background: 'var(--bg-secondary)',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }} className="hover:border-primary">
                                <input 
                                    type="file" 
                                    id="policyFile" 
                                    style={{ display: 'none' }} 
                                    accept=".pdf,.docx"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="policyFile" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    {file ? <FileText size={32} className="text-primary" /> : <Upload size={32} className="text-muted" />}
                                    <span style={{ fontWeight: 500, color: file ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                        {file ? file.name : 'Click to browse files'}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Only PDF, DOCX (Max 10MB)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/handbook')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Upload Policy')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
