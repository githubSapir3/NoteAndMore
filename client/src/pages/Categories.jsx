import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'general',
    color: '#667eea',
    icon: '🏷️',
    description: ''
  });

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await apiClient.get(`/categories?${queryParams.toString()}`);
      setCategories(response.categories || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Load categories on component mount and filter changes
  useEffect(() => {
    fetchCategories();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'general',
      color: '#667eea',
      icon: '🏷️',
      description: ''
    });
    setEditingCategory(null);
    setShowCreateForm(false);
  };

  // Create new category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    try {
      await apiClient.post('/categories', formData);
      setSuccess('Category created successfully!');
      resetForm();
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create category');
    }
  };

  // Update category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    try {
      await apiClient.put(`/categories/${editingCategory._id}`, formData);
      setSuccess('Category updated successfully!');
      resetForm();
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update category');
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    
    try {
      await apiClient.del(`/categories/${categoryId}`);
      setSuccess('Category deleted successfully!');
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    }
  };

  // Edit category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      type: category.type || 'general',
      color: category.color || '#667eea',
      icon: category.icon || '🏷️',
      description: category.description || ''
    });
    setShowCreateForm(true);
  };

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'task': return '#28a745';
      case 'event': return '#007bff';
      case 'contact': return '#ffc107';
      case 'shopping': return '#6f42c1';
      case 'general': return '#6c757d';
      default: return '#6c757d';
    }
  };

  // Predefined icons for quick selection
  const predefinedIcons = ['🏷️', '📁', '📂', '🗂️', '🏷️', '📌', '📍', '🎯', '⭐', '💡', '🔖', '🏷️'];

  if (loading && categories.length === 0) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="categories-page">
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
                🏷️ Category Management
              </h1>
              <p style={{ 
                fontSize: '1.1rem', 
                margin: 0, 
                opacity: 0.9,
                fontWeight: '300'
              }}>
                Organize your content with categories
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
              ➕ Add New Category
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
          🔍 Category Filters
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem' 
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
              🔎 Search Categories
            </label>
            <input
              type="text"
              placeholder="Search by name or description..."
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
              📁 Category Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <option value="">All Types</option>
              <option value="task">✅ Task</option>
              <option value="event">📅 Event</option>
              <option value="contact">👥 Contact</option>
              <option value="shopping">🛒 Shopping</option>
              <option value="general">🏷️ General</option>
            </select>
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
            {editingCategory ? '✏️ Edit Category' : '➕ Create New Category'}
          </h3>
          
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
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
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter category name..."
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
                    Category Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
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
                    <option value="general">🏷️ General</option>
                    <option value="task">✅ Task</option>
                    <option value="event">📅 Event</option>
                    <option value="contact">👥 Contact</option>
                    <option value="shopping">🛒 Shopping</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Visual Customization */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: '#495057' }}>
                🎨 Visual Customization
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem' 
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    🎨 Color
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleFormChange}
                      style={{
                        width: '60px',
                        height: '60px',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleFormChange}
                      placeholder="#667eea"
                      style={{
                        flex: 1,
                        padding: '1rem 1.25rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '15px',
                        fontSize: '1rem',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                    🎯 Icon
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {predefinedIcons.map((icon, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        style={{
                          fontSize: '1.5rem',
                          padding: '0.75rem',
                          border: `2px solid ${formData.icon === icon ? formData.color : '#e9ecef'}`,
                          borderRadius: '12px',
                          background: formData.icon === icon ? formData.color : 'white',
                          color: formData.icon === icon ? 'white' : '#333',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.icon !== icon) {
                            e.target.style.transform = 'scale(1.1)';
                            e.target.style.borderColor = formData.color;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.icon !== icon) {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.borderColor = '#e9ecef';
                          }
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleFormChange}
                    placeholder="Or type your own emoji..."
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
            </div>

            {/* Description */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                📄 Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Describe what this category is for..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '15px',
                  fontSize: '1rem',
                  resize: 'vertical',
                  minHeight: '120px'
                }}
              />
            </div>

            {/* Preview */}
            <div style={{ 
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              border: '2px dashed #dee2e6'
            }}>
              <h5 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                👀 Category Preview
              </h5>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  backgroundColor: formData.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'white'
                }}>
                  {formData.icon}
                </div>
                <div>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    color: '#333',
                    marginBottom: '0.25rem'
                  }}>
                    {formData.name || 'Category Name'}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#666',
                    textTransform: 'capitalize'
                  }}>
                    {formData.type || 'general'} category
                  </div>
                </div>
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
                  background: editingCategory ? 'linear-gradient(135deg, #ffc107, #ff9800)' : 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white'
                }}
              >
                {editingCategory ? '✏️ Update Category' : '➕ Create Category'}
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

      {/* Categories List */}
      {categories.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '20px',
          border: '2px dashed #dee2e6',
          marginTop: '2rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🏷️</div>
          <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.5rem', fontWeight: '600' }}>
            No categories found
          </h3>
          <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
            Create your first category to get started!
          </p>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1.5rem' }}>
            🏷️ Category List ({categories.length} categories)
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gap: '1.5rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
          }}>
            {categories.map((category) => (
              <div key={category._id} style={{
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
                {/* Category Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '1rem' 
                }}>
                  <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '25px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: getTypeColor(category.type) + '15',
                    color: getTypeColor(category.type),
                    border: `2px solid ${getTypeColor(category.type)}30`
                  }}>
                    {category.type}
                  </span>
                  
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
                      onClick={() => handleEditCategory(category)}
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
                      title="Edit category"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
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
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {/* Category Content */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    backgroundColor: category.color || '#667eea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: 'white',
                    boxShadow: `0 4px 20px ${category.color || '#667eea'}40`
                  }}>
                    {category.icon || '🏷️'}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '700', 
                      color: '#333', 
                      marginBottom: '0.5rem',
                      lineHeight: '1.3'
                    }}>
                      {category.name}
                    </h4>
                    
                    {category.description && (
                      <p style={{ 
                        color: '#666', 
                        margin: 0, 
                        lineHeight: '1.5',
                        fontSize: '0.95rem'
                      }}>
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Category Footer */}
                <div style={{ 
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                    Created: {new Date(category.createdAt || Date.now()).toLocaleDateString()}
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
                      onClick={() => handleEditCategory(category)}
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
                      ✏️ Edit Category
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

export default Categories;
