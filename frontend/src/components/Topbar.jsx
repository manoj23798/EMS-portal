import { User, Bell, Search } from 'lucide-react';

export default function Topbar() {
    return (
        <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search module..."
                    className="form-input"
                    style={{ border: 'none', background: 'transparent', width: '250px' }}
                />
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', color: 'var(--text-main)' }}>
                <Bell size={20} style={{ cursor: 'pointer', transition: 'var(--transition)' }} className="hover-effect" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <div style={{
                        width: 36, height: 36,
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <User size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>HR Admin</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Human Resources</div>
                    </div>
                </div>
            </div>
        </header>
    );
}
