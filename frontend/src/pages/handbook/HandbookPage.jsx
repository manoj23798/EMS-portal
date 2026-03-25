import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import HandbookSidebar from '../../components/handbook/Sidebar';
import { Search, User, Bell, LogOut } from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';
import { authService } from '../../services/authService';

export default function HandbookPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const isMainPage = location.pathname === '/handbook';

    return (
        <div style={{ 
            display: 'flex', 
            height: '100vh', 
            background: 'var(--background)',
            overflow: 'hidden'
        }}>
            {/* Column 2: Handbook Specific Sidebar (Hidden on Policy View/Create) */}
            {isMainPage && <HandbookSidebar />}
            
            {/* Column 3: Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Module-Specific "Short" Topbar */}
                <header style={{ 
                    height: '64px', 
                    borderBottom: '1px solid var(--border)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    background: 'var(--surface)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search module"
                            className="form-input"
                            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem' }}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <Bell size={18} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tokenManager.getUserData()?.username || 'admin'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tokenManager.getUserRole()}</div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={16} />
                            </div>
                            <button onClick={() => authService.logout()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Pane */}
                <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                    {isMainPage ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
                            <BookIcon size={80} style={{ opacity: 0.1, marginBottom: 20 }} />
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>Welcome</h2>
                            <p style={{ maxWidth: '400px', lineHeight: 1.6 }}>Select a policy from the sidebar to view detailed company guidelines and documentation.</p>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </div>
            </div>
        </div>
    );
}

const BookIcon = ({ size, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
);
