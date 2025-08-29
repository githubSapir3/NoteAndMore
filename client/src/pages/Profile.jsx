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
    avatar: ''
  });
  
  // Preferences form data
  const [preferencesData, setPreferencesData] = useState({
    theme: 'light',
    language: 'en',
    timezone: '',
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
        avatar: user.avatar || ''
      });
      
      setPreferencesData({
        theme: user.preferences?.theme || 'light',
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || '',
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
      setUserStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
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

    if (profileData.avatar && !profileData.avatar.startsWith('http')) {
      newErrors.avatar = 'Avatar must be a valid URL starting with http:// or https://';
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
      await updateProfile(response.data.user);
      setSuccessMessage('Profile updated successfully!');
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Failed to update profile');
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
    const { name, value, type, checked } = e.target;
    
    if (formType === 'profile') {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (formType === 'preferences') {
      if (name.startsWith('notifications.')) {
        const notificationType = name.split('.')[1];
        setPreferencesData(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            [notificationType]: checked
          }
        }));
      } else {
        setPreferencesData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else if (formType === 'password') {
      setPasswordData(prev => ({
        ...prev,
        [name]: value
      }));
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

  if (!user) {
    return <div className="loading">Loading profile...</div>;
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'account', name: 'Account', icon: '⚠️' }
  ];

  return (
    <div className="profile-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
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
          borderRadius: 'var(--radius-lg)',
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
          borderRadius: 'var(--radius-lg)',
          color: 'rgb(239, 68, 68)',
          fontWeight: '500'
        }}>
          ❌ {errorMessage}
        </div>
      )}

      <div className="profile-content" style={{ 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr', 
        gap: '2rem'
      }}>
        {/* Left Sidebar - Navigation */}
        <div className="profile-sidebar">
          {/* User Info Card */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="Profile" 
                style={{
                    width: '80px',
                    height: '80px',
                  borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--primary-color)'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'var(--gradient-primary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '2rem',
                  margin: '0 auto'
                }}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
          )}
        </div>

            <h3 style={{ 
              textAlign: 'center', 
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              fontWeight: '700'
            }}>
              {user.firstName} {user.lastName}
            </h3>
            
            <p style={{ 
              textAlign: 'center', 
              color: 'var(--text-secondary)',
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
                  color: 'var(--primary-color)',
                  textTransform: 'uppercase',
                  fontWeight: '700',
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  {user.role}
                </span>
            </div>
          )}
          
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* User Statistics */}
          {userStats && (
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ 
                marginBottom: '1rem',
                color: 'var(--text-primary)',
                fontWeight: '600'
              }}>
                📊 Account Statistics
              </h4>
              
              <div style={{ fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Account Age:</strong> {userStats.accountAge} days
                </div>
                {userStats.lastLogin && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Last Login:</strong> {new Date(userStats.lastLogin).toLocaleDateString()}
                  </div>
                )}
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Email Verified:</strong> {userStats.emailVerified ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <nav style={{
            background: 'white',
            padding: '1rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? 'var(--primary-color)' : 'var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-normal)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '500'
                }}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content - Forms */}
        <div className="profile-content-main">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ 
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '1.5rem'
              }}>
                Edit Profile Information
              </h3>
              
              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="firstName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                        padding: '0.75rem',
                        border: `1px solid ${errors.firstName ? '#ef4444' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1rem'
                      }}
                  placeholder="First name"
                      disabled={loading}
                />
                {errors.firstName && (
                      <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.firstName}
                      </div>
                )}
              </div>

                  <div>
                    <label htmlFor="lastName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                        padding: '0.75rem',
                        border: `1px solid ${errors.lastName ? '#ef4444' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1rem'
                      }}
                  placeholder="Last name"
                      disabled={loading}
                />
                {errors.lastName && (
                      <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.lastName}
                      </div>
                )}
              </div>
            </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                        padding: '0.75rem',
                        border: `1px solid ${errors.username ? '#ef4444' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1rem'
                      }}
                  placeholder="Username"
                      disabled={loading}
                />
                {errors.username && (
                      <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.username}
                      </div>
                )}
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Leave empty to keep current username
                </small>
              </div>

                  <div>
                    <label htmlFor="avatar" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Avatar URL
                </label>
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                      value={profileData.avatar}
                      onChange={(e) => handleInputChange(e, 'profile')}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${errors.avatar ? '#ef4444' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1rem'
                      }}
                  placeholder="https://example.com/avatar.jpg"
                      disabled={loading}
                />
                {errors.avatar && (
                      <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errors.avatar}
                      </div>
                )}
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Enter a valid image URL
                </small>
              </div>
            </div>

            <button
              type="submit"
                  disabled={loading}
                  style={{
                    background: 'var(--primary-color)',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all var(--transition-normal)'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ 
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
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
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
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
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
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
                  <label htmlFor="timezone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Timezone
                  </label>
                  <input
                    type="text"
                    id="timezone"
                    name="timezone"
                    value={preferencesData.timezone}
                    onChange={(e) => handleInputChange(e, 'preferences')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '1rem'
                    }}
                    placeholder="e.g., UTC, America/New_York"
                    disabled={loading}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Notification Settings</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        name="notifications.email"
                        checked={preferencesData.notifications.email}
                        onChange={(e) => handleInputChange(e, 'preferences')}
                        disabled={loading}
                      />
                      Email Notifications
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        name="notifications.push"
                        checked={preferencesData.notifications.push}
                        onChange={(e) => handleInputChange(e, 'preferences')}
                        disabled={loading}
                      />
                      Push Notifications
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        name="notifications.reminders"
                        checked={preferencesData.notifications.reminders}
                        onChange={(e) => handleInputChange(e, 'preferences')}
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
                    background: 'var(--primary-color)',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all var(--transition-normal)'
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
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ 
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
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
                      border: `1px solid ${errors.currentPassword ? '#ef4444' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-lg)',
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
                        border: `1px solid ${errors.newPassword ? '#ef4444' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-lg)',
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
                        border: `1px solid ${errors.confirmPassword ? '#ef4444' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-lg)',
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
                    background: 'var(--primary-color)',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all var(--transition-normal)'
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
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-lg)',
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
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all var(--transition-normal)'
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
