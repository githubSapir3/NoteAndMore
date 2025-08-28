import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/tasks/stats/summary');
        setStats(response.stats);
      } catch (err) {
        setError(err.message || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 'var(--spacing-lg)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid var(--border-color)',
          borderTop: '4px solid var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ 
          fontSize: '1.2rem', 
          color: 'var(--text-secondary)',
          fontWeight: '600'
        }}>
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ 
        maxWidth: '600px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)' }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <span style={{ fontWeight: '600' }}>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      {/* Hero Section */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 'var(--spacing-3xl)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'pulse 4s ease-in-out infinite'
        }} />
        
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: '800',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 'var(--spacing-md)',
          letterSpacing: '-0.03em',
          position: 'relative',
          zIndex: 1
        }}>
          Welcome Back!
        </h1>
        
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '1.25rem',
          fontWeight: '500',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6',
          position: 'relative',
          zIndex: 1
        }}>
          Here's what's happening with your tasks and productivity today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid grid grid-cols-4" style={{ 
        marginBottom: 'var(--spacing-3xl)',
        gap: 'var(--spacing-xl)'
      }}>
        <div className="stat-card card interactive" style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '800',
              marginBottom: 'var(--spacing-sm)',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}>
              {stats?.total || 0}
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '1rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Total Tasks
            </div>
          </div>
        </div>
        
        <div className="stat-card card interactive" style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '800',
              marginBottom: 'var(--spacing-sm)',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}>
              {stats?.completed || 0}
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '1rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Completed
            </div>
          </div>
        </div>
        
        <div className="stat-card card interactive" style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: 'white',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '800',
              marginBottom: 'var(--spacing-sm)',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}>
              {stats?.pending || 0}
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '1rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Pending
            </div>
          </div>
        </div>
        
        <div className="stat-card card interactive" style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
          color: 'white',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '800',
              marginBottom: 'var(--spacing-sm)',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}>
              {stats?.overdue || 0}
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '1rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Overdue
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions grid grid-cols-2" style={{ 
        gap: 'var(--spacing-xl)', 
        marginBottom: 'var(--spacing-3xl)'
      }}>
        <Link to="/tasks" className="quick-action-card card interactive" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xl)',
          padding: 'var(--spacing-2xl)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'var(--gradient-primary)',
            opacity: 0,
            transition: 'opacity var(--transition-normal)'
          }} />
          
          <div style={{ 
            fontSize: '3rem',
            filter: 'drop-shadow(0 4px 8px rgba(99, 102, 241, 0.2))'
          }}>
            ✅
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              marginBottom: 'var(--spacing-sm)',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              Manage Tasks
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1rem',
              lineHeight: '1.6',
              margin: 0
            }}>
              Create, edit, and organize your tasks with powerful filtering and search capabilities
            </p>
          </div>
          
          <div style={{
            fontSize: '1.5rem',
            color: 'var(--primary-color)',
            transition: 'transform var(--transition-normal)'
          }}>
            →
          </div>
        </Link>
        
        <Link to="/events" className="quick-action-card card interactive" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xl)',
          padding: 'var(--spacing-2xl)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'var(--gradient-warning)',
            opacity: 0,
            transition: 'opacity var(--transition-normal)'
          }} />
          
          <div style={{ 
            fontSize: '3rem',
            filter: 'drop-shadow(0 4px 8px rgba(245, 158, 11, 0.2))'
          }}>
            📅
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              marginBottom: 'var(--spacing-sm)',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              Calendar Events
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1rem',
              lineHeight: '1.6',
              margin: 0
            }}>
              Schedule and manage your events with a beautiful calendar interface
            </p>
          </div>
          
          <div style={{
            fontSize: '1.5rem',
            color: 'var(--warning-color)',
            transition: 'transform var(--transition-normal)'
          }}>
            →
          </div>
        </Link>
        
        <Link to="/contacts" className="quick-action-card card interactive" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xl)',
          padding: 'var(--spacing-2xl)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'var(--gradient-success)',
            opacity: 0,
            transition: 'opacity var(--transition-normal)'
          }} />
          
          <div style={{ 
            fontSize: '3rem',
            filter: 'drop-shadow(0 4px 8px rgba(16, 185, 129, 0.2))'
          }}>
            👥
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              marginBottom: 'var(--spacing-sm)',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              Contacts
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1rem',
              lineHeight: '1.6',
              margin: 0
            }}>
              Manage your contacts and relationships with detailed profiles and notes
            </p>
          </div>
          
          <div style={{
            fontSize: '1.5rem',
            color: 'var(--success-color)',
            transition: 'transform var(--transition-normal)'
          }}>
            →
          </div>
        </Link>
        
        <Link to="/shopping" className="quick-action-card card interactive" style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xl)',
          padding: 'var(--spacing-2xl)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            opacity: 0,
            transition: 'opacity var(--transition-normal)'
          }} />
          
          <div style={{ 
            fontSize: '3rem',
            filter: 'drop-shadow(0 4px 8px rgba(139, 92, 246, 0.2))'
          }}>
            🛒
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              marginBottom: 'var(--spacing-sm)',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              Shopping Lists
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1rem',
              lineHeight: '1.6',
              margin: 0
            }}>
              Create and manage shopping lists with categories and checkboxes
            </p>
          </div>
          
          <div style={{
            fontSize: '1.5rem',
            color: '#8b5cf6',
            transition: 'transform var(--transition-normal)'
          }}>
            →
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity card" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div className="card-header">
          <h3 style={{ 
            marginBottom: 'var(--spacing-sm)',
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--text-primary)'
          }}>
            Recent Activity
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            margin: 0
          }}>
            Your latest actions and updates
          </p>
        </div>
        
        <div className="activity-list">
          <div className="activity-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-lg)',
            padding: 'var(--spacing-lg) 0',
            borderBottom: '1px solid var(--border-light)',
            transition: 'all var(--transition-normal)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'var(--gradient-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'white',
              boxShadow: 'var(--shadow-md)'
            }}>
              🎯
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: '600',
                fontSize: '1.1rem',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Welcome to NoteAndMore!
              </div>
              <div style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                Get started by creating your first task and exploring the dashboard features
              </div>
            </div>
            
            <div style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.875rem',
              fontWeight: '500',
              background: 'rgba(99, 102, 241, 0.1)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-full)'
            }}>
              Just now
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
