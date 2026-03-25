import React from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager } from '../utils/tokenManager';

export default function RoleGuard({ allowedRoles, children }) {
    const userRole = tokenManager.getUserRole();

    // Specific logic mapping back to Spring Security rules:
    // HR APIs allow 'HR' and 'ADMIN'.
    if (allowedRoles.includes(userRole)) {
        return children;
    }

    // Unauthenticated or unauthorized
    if (!userRole) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div style={{ padding: 40, textAlign: 'center', marginTop: 100 }}>
            <h1 style={{ color: 'var(--danger)', fontSize: '2rem' }}>403 - Access Denied</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 10 }}>You do not have permission to view this page.</p>
        </div>
    );
}
