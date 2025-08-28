import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊', description: 'Overview & Analytics' },
    { name: 'Tasks', href: '/tasks', icon: '✅', description: 'Manage Your Tasks' },
    { name: 'Events', href: '/events', icon: '📅', description: 'Calendar & Events' },
    { name: 'Contacts', href: '/contacts', icon: '👥', description: 'People & Relationships' },
    { name: 'Shopping', href: '/shopping', icon: '🛒', description: 'Shopping Lists' },
    { name: 'Categories', href: '/categories', icon: '🏷️', description: 'Organize Content' },
    { name: 'Profile', href: '/profile', icon: '👤', description: 'Account Settings' },
    ...(isAdmin() ? [{ name: 'Admin', href: '/admin', icon: '⚙️', description: 'System Management' }] : []),
  ];

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="layout" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '320px',
        background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform var(--transition-normal)',
        overflow: 'hidden',
        '@media (min-width: 768px)': {
          transform: 'translateX(0)',
        }
      }}>
        {/* Sidebar Header */}
        <div className="sidebar-header" style={{ 
          padding: 'var(--spacing-2xl) var(--spacing-xl)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
            animation: 'pulse 8s ease-in-out infinite'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'var(--gradient-primary)',
              borderRadius: 'var(--radius-xl)',
              marginBottom: 'var(--spacing-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: 'var(--shadow-lg)'
            }}>
              NM
            </div>
            
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '800', 
              color: 'white',
              marginBottom: 'var(--spacing-xs)',
              letterSpacing: '-0.02em'
            }}>
              NoteAndMore
            </h1>
            
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500'
            }}>
              Professional Task Management
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ 
          padding: 'var(--spacing-xl) 0',
          flex: 1,
          overflowY: 'auto'
        }}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-item ${isActive(item.href) ? 'nav-item-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--spacing-lg) var(--spacing-xl)',
                color: isActive(item.href) ? 'white' : 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                borderRight: isActive(item.href) ? '4px solid var(--primary-color)' : '4px solid transparent',
                background: isActive(item.href) 
                  ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)' 
                  : 'transparent',
                transition: 'all var(--transition-normal)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Hover effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)',
                transform: 'translateX(-100%)',
                transition: 'transform var(--transition-normal)',
                opacity: isActive(item.href) ? 0 : 1
              }} />
              
              <span style={{ 
                fontSize: '1.5rem', 
                marginRight: 'var(--spacing-lg)',
                filter: isActive(item.href) ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none',
                transition: 'filter var(--transition-normal)'
              }}>
                {item.icon}
              </span>
              
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: isActive(item.href) ? '700' : '600',
                  fontSize: '1rem',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  {item.name}
                </div>
                <div style={{ 
                  fontSize: '0.75rem',
                  color: isActive(item.href) ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '400'
                }}>
                  {item.description}
                </div>
              </div>
              
              {isActive(item.href) && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary-color)',
                  borderRadius: '50%',
                  boxShadow: '0 0 12px var(--primary-color)',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer" style={{ 
          padding: 'var(--spacing-xl)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* User Profile */}
          <div style={{ 
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-lg)',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
                         <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               marginBottom: 'var(--spacing-md)'
             }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--gradient-primary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                marginRight: 'var(--spacing-md)'
              }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: 'white',
                  fontSize: '0.95rem',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  {user?.email}
                </div>
                {user?.role && (
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--primary-color)', 
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    background: 'rgba(99, 102, 241, 0.2)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-block'
                  }}>
                    {user.role}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ 
              width: '100%',
              height: '48px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontWeight: '600',
              fontSize: '0.9rem',
              transition: 'all var(--transition-normal)'
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content" style={{ 
        flex: 1,
        marginLeft: '320px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh',
        '@media (max-width: 768px)': {
          marginLeft: '0',
        }
      }}>
        {/* Mobile header */}
        <div className="mobile-header" style={{
          display: 'none',
          padding: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          '@media (max-width: 768px)': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-outline"
            style={{ 
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-color)',
              background: 'white'
            }}
          >
            ☰
          </button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)' 
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--gradient-primary)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}>
              NM
            </div>
            <h1 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: 0
            }}>
              NoteAndMore
            </h1>
          </div>
          
          <div style={{ width: '40px' }}></div>
        </div>

        {/* Page content */}
        <div className="page-content" style={{ 
          padding: 'var(--spacing-2xl)',
          '@media (max-width: 768px)': {
            padding: 'var(--spacing-lg)'
          }
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
