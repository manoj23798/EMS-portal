import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

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
            await authService.login(username, password);
            navigate('/');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Invalid username or password.');
            } else if (err.response && err.response.status === 403) {
                 setError('Account is inactive or locked.');
            } else {
                setError('Unable to connect to server. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            fontFamily: '"Inter", "Outfit", sans-serif',
            background: '#f0f4f8',
            position: 'relative'
        }}>
            
            <style>
                {`
                .input-field::placeholder {
                    color: #94a3b8;
                    font-weight: 500;
                }
                .login-btn {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px -5px rgba(26, 31, 54, 0.4);
                }
                .login-btn:active {
                    transform: translateY(0);
                }
                `}
            </style>

            {/* Decorative Top Left Orange Blob */}
            <div style={{
                position: 'absolute',
                top: '-50px',
                left: '-50px',
                width: '300px',
                height: '300px',
                background: '#f97316',
                borderRadius: '50%',
                zIndex: 0
            }}></div>

            {/* Decorative Bottom Right Orange Blob */}
            <div style={{
                position: 'absolute',
                bottom: '-100px',
                right: '-100px',
                width: '400px',
                height: '400px',
                background: '#f97316',
                borderRadius: '50%',
                zIndex: 0
            }}></div>

            {/* Left side: Branding / Image */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 10,
                position: 'relative',
                borderRight: '2px solid #cfd8dc'
            }}>
                
                {/* Decorative Bottom Rectangle */}
                <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '180px',
                    height: '50px',
                    background: '#f97316',
                    zIndex: 0
                }}></div>
                
                {/* Illustration and Logo within Orange Border Container */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        background: '#ffffff',
                        border: '4px solid #f97316',
                        borderRadius: '60px',
                        padding: '100px 30px',
                        minHeight: '450px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '80%',
                        maxWidth: '580px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                    }}>
                        {/* Logo and Text inside the box */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img 
                                src="/elintsys-logo.svg" 
                                alt="Elintsys" 
                                style={{ height: '110px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))', marginBottom: '10px' }} 
                            />
                            <h1 style={{ 
                                margin: 0, 
                                color: '#7a7a7a', 
                                fontSize: '3.5rem', 
                                fontWeight: '800',
                                fontFamily: 'Arial, sans-serif',
                                letterSpacing: '-0.5px'
                            }}>
                                Technologies
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Login Form */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                position: 'relative',
                zIndex: 10
            }}>
                
                {/* Clean Card */}
                <div style={{ 
                    width: '100%', 
                    maxWidth: '440px', 
                    padding: '50px 45px', 
                    background: '#ffffff', 
                    borderRadius: '24px', 
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    marginRight: '8%',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04)'
                }}>
                    
                    <div style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Welcome back</h2>
                        <p style={{ color: '#64748b', marginTop: '8px', fontSize: '0.95rem', fontWeight: 500 }}>Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '14px 16px', borderRadius: '12px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem', fontWeight: 500 }}>
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Username Field */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: '#f8fafc',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            padding: '4px'
                        }}>
                            <div style={{ color: '#94a3b8', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                                <User size={20} strokeWidth={2} />
                            </div>
                            <input 
                                className="input-field"
                                type="text" 
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{ 
                                    border: 'none', 
                                    outline: 'none', 
                                    flex: 1, 
                                    fontSize: '1rem',
                                    background: 'transparent',
                                    color: '#0f172a',
                                    padding: '16px 16px 16px 0',
                                    fontWeight: 500
                                }}
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: '#f8fafc',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            padding: '4px'
                        }}>
                            <div style={{ color: '#94a3b8', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                                <Lock size={20} strokeWidth={2} />
                            </div>
                            <input 
                                className="input-field"
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ 
                                    border: 'none', 
                                    outline: 'none', 
                                    flex: 1, 
                                    fontSize: '1rem',
                                    background: 'transparent',
                                    color: '#0f172a',
                                    padding: '16px 0',
                                    fontWeight: 500
                                }}
                                required
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 16px', display: 'flex', alignItems: 'center' }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                            <a href="#" style={{ color: '#4f46e5', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#3730a3'} onMouseOut={(e) => e.target.style.color = '#4f46e5'}>Forgot Password?</a>
                        </div>

                        <button 
                            type="submit" 
                            className="login-btn"
                            style={{ 
                                height: 56, 
                                marginTop: 12, 
                                fontSize: '1.1rem', 
                                fontWeight: 700, 
                                background: '#0f172a', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '16px',
                                cursor: 'pointer',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : (
                                <>
                                    Sign In <ArrowRight size={20} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
        </div>
    );
}

