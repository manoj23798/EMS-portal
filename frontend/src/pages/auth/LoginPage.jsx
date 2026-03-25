import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await authService.login(username, password);
            navigate('/'); // Navigate to default dashboard, RoleGuard/App router will handle specific routing
        } catch (err) {
            console.error('Login Failed', err);
            if (err.response && err.response.status === 401) {
                setError('Invalid username or password.');
            } else if (err.response && err.response.status === 403) {
                 setError('Account is inactive or locked.');
            } else {
                setError('Unable to connect to server. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
            
            {/* Left side: Branding / Image */}
            <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', display: 'flex', flexDirection: 'column', padding: 60, color: 'white' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'white', color: 'var(--primary)', padding: '8px', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    EMS Portal
                </div>
                
                <div style={{ marginTop: 'auto', marginBottom: 'auto', maxWidth: 480 }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1.1, marginBottom: 24, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        Empower your workforce.
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
                        Enterprise-grade employee management system with secure authentication, precise role-based access, and seamless workflows.
                    </p>
                </div>
                
                <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                    &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
                </div>
            </div>

            {/* Right side: Login Form */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--surface)' }}>
                <div style={{ width: '100%', maxWidth: 420, padding: 40, background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
                    
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>Welcome Back</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Please sign in to your account</p>
                    </div>

                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600 }}>Username or Email</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                    <User size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Enter your username" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={{ paddingLeft: 42, height: 48 }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                    <Lock size={18} />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="form-input" 
                                    placeholder="Enter your password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingLeft: 42, paddingRight: 42, height: 48 }}
                                    required
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <a href="#" style={{ color: 'var(--primary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ height: 48, marginTop: 8, fontSize: '1rem', fontWeight: 600 }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                    
                    {/* Dev tip: can remove in prod */}
                    <div style={{ marginTop: 32, padding: 16, background: '#f8fafc', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#64748b' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>Development Access</p>
                        <p style={{ margin: '4px 0 0 0' }}>Admin Default: <strong>admin</strong> / <strong>admin123</strong></p>
                    </div>

                </div>
            </div>
            
        </div>
    );
}
