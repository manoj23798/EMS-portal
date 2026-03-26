import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
    const location = useLocation();
    const isHandbook = location.pathname.startsWith('/handbook');
    const isReimbursement = location.pathname.startsWith('/reimbursement/apply');
    const noPadding = isHandbook || isReimbursement;

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                {!isHandbook && <Topbar />}
                <main className={`page-content ${noPadding ? 'no-padding' : ''}`} style={noPadding ? { padding: 0 } : {}}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
