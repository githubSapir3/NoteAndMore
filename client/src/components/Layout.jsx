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
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
                 {/* User Panel */}
         <div className="user-panel" style={{ 
           padding: '2.5rem 1.5rem',
           borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
           background: 'rgba(255, 255, 255, 0.05)',
           backdropFilter: 'blur(10px)',
           minHeight: '140px',
           maxHeight: '160px'
         }}>
          {user ? (
                         <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
               {/* User Avatar */}
               <div style={{
                 width: '64px',
                 height: '64px',
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                 borderRadius: '50%',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 color: 'white',
                 fontWeight: 'bold',
                 fontSize: '1.5rem',
                 flexShrink: 0,
                 boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
               }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              
              {/* User Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                                 <div style={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: '0.75rem',
                   marginBottom: '0.75rem'
                 }}>
                   <div style={{ 
                     fontWeight: '700', 
                     color: 'white',
                     fontSize: '1.25rem',
                     whiteSpace: 'nowrap',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis'
                   }}>
                     {user?.firstName} {user?.lastName}
                   </div>
                   {user?.role && (
                     <div style={{ 
                       fontSize: '0.75rem', 
                       color: '#6366f1', 
                       textTransform: 'uppercase',
                       fontWeight: '700',
                       background: 'rgba(99, 102, 241, 0.2)',
                       padding: '0.3rem 0.6rem',
                       borderRadius: '9999px',
                       flexShrink: 0,
                       border: '1px solid rgba(99, 102, 241, 0.3)'
                     }}>
                       {user.role}
                     </div>
                   )}
                 </div>
                 
                 <div style={{ 
                   fontSize: '0.9rem', 
                   color: 'rgba(255, 255, 255, 0.8)',
                   marginBottom: '1rem',
                   whiteSpace: 'nowrap',
                   overflow: 'hidden',
                   textOverflow: 'ellipsis',
                   fontWeight: '500'
                 }}>
                   {user?.email}
                 </div>
                
                                 {/* Manage Profile Link */}
                 <Link 
                   to="/profile"
                   style={{ 
                     fontSize: '0.8rem',
                     color: 'rgba(99, 102, 241, 0.9)',
                     textDecoration: 'none',
                     fontWeight: '600',
                     transition: 'all 200ms ease-in-out',
                     cursor: 'pointer',
                     display: 'inline-flex',
                     alignItems: 'center',
                     gap: '0.25rem',
                     padding: '0.5rem 0.75rem',
                     background: 'rgba(99, 102, 241, 0.1)',
                     borderRadius: '0.5rem',
                     border: '1px solid rgba(99, 102, 241, 0.2)'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.color = 'rgba(99, 102, 241, 1)';
                     e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                     e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                     e.currentTarget.style.transform = 'translateX(2px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.color = 'rgba(99, 102, 241, 0.9)';
                     e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                     e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                     e.currentTarget.style.transform = 'translateX(0)';
                   }}
                   onClick={() => setSidebarOpen(false)}
                 >
                   Manage profile →
                 </Link>
              </div>
            </div>
          ) : (
                         <div style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               height: '64px',
               color: 'rgba(255, 255, 255, 0.7)',
               fontSize: '0.875rem'
             }}>
               Loading user...
             </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ 
          padding: '1.5rem 0',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
          scrollBehavior: 'smooth'
        }}>
          {/* Custom scrollbar styling for webkit browsers */}
          <style>
            {`
              .sidebar-nav::-webkit-scrollbar {
                width: 6px;
              }
              .sidebar-nav::-webkit-scrollbar-track {
                background: transparent;
              }
              .sidebar-nav::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
              }
              .sidebar-nav::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
              }
            `}
          </style>
          
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-item ${isActive(item.href) ? 'nav-item-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                color: isActive(item.href) ? 'white' : 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                borderRight: isActive(item.href) ? '4px solid #6366f1' : '4px solid transparent',
                background: isActive(item.href) 
                  ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)' 
                  : 'transparent',
                transition: 'all 250ms ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '64px'
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
                fontSize: '1.25rem', 
                marginRight: '1rem',
                filter: isActive(item.href) ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none',
                transition: 'filter 250ms ease-in-out',
                flexShrink: 0
              }}>
                {item.icon}
              </span>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: isActive(item.href) ? '700' : '600',
                  fontSize: '0.9rem',
                  marginBottom: '0.2rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.name}
                </div>
                <div style={{ 
                  fontSize: '0.7rem',
                  color: isActive(item.href) ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '400',
                  lineHeight: '1.3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {item.description}
                </div>
              </div>
              
              {isActive(item.href) && (
                <div style={{
                  width: '6px',
                  height: '6px',
                  background: '#6366f1',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px #6366f1',
                  animation: 'pulse 2s ease-in-out infinite',
                  flexShrink: 0,
                  marginLeft: '0.5rem'
                }} />
              )}
            </Link>
          ))}
        </nav>

                 {/* Sign Out Button */}
         <div className="sidebar-footer" style={{ 
           padding: '0.75rem 1.5rem',
           borderTop: '1px solid rgba(255, 255, 255, 0.1)',
           background: 'rgba(0, 0, 0, 0.2)',
           backdropFilter: 'blur(10px)',
           flexShrink: 0
         }}>
           <button
             onClick={handleLogout}
             className="btn btn-outline"
             style={{ 
               width: '100%',
               height: '36px',
               background: 'rgba(239, 68, 68, 0.1)',
               border: '1px solid rgba(239, 68, 68, 0.3)',
               color: '#fca5a5',
               fontWeight: '600',
               fontSize: '0.875rem',
               borderRadius: '0.5rem',
               transition: 'all 250ms ease-in-out',
               cursor: 'pointer'
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
               e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
               e.currentTarget.style.transform = 'translateY(-1px)';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
               e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
               e.currentTarget.style.transform = 'translateY(0)';
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
