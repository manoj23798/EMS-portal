import React, { useState, useEffect, useMemo } from 'react';
import { handbookService } from '../../services/handbookService';
import { BookOpen, Search, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HandbookList() {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [polRes, catRes] = await Promise.all([
                    handbookService.getAllPolicies(),
                    handbookService.getAllCategories()
                ]);
                setPolicies(polRes.data);
                setCategories(catRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredPolicies = useMemo(() => {
        return policies.filter(policy => {
            const matchesCat = selectedCategory === 'ALL' || policy.categoryId === Number(selectedCategory);
            const matchesSearch = policy.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (policy.description && policy.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCat && matchesSearch;
        });
    }, [policies, selectedCategory, searchQuery]);

    const handleDownload = (url) => {
        // Build absolute URL for the download
        window.open(`http://localhost:8087${url}`, '_blank');
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ 
                    width: '64px', height: '64px', background: 'var(--primary-light)', 
                    color: 'var(--primary)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px auto', boxShadow: 'var(--shadow-sm)'
                }}>
                    <BookOpen size={32} />
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Employee Handbook
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Access the latest company policies, procedures, and HR documents securely.
                </p>
            </div>

            <div className="card" style={{ padding: '16px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search for policies..." 
                        className="form-input" 
                        style={{ paddingLeft: '40px', width: '100%' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ flex: '0 0 250px' }}>
                    <select 
                        className="form-input" 
                        style={{ width: '100%' }}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="ALL">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.categoryName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading documents...</div>
            ) : filteredPolicies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
                    <FileText size={48} color="var(--border)" style={{ margin: '0 auto 16px auto' }} />
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>No Policies Found</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or category filters.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {filteredPolicies.map(policy => (
                        <div 
                            key={policy.id} 
                            className="card hover-effect" 
                            style={{ 
                                padding: '24px',
                                display: 'flex', flexDirection: 'column', height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer'
                            }}
                            onClick={() => navigate(`/handbook/${policy.id}`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <span style={{ 
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                }}>
                                    {policy.categoryName}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>v{policy.version}</span>
                            </div>
                            
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.4 }}>
                                {policy.title}
                            </h3>
                            
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {policy.description || 'No description provided.'}
                            </p>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Updated: {new Date(policy.updatedAt).toLocaleDateString()}
                                </span>
                                <button 
                                    className="btn btn-outline" 
                                    style={{ padding: '6px' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(policy.documentUrl);
                                    }}
                                    title="Download PDF/DOCX"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
