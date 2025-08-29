import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    tag: '',
    favorites: false
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    phones: [{ number: '', type: 'mobile' }],
    emails: [{ address: '', type: 'personal' }],
    priority: 'medium',
    birthday: '',
    address: '',
    notes: '',
    tags: '',
    isFavorite: false
  });

  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await apiClient.get(`/contacts?${queryParams.toString()}`);
      setContacts(response.contacts || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  // Load contacts on component mount and filter changes
  useEffect(() => {
    fetchContacts();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Handle phone/email array changes
  const handleArrayChange = (field, index, key, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [key]: value } : item
      )
    }));
  };

  // Add new phone/email field
  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], field === 'phones' ? { number: '', type: 'mobile' } : { address: '', type: 'personal' }]
    }));
  };

  // Remove phone/email field
  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      nickname: '',
      phones: [{ number: '', type: 'mobile' }],
      emails: [{ address: '', type: 'personal' }],
      priority: 'medium',
      birthday: '',
      address: '',
      notes: '',
      tags: '',
      isFavorite: false
    });
    setEditingContact(null);
    setShowCreateForm(false);
  };

  // Create new contact
  const handleCreateContact = async (e) => {
    e.preventDefault();
    
    try {
      const contactData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      
      await apiClient.post('/contacts', contactData);
      setSuccess('Contact created successfully!');
      resetForm();
      fetchContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create contact');
    }
  };

  // Update contact
  const handleUpdateContact = async (e) => {
    e.preventDefault();
    
    try {
      const contactData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      
      await apiClient.put(`/contacts/${editingContact._id}`, contactData);
      setSuccess('Contact updated successfully!');
      resetForm();
      fetchContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update contact');
    }
  };

  // Delete contact
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await apiClient.del(`/contacts/${contactId}`);
      setSuccess('Contact deleted successfully!');
      fetchContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete contact');
    }
  };

  // Edit contact
  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      nickname: contact.nickname || '',
      phones: contact.phones && contact.phones.length > 0 ? contact.phones : [{ number: '', type: 'mobile' }],
      emails: contact.emails && contact.emails.length > 0 ? contact.emails : [{ address: '', type: 'personal' }],
      priority: contact.priority || 'medium',
      birthday: contact.birthday ? contact.birthday.split('T')[0] : '',
      address: contact.address || '',
      notes: contact.notes || '',
      tags: contact.tags ? contact.tags.join(', ') : '',
      isFavorite: contact.isFavorite || false
    });
    setShowCreateForm(true);
  };

  // Toggle favorite status
  const handleToggleFavorite = async (contactId, currentStatus) => {
    try {
      await apiClient.patch(`/contacts/${contactId}`, { isFavorite: !currentStatus });
      fetchContacts();
    } catch (err) {
      setError(err.message || 'Failed to update favorite status');
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading && contacts.length === 0) {
    return <div className="loading">Loading contacts...</div>;
  }

  return (
    <div className="contacts-page">
      {/* Header */}
      <div style={{ 
        marginBottom: '2rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '24px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '800', 
                margin: '0 0 0.5rem 0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                👥 Contact Management
              </h1>
              <p style={{ 
                fontSize: '1.1rem', 
                margin: 0, 
                opacity: 0.9,
                fontWeight: '300'
              }}>
                Manage your contacts and relationships
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50px',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              ➕ Add New Contact
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '12px',
          border: '1px solid #c3e6cb',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          ✅ {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '12px',
          border: '1px solid #f5c6cb',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700', color: '#333' }}>
          🔍 Contact Filters
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem' 
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
              🔎 Search Contacts
            </label>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
              ⚡ Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <option value="">All Priorities</option>
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
              🏷️ Tag
            </label>
            <input
              type="text"
              placeholder="Filter by tag..."
              value={filters.tag}
              onChange={(e) => handleFilterChange('tag', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '0.95rem'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="favorites"
              checked={filters.favorites}
              onChange={(e) => handleFilterChange('favorites', e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <label htmlFor="favorites" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
              ⭐ Favorites Only
            </label>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: '700', color: '#333' }}>
            {editingContact ? '✏️ Edit Contact' : '➕ Create New Contact'}
          </h3>
          
          <form onSubmit={editingContact ? handleUpdateContact : handleCreateContact}>
            {/* Basic Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: '#495057' }}>
                📝 Basic Information
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem' 
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '15px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '15px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    Nickname
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '15px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '15px',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: '#495057' }}>
                📞 Contact Information
              </h4>
              
              {/* Phones */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    📱 Phone Numbers
                  </label>
                  <button
                    type="button"
                    onClick={() => addArrayField('phones')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '2px solid #28a745',
                      borderRadius: '20px',
                      background: 'white',
                      color: '#28a745',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    ➕ Add Phone
                  </button>
                </div>
                
                {formData.phones.map((phone, index) => (
                  <div key={index} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 150px 40px', 
                    gap: '1rem', 
                    marginBottom: '1rem',
                    alignItems: 'center'
                  }}>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phone.number}
                      onChange={(e) => handleArrayChange('phones', index, 'number', e.target.value)}
                      style={{
                        padding: '0.875rem 1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '0.95rem'
                      }}
                    />
                    <select
                      value={phone.type}
                      onChange={(e) => handleArrayChange('phones', index, 'type', e.target.value)}
                      style={{
                        padding: '0.875rem 1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="mobile">📱 Mobile</option>
                      <option value="home">🏠 Home</option>
                      <option value="work">💼 Work</option>
                      <option value="other">📞 Other</option>
                    </select>
                    {formData.phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField('phones', index)}
                        style={{
                          padding: '0.5rem',
                          border: '2px solid #dc3545',
                          borderRadius: '50%',
                          background: 'white',
                          color: '#dc3545',
                          cursor: 'pointer',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Emails */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    📧 Email Addresses
                  </label>
                  <button
                    type="button"
                    onClick={() => addArrayField('emails')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '2px solid #28a745',
                      borderRadius: '20px',
                      background: 'white',
                      color: '#28a745',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    ➕ Add Email
                  </button>
                </div>
                
                {formData.emails.map((email, index) => (
                  <div key={index} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 150px 40px', 
                    gap: '1rem', 
                    marginBottom: '1rem',
                    alignItems: 'center'
                  }}>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email.address}
                      onChange={(e) => handleArrayChange('emails', index, 'address', e.target.value)}
                      style={{
                        padding: '0.875rem 1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '0.95rem'
                      }}
                    />
                    <select
                      value={email.type}
                      onChange={(e) => handleArrayChange('emails', index, 'type', e.target.value)}
                      style={{
                        padding: '0.875rem 1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="personal">👤 Personal</option>
                      <option value="work">💼 Work</option>
                      <option value="other">📧 Other</option>
                    </select>
                    {formData.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField('emails', index)}
                        style={{
                          padding: '0.5rem',
                          border: '2px solid #dc3545',
                          borderRadius: '50%',
                          background: 'white',
                          color: '#dc3545',
                          cursor: 'pointer',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: '#495057' }}>
                📋 Additional Information
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem' 
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    🎂 Birthday
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '15px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    🏷️ Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleFormChange}
                    placeholder="family, work, friend (comma-separated)"
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '15px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                  📍 Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Enter full address..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '15px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                  📝 Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Additional notes about this contact..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '15px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                  <input
                    type="checkbox"
                    name="isFavorite"
                    checked={formData.isFavorite}
                    onChange={handleFormChange}
                    style={{ width: '20px', height: '20px' }}
                  />
                  ⭐ Mark as Favorite
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '2px solid #f0f0f0'
            }}>
              <button 
                type="submit" 
                style={{
                  padding: '1rem 2rem',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: editingContact ? 'linear-gradient(135deg, #ffc107, #ff9800)' : 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white'
                }}
              >
                {editingContact ? '✏️ Update Contact' : '➕ Create Contact'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '1rem 2rem',
                  border: '2px solid #6c757d',
                  borderRadius: '15px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  color: '#6c757d'
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '20px',
          border: '2px dashed #dee2e6',
          marginTop: '2rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>👥</div>
          <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.5rem', fontWeight: '600' }}>
            No contacts found
          </h3>
          <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
            Create your first contact to get started!
          </p>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1.5rem' }}>
            👥 Contact List ({contacts.length} contacts)
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gap: '1.5rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
          }}>
            {contacts.map((contact) => (
              <div key={contact._id} style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
              >
                {/* Contact Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '1rem' 
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '25px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backgroundColor: getPriorityColor(contact.priority) + '15',
                      color: getPriorityColor(contact.priority),
                      border: `2px solid ${getPriorityColor(contact.priority)}30`
                    }}>
                      {contact.priority}
                    </span>
                    {contact.isFavorite && (
                      <span style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '25px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#ffc107',
                        color: '#212529',
                        border: '2px solid #ffc107'
                      }}>
                        ⭐ Favorite
                      </span>
                    )}
                  </div>
                  
                  {/* Action Menu */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                  >
                    <button
                      onClick={() => handleToggleFavorite(contact._id, contact.isFavorite)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '50%',
                        border: '2px solid #ffc107',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: contact.isFavorite ? '#ffc107' : 'white',
                        color: contact.isFavorite ? '#212529' : '#ffc107',
                        fontSize: '1rem',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => handleEditContact(contact)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '50%',
                        border: '2px solid #007bff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: 'white',
                        color: '#007bff',
                        fontSize: '1rem',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Edit contact"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact._id)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '50%',
                        border: '2px solid #dc3545',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: 'white',
                        color: '#dc3545',
                        fontSize: '1rem',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete contact"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {/* Contact Name */}
                <h4 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: '#333', 
                  marginBottom: '0.75rem',
                  lineHeight: '1.3'
                }}>
                  {contact.firstName} {contact.lastName}
                  {contact.nickname && (
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#666', 
                      fontWeight: '400',
                      marginLeft: '0.5rem'
                    }}>
                      ({contact.nickname})
                    </span>
                  )}
                </h4>
                
                {/* Contact Details */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  flexWrap: 'wrap',
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef'
                }}>
                  {contact.phones && contact.phones.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📱</span>
                      <span style={{ fontSize: '0.875rem', color: '#495057', fontWeight: '500' }}>
                        {contact.phones[0].number}
                        {contact.phones.length > 1 && ` +${contact.phones.length - 1} more`}
                      </span>
                    </div>
                  )}
                  
                  {contact.emails && contact.emails.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📧</span>
                      <span style={{ fontSize: '0.875rem', color: '#495057', fontWeight: '500' }}>
                        {contact.emails[0].address}
                        {contact.emails.length > 1 && ` +${contact.emails.length - 1} more`}
                      </span>
                    </div>
                  )}
                  
                  {contact.birthday && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🎂</span>
                      <span style={{ fontSize: '0.875rem', color: '#495057', fontWeight: '500' }}>
                        {new Date(contact.birthday).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div style={{ 
                    marginTop: '0.75rem',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {contact.tags.map((tag, index) => (
                      <span key={index} style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#e9ecef',
                        color: '#495057',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Contact Footer */}
                <div style={{ 
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                    Created: {new Date(contact.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                  >
                    <button
                      onClick={() => handleEditContact(contact)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '25px',
                        border: '2px solid #667eea',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      ✏️ Edit Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
