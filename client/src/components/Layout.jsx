import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Debug logging
  console.log('Layout rendered with user:', user);
  console.log('Current location:', location.pathname);
  
  

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
        overflow: 'hidden'
      }}>
        {/* Sidebar Header */}
        <div className="sidebar-header" style={{ 
                     padding: '3rem 2rem',
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
                             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               borderRadius: '1.5rem',
               marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'white',
              fontWeight: 'bold',
                             boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
            }}>
              NM
            </div>
            
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '800', 
              color: 'white',
                             marginBottom: '0.25rem',
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
          padding: '2rem 0',
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
                                 padding: '1.5rem 2rem',
                color: isActive(item.href) ? 'white' : 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                                 borderRight: isActive(item.href) ? '4px solid #6366f1' : '4px solid transparent',
                background: isActive(item.href) 
                  ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)' 
                  : 'transparent',
                transition: 'all 250ms ease-in-out',
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
                transition: 'transform 250ms ease-in-out',
                opacity: isActive(item.href) ? 0 : 1
              }} />
              
              <span style={{ 
                fontSize: '1.5rem', 
                                 marginRight: '1.5rem',
                filter: isActive(item.href) ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none',
                                 transition: 'filter 250ms ease-in-out'
              }}>
                {item.icon}
              </span>
              
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: isActive(item.href) ? '700' : '600',
                  fontSize: '1rem',
                  marginBottom: '0.25rem'
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
                                   background: '#6366f1',
                 borderRadius: '50%',
                 boxShadow: '0 0 12px #6366f1',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer" style={{ 
          padding: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* User Profile */}
          {user ? (
          <Link 
            to="/profile"
            style={{ 
              textDecoration: 'none',
              display: 'block',
              marginBottom: '1.5rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 250ms ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
                         onClick={() => {
                           console.log('User profile clicked!');
                           console.log('Navigating to /profile');
                           setSidebarOpen(false);
                         }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '1rem'
            }}>
                             <div style={{
                 width: '48px',
                 height: '48px',
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                 borderRadius: '50%',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 color: 'white',
                 fontWeight: 'bold',
                 fontSize: '1.1rem',
                 marginRight: '1rem'
               }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: 'white',
                  fontSize: '0.95rem',
                  marginBottom: '0.25rem'
                }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '0.25rem'
                }}>
                  {user?.email}
                </div>
                                 {user?.role && (
                   <div style={{ 
                     fontSize: '0.7rem', 
                     color: '#6366f1', 
                     textTransform: 'uppercase',
                     fontWeight: '700',
                     background: 'rgba(99, 102, 241, 0.2)',
                     padding: '0.25rem 0.5rem',
                     borderRadius: '9999px',
                     display: 'inline-block'
                   }}>
                    {user.role}
                  </div>
                )}
              </div>
              
              {/* Click indicator */}
              <div style={{
                fontSize: '1.2rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginLeft: '0.5rem'
              }}>
                👤
              </div>
            </div>
            
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Click to manage profile
            </div>
          </Link>
          ) : (
            <div style={{
              padding: '1.5rem',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              Loading user...
            </div>
          )}
          
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
               transition: 'all 250ms ease-in-out'
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
        minHeight: '100vh'
      }}>
        {/* Mobile header */}
        <div className="mobile-header" style={{
          display: 'none',
                     padding: '1.5rem',
                     borderBottom: '1px solid #e2e8f0',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-outline"
                         style={{ 
               padding: '0.5rem',
               borderRadius: '0.5rem',
               border: '1px solid #e2e8f0',
              background: 'white'
            }}
          >
            ☰
          </button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
                         gap: '0.5rem' 
          }}>
            <div style={{
              width: '32px',
              height: '32px',
                             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                             borderRadius: '0.5rem',
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
                             color: '#0f172a',
              margin: 0
            }}>
              NoteAndMore
            </h1>
          </div>
          
          <div style={{ width: '40px' }}></div>
        </div>

        {/* Page content */}
        <div className="page-content" style={{ 
                  padding: '3rem'
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
