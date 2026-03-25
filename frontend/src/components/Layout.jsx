import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
    const location = useLocation();
    const isHandbook = location.pathname.startsWith('/handbook');

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                {!isHandbook && <Topbar />}
                <main className={`page-content ${isHandbook ? 'no-padding' : ''}`} style={isHandbook ? { padding: 0 } : {}}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
