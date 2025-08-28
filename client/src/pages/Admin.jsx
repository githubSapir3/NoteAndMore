import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // TODO: Implement user fetching when backend endpoint is available
    // For now, show a placeholder
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Admin Panel</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Welcome, {user?.firstName} {user?.lastName} ({user?.role})
        </p>
      </div>

      <div className="admin-content">
        <div className="admin-section card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>User Management</h3>
          <div className="alert alert-warning">
            <strong>⚠️ TODO:</strong> User management functionality requires backend implementation.
            <br />
            <br />
            <strong>Required endpoints:</strong>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
              <li><code>GET /api/users</code> - List all users (admin only)</li>
              <li><code>PUT /api/users/:id/role</code> - Update user role</li>
              <li><code>DELETE /api/users/:id</code> - Delete user</li>
            </ul>
          </div>
        </div>

        <div className="admin-section card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>System Statistics</h3>
          <div className="stats-grid grid grid-cols-3" style={{ gap: '1rem' }}>
            <div className="stat-item" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                TODO
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Total Users
              </div>
            </div>
            
            <div className="stat-item" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                TODO
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Active Users
              </div>
            </div>
            
            <div className="stat-item" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                TODO
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Admin Users
              </div>
            </div>
          </div>
        </div>

        <div className="admin-section card">
          <h3 style={{ marginBottom: '1rem' }}>System Information</h3>
          <div className="info-grid grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="info-item">
              <strong>Current User:</strong> {user?.email}
            </div>
            <div className="info-item">
              <strong>User Role:</strong> {user?.role}
            </div>
            <div className="info-item">
              <strong>User ID:</strong> {user?.id}
            </div>
            <div className="info-item">
              <strong>Last Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
