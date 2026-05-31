import React from 'react';
import { Outlet } from 'react-router-dom';
import { 
    LayoutDashboard, 
    FileText, 
    BarChart2, 
    ClipboardList, 
    Settings,
    Menu,
    X
} from 'lucide-react';
export default function PerformanceLayout() {

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
