import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';

const Profile = () => {
  const { user, updateProfile, updatePreferences, changePassword, deactivateAccount } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: ''
  });
  
  // Preferences form data
  const [preferencesData, setPreferencesData] = useState({
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      reminders: true
    }
  });
  
  // Password change form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Account deactivation form data
  const [deactivationData, setDeactivationData] = useState({
    password: '',
    confirmDeactivation: ''
  });
  
  // Form errors
  const [errors, setErrors] = useState({});
  
  // User statistics
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || ''
      });
      
      setPreferencesData({
        theme: user.preferences?.theme || 'light',
        language: user.preferences?.language || 'en',
        notifications: {
          email: user.preferences?.notifications?.email ?? true,
          push: user.preferences?.notifications?.push ?? true,
          reminders: user.preferences?.notifications?.reminders ?? true
        }
      });
      
      // Load user statistics
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const response = await apiClient.get('/users/stats');
      console.log('Stats API response:', response);
      // Handle different response structures
      if (response.data && response.data.stats) {
        setUserStats(response.data.stats);
      } else if (response.stats) {
        setUserStats(response.stats);
      } else {
        console.warn('Unexpected stats response structure:', response);
        // Set fallback stats if backend is not available
        if (user) {
          setUserStats({
            accountAge: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
            lastLogin: user.lastLogin,
            emailVerified: user.emailVerified || false
          });
        } else {
          setUserStats(null);
        }
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
      // Set fallback stats if backend is not available
      if (user) {
        setUserStats({
          accountAge: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
          lastLogin: user.lastLogin,
          emailVerified: user.emailVerified || false
        });
      } else {
        setUserStats(null);
      }
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.firstName) {
      newErrors.firstName = 'First name is required';
    } else if (profileData.firstName.length > 50) {
      newErrors.firstName = 'First name cannot exceed 50 characters';
    }

    if (!profileData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else if (profileData.lastName.length > 50) {
      newErrors.lastName = 'Last name cannot exceed 50 characters';
    }

    if (profileData.username && (profileData.username.length < 3 || profileData.username.length > 30)) {
      newErrors.username = 'Username must be between 3 and 30 characters';
    }

    if (profileData.email && !profileData.email.includes('@')) {
      newErrors.email = 'Email must be a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters long';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation is required';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation does not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDeactivationForm = () => {
    const newErrors = {};

    if (!deactivationData.password) {
      newErrors.password = 'Password is required to deactivate account';
    }

    if (deactivationData.confirmDeactivation !== 'DEACTIVATE') {
      newErrors.confirmDeactivation = 'Please type DEACTIVATE to confirm account deactivation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateProfileForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.put('/users/profile', profileData);
      // Handle different response structures
      let updatedUser;
      if (response.data && response.data.user) {
        updatedUser = response.data.user;
      } else if (response.user) {
        updatedUser = response.user;
      } else {
        throw new Error('Unexpected response structure from profile update');
      }
      
      await updateProfile(updatedUser);
      setSuccessMessage('Profile updated successfully!');
    } catch (error) {
      setErrorMessage(error.response?.data?.error || error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updatePreferences(preferencesData);
      setSuccessMessage('Preferences updated successfully!');
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (!validatePasswordForm()) {
      setLoading(false);
      return;
    }

    try {
      await changePassword(passwordData);
      setSuccessMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateDeactivationForm()) {
      setLoading(false);
      return;
    }

    try {
      await deactivateAccount(deactivationData);
      setSuccessMessage('Account deactivated successfully. You will be logged out.');
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Failed to deactivate account');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    
    if (formType === 'profile') {
      setProfileData(prev => ({ ...prev, [name]: value }));
    } else if (formType === 'preferences') {
      setPreferencesData(prev => ({ ...prev, [name]: value }));
    } else if (formType === 'password') {
      setPasswordData(prev => ({ ...prev, [name]: value }));
    } else if (formType === 'deactivation') {
      setDeactivationData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNotificationChange = (key, checked) => {
    setPreferencesData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: checked
      }
    }));
  };

  if (!user) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'account', name: 'Account', icon: '⚠️' }
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <style>
        {`
          label:hover .upload-overlay {
            opacity: 1 !important;
          }
        `}
      </style>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0f172a' }}>
          User Profile Dashboard
        </h1>
        <p style={{ color: '#475569', marginTop: '0.5rem', fontSize: '1.1rem' }}>
          Manage your account, preferences, and security settings
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '1rem',
          color: 'rgb(34, 197, 94)',
          fontWeight: '500'
        }}>
          ✅ {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '1rem',
          color: 'rgb(239, 68, 68)',
          fontWeight: '500'
        }}>
          ❌ {errorMessage}
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr', 
        gap: '2rem'
      }}>
        {/* Left Sidebar - Navigation */}
        <div>
          {/* User Info Card */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '1.5rem',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {/* User Initials Circle */}
              <div style={{
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '3rem',
                margin: '0 auto 1.5rem auto',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.1), transparent)',
                  borderRadius: '50%'
                }} />
                
                {/* User initials */}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {user.firstName?.[0]?.toUpperCase() || 'U'}{user.lastName?.[0]?.toUpperCase() || ''}
                </span>
              </div>

              {/* User Status Indicator */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '9999px',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#22c55e',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{
                  fontSize: '0.875rem',
                  color: '#16a34a',
                  fontWeight: '600'
                }}>
                  Active
                </span>
              </div>
            </div>

            <h3 style={{ 
              textAlign: 'center', 
              marginBottom: '0.5rem',
              color: '#0f172a',
              fontWeight: '700'
            }}>
              {user.firstName} {user.lastName}
            </h3>
            
            <p style={{ 
              textAlign: 'center', 
              color: '#475569',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {user.email}
            </p>
            
            {user.role && (
              <div style={{ 
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: '#6366f1',
                  textTransform: 'uppercase',
                  fontWeight: '700',
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  {user.role}
                </span>
            </div>
          )}
          
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#475569',
              textAlign: 'center'
            }}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* User Statistics */}
          {userStats ? (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              marginBottom: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              transition: 'all 300ms ease-in-out',
              animation: 'fadeIn 0.8s ease-out 0.6s both'
            }}
            className="card-hover"
            >
              <h4 style={{ 
                marginBottom: '1.5rem',
                color: '#1e293b',
                fontWeight: '800',
                fontSize: '1.3rem',
                textAlign: 'center'
              }}>
                📊 Account Statistics
              </h4>
              
              <div style={{ fontSize: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                  borderRadius: '1rem',
                  border: '1px solid rgba(59, 130, 246, 0.1)'
                }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Account Age</span>
                  <span style={{ color: '#1e293b', fontWeight: '700' }}>{userStats.accountAge} days</span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                  borderRadius: '1rem',
                  border: '1px solid rgba(59, 130, 246, 0.1)'
                }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Last Login</span>
                  <span style={{ color: '#1e293b', fontWeight: '700' }}>
                    {userStats.lastLogin ? new Date(userStats.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                  borderRadius: '1rem',
                  border: '1px solid rgba(59, 130, 246, 0.1)'
                }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Email Verified</span>
                  <span style={{ 
                    color: userStats.emailVerified ? '#059669' : '#dc2626', 
                    fontWeight: '700' 
                  }}>
                    {userStats.emailVerified ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              marginBottom: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              animation: 'fadeIn 0.8s ease-out 0.6s both'
            }}>
              <div style={{ color: '#64748b', fontSize: '1rem' }}>
                Loading statistics...
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <nav style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.8s ease-out 0.8s both'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  marginBottom: '0.75rem',
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                    : 'rgba(59, 130, 246, 0.1)',
                  color: activeTab === tab.id ? 'white' : '#3b82f6',
                  border: 'none',
                  borderRadius: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 300ms ease-in-out',
                  border: activeTab === tab.id ? 'none' : '2px solid rgba(59, 130, 246, 0.2)',
                  boxShadow: activeTab === tab.id 
                    ? '0 10px 25px rgba(59, 130, 246, 0.3)' 
                    : '0 4px 15px rgba(59, 130, 246, 0.1)'
                }}
                className="tab-button"
                >
                <span style={{ marginRight: '0.75rem' }}>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Side - Content */}
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          minHeight: '600px',
          animation: 'fadeIn 0.8s ease-out 1s both'
        }}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{ 
                marginBottom: '2rem',
                color: '#1e293b',
                fontWeight: '800',
                fontSize: '2rem',
                textAlign: 'center'
              }}>
                ✏️ Edit Profile
              </h3>
              
              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <label htmlFor="firstName" style={{ 
                      display: 'block', 
                      marginBottom: '0.75rem', 
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '1rem'
                    }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange(e, 'profile')}
                      style={{
                        width: '100%',
                        padding: '1rem 1.25rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '1rem',
                        fontSize: '1rem',
                        transition: 'all 250ms ease-in-out',
                        background: 'white'
                      }}
                      placeholder="First name"
                      disabled={loading}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.firstName && (
                      <div style={{ 
                        color: '#ef4444', 
                        fontSize: '0.875rem', 
                        marginTop: '0.5rem',
                        fontWeight: '500'
                      }}>
                        {errors.firstName}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" style={{ 
                      display: 'block', 
                      marginBottom: '0.75rem', 
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '1rem'
                    }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange(e, 'profile')}
                      style={{
                        width: '100%',
                        padding: '1rem 1.25rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '1rem',
                        fontSize: '1rem',
                        transition: 'all 250ms ease-in-out',
                        background: 'white'
                      }}
                      placeholder="Last name"
                      disabled={loading}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.lastName && (
                      <div style={{ 
                        color: '#ef4444', 
                        fontSize: '0.875rem', 
                        marginTop: '0.5rem',
                        fontWeight: '500'
                      }}>
                        {errors.lastName}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <label htmlFor="username" style={{ 
                      display: 'block', 
                      marginBottom: '0.75rem', 
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '1rem'
                    }}>
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={profileData.username}
                      onChange={(e) => handleInputChange(e, 'profile')}
                      style={{
                        width: '100%',
                        padding: '1rem 1.25rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '1rem',
                        fontSize: '1rem',
                        transition: 'all 250ms ease-in-out',
                        background: 'white'
                      }}
                      placeholder="Username"
                      disabled={loading}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.username && (
                      <div style={{ 
                        color: '#ef4444', 
                        fontSize: '0.875rem', 
                        marginTop: '0.5rem',
                        fontWeight: '500'
                      }}>
                        {errors.username}
                      </div>
                    )}
                    <small style={{ 
                      color: '#64748b', 
                      fontSize: '0.875rem',
                      marginTop: '0.5rem',
                      display: 'block'
                    }}>
                      Leave empty to keep current username
                    </small>
                  </div>

                  <div>
                    <label htmlFor="email" style={{ 
                      display: 'block', 
                      marginBottom: '0.75rem', 
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '1rem'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange(e, 'profile')}
                      style={{
                        width: '100%',
                        padding: '1rem 1.25rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '1rem',
                        fontSize: '1rem',
                        transition: 'all 250ms ease-in-out',
                        background: 'white'
                      }}
                      placeholder="Email address"
                      disabled={loading}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.email && (
                      <div style={{ 
                        color: '#ef4444', 
                        fontSize: '0.875rem', 
                        marginTop: '0.5rem',
                        fontWeight: '500'
                      }}>
                        {errors.email}
                      </div>
                    )}
                    <small style={{ 
                      color: '#64748b', 
                      fontSize: '0.875rem',
                      marginTop: '0.5rem',
                      display: 'block'
                    }}>
                      Your email address for notifications
                    </small>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1.25rem 2rem',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '1.5rem',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 300ms ease-in-out',
                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                    marginTop: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-3px)';
                      e.target.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                >
                  {loading ? 'Updating Profile...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '1.5rem',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                marginBottom: '1.5rem',
                color: '#0f172a',
                fontWeight: '700',
                fontSize: '1.5rem'
              }}>
                User Preferences
              </h3>
              
              <form onSubmit={handlePreferencesSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <label htmlFor="theme" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={preferencesData.theme}
                      onChange={(e) => handleInputChange(e, 'preferences')}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '1rem',
                        fontSize: '1rem'
                      }}
                      disabled={loading}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="language" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Language
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={preferencesData.language}
                      onChange={(e) => handleInputChange(e, 'preferences')}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '1rem',
                        fontSize: '1rem'
                      }}
                      disabled={loading}
                    >
                      <option value="en">English</option>
                      <option value="he">Hebrew</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Notification Settings</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        name="notifications.email"
                        checked={preferencesData.notifications.email}
                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                        disabled={loading}
                      />
                      Email Notifications
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        name="notifications.push"
                        checked={preferencesData.notifications.push}
                        onChange={(e) => handleNotificationChange('push', e.target.checked)}
                        disabled={loading}
                      />
                      Push Notifications
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        name="notifications.reminders"
                        checked={preferencesData.notifications.reminders}
                        onChange={(e) => handleNotificationChange('reminders', e.target.checked)}
                        disabled={loading}
                      />
                      Reminder Notifications
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#6366f1',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 250ms ease-in-out'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Preferences'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '1.5rem',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                marginBottom: '1.5rem',
                color: '#0f172a',
                fontWeight: '700',
                fontSize: '1.5rem'
              }}>
                Change Password
              </h3>
              
              <form onSubmit={handlePasswordSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Current Password *
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => handleInputChange(e, 'password')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.currentPassword ? '#ef4444' : '#e2e8f0'}`,
                      borderRadius: '1rem',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter current password"
                    disabled={loading}
                  />
                  {errors.currentPassword && (
                    <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.currentPassword}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      New Password *
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => handleInputChange(e, 'password')}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${errors.newPassword ? '#ef4444' : '#e2e8f0'}`,
                        borderRadius: '1rem',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                    {errors.newPassword && (
                      <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.newPassword}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handleInputChange(e, 'password')}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${errors.confirmPassword ? '#ef4444' : '#e2e8f0'}`,
                        borderRadius: '1rem',
                        fontSize: '1rem'
                      }}
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                    {errors.confirmPassword && (
                      <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#6366f1',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 250ms ease-in-out'
                  }}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '1.5rem',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ 
                  color: '#dc2626',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  ⚠️ Account Deactivation
                </h4>
                <p style={{ 
                  color: '#dc2626',
                  fontSize: '0.9rem',
                  margin: 0
                }}>
                  This action will deactivate your account. You will be logged out and unable to access your account until reactivation.
                </p>
              </div>
              
              <form onSubmit={handleDeactivationSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="deactivationPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="deactivationPassword"
                    name="password"
                    value={deactivationData.password}
                    onChange={(e) => handleInputChange(e, 'deactivation')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.password ? '#ef4444' : '#e2e8f0'}`,
                      borderRadius: '1rem',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter your password to confirm"
                    disabled={loading}
                  />
                  {errors.password && (
                    <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.password}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label htmlFor="confirmDeactivation" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Type DEACTIVATE to confirm *
                  </label>
                  <input
                    type="text"
                    id="confirmDeactivation"
                    name="confirmDeactivation"
                    value={deactivationData.confirmDeactivation}
                    onChange={(e) => handleInputChange(e, 'deactivation')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.confirmDeactivation ? '#ef4444' : '#e2e8f0'}`,
                      borderRadius: '1rem',
                      fontSize: '1rem'
                    }}
                    placeholder="Type DEACTIVATE"
                    disabled={loading}
                  />
                  {errors.confirmDeactivation && (
                    <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.confirmDeactivation}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 250ms ease-in-out'
                  }}
                >
                  {loading ? 'Deactivating...' : 'Deactivate Account'}
            </button>
          </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
