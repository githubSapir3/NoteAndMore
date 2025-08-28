import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    avatar: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = 'First name cannot exceed 50 characters';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = 'Last name cannot exceed 50 characters';
    }

    if (formData.username && (formData.username.length < 3 || formData.username.length > 30)) {
      newErrors.username = 'Username must be between 3 and 30 characters';
    }

    if (formData.avatar && !formData.avatar.startsWith('http')) {
      newErrors.avatar = 'Avatar must be a valid URL starting with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await updateProfile(formData);
      setSuccessMessage('Profile updated successfully!');
    } catch (error) {
      setApiError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Manage your account information and preferences
        </p>
      </div>

      <div className="profile-content grid grid-cols-3" style={{ gap: '2rem' }}>
        {/* Profile Info */}
        <div className="profile-info card">
          <h3 style={{ marginBottom: '1rem' }}>Profile Information</h3>
          
          {user.avatar && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <img 
                src={user.avatar} 
                alt="Profile" 
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}
          
          <div className="info-item" style={{ marginBottom: '0.75rem' }}>
            <strong>Email:</strong> {user.email}
          </div>
          <div className="info-item" style={{ marginBottom: '0.75rem' }}>
            <strong>Role:</strong> {user.role}
          </div>
          <div className="info-item" style={{ marginBottom: '0.75rem' }}>
            <strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}
          </div>
          {user.lastLogin && (
            <div className="info-item" style={{ marginBottom: '0.75rem' }}>
              <strong>Last login:</strong> {new Date(user.lastLogin).toLocaleString()}
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="profile-form card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '1rem' }}>Edit Profile</h3>
          
          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}
          
          {apiError && (
            <div className="alert alert-error">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`form-input ${errors.firstName ? 'form-input-error' : ''}`}
                  placeholder="First name"
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <div className="form-error">{errors.firstName}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`form-input ${errors.lastName ? 'form-input-error' : ''}`}
                  placeholder="Last name"
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <div className="form-error">{errors.lastName}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`form-input ${errors.username ? 'form-input-error' : ''}`}
                  placeholder="Username"
                  disabled={isLoading}
                />
                {errors.username && (
                  <div className="form-error">{errors.username}</div>
                )}
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Leave empty to keep current username
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="avatar" className="form-label">
                  Avatar URL
                </label>
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  className={`form-input ${errors.avatar ? 'form-input-error' : ''}`}
                  placeholder="https://example.com/avatar.jpg"
                  disabled={isLoading}
                />
                {errors.avatar && (
                  <div className="form-error">{errors.avatar}</div>
                )}
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Enter a valid image URL
                </small>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
