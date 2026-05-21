import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    FileText, 
    BarChart2, 
    ClipboardList, 
    Settings,
    Menu,
    X
} from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';

export default function PerformanceLayout() {
    const role = tokenManager.getUserRole();
    const isMobile = window.innerWidth <= 768;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9', overflow: 'hidden' }}>
            {/* Main Content Only - Sidebar is now handled by main Sidebar hover */}
            {/* Header removed as per user request */}

            <main style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px' }}>
                <div style={{ paddingTop: 20 }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
