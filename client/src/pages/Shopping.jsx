import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const Shopping = () => {
  const [shoppingLists, setShoppingLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    status: 'active',
    items: [{ name: '', quantity: 1, price: '', currency: 'USD', priority: 'medium', completed: false }]
  });

  // Fetch shopping lists from API
  const fetchShoppingLists = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await apiClient.get(`/shopping?${queryParams.toString()}`);
      setShoppingLists(response.shoppingLists || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch shopping lists');
    } finally {
      setLoading(false);
    }
  };

  // Load shopping lists on component mount and filter changes
  useEffect(() => {
    fetchShoppingLists();
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

  // Handle item array changes
  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: '', currency: 'USD', priority: 'medium', completed: false }]
    }));
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  // Toggle item completion
  const toggleItemCompletion = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dueDate: '',
      status: 'active',
      items: [{ name: '', quantity: 1, price: '', currency: 'USD', priority: 'medium', completed: false }]
    });
    setEditingList(null);
    setShowCreateForm(false);
  };

  // Create new shopping list
  const handleCreateList = async (e) => {
    e.preventDefault();
    
    try {
      const listData = {
        ...formData,
        items: formData.items.filter(item => item.name.trim())
      };
      
      await apiClient.post('/shopping', listData);
      setSuccess('Shopping list created successfully!');
      resetForm();
      fetchShoppingLists();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create shopping list');
    }
  };

  // Update shopping list
  const handleUpdateList = async (e) => {
    e.preventDefault();
    
    try {
      const listData = {
        ...formData,
        items: formData.items.filter(item => item.name.trim())
      };
      
      await apiClient.put(`/shopping/${editingList._id}`, listData);
      setSuccess('Shopping list updated successfully!');
      resetForm();
      fetchShoppingLists();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update shopping list');
    }
  };

  // Delete shopping list
  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this shopping list?')) return;
    
    try {
      await apiClient.del(`/shopping/${listId}`);
      setSuccess('Shopping list deleted successfully!');
      fetchShoppingLists();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete shopping list');
    }
  };

  // Edit shopping list
  const handleEditList = (list) => {
    setEditingList(list);
    setFormData({
      name: list.name || '',
      description: list.description || '',
      dueDate: list.dueDate ? list.dueDate.split('T')[0] : '',
      status: list.status || 'active',
      items: list.items && list.items.length > 0 ? list.items : [{ name: '', quantity: 1, price: '', currency: 'USD', priority: 'medium', completed: false }]
    });
    setShowCreateForm(true);
  };

  // Toggle list status
  const handleToggleStatus = async (listId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'completed' : 'active';
      await apiClient.patch(`/shopping/${listId}`, { status: newStatus });
      fetchShoppingLists();
    } catch (err) {
      setError(err.message || 'Failed to update list status');
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'completed': return '#6c757d';
      case 'archived': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  // Calculate total price
  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseFloat(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  };

  if (loading && shoppingLists.length === 0) {
    return <div className="loading">Loading shopping lists...</div>;
  }

  return (
    <div className="shopping-page">
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
                🛒 Shopping Lists
              </h1>
              <p style={{ 
                fontSize: '1.1rem', 
                margin: 0, 
                opacity: 0.9,
                fontWeight: '300'
              }}>
                Create and manage your shopping lists
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
              ➕ Create New List
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
          🔍 Shopping List Filters
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem' 
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
              🔎 Search Lists
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
              📊 Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">🟢 Active</option>
              <option value="completed">✅ Completed</option>
              <option value="archived">📁 Archived</option>
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
            {editingList ? '✏️ Edit Shopping List' : '➕ Create New Shopping List'}
          </h3>
          
          <form onSubmit={editingList ? handleUpdateList : handleCreateList}>
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
                    List Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter shopping list name..."
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
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
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
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
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
                    <option value="active">🟢 Active</option>
                    <option value="completed">✅ Completed</option>
                    <option value="archived">📁 Archived</option>
                  </select>
                </div>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                  📄 Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe your shopping list..."
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
            </div>

            {/* Shopping Items */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#495057', margin: 0 }}>
                  🛍️ Shopping Items
                </h4>
                <button
                  type="button"
                  onClick={addItem}
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
                  ➕ Add Item
                </button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} style={{
                  border: '2px solid #e9ecef',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', 
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="Enter item name..."
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e9ecef',
                          borderRadius: '12px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e9ecef',
                          borderRadius: '12px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                        Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        placeholder="0.00"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e9ecef',
                          borderRadius: '12px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                        Currency
                      </label>
                      <select
                        value={item.currency}
                        onChange={(e) => handleItemChange(index, 'currency', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e9ecef',
                          borderRadius: '12px',
                          fontSize: '0.95rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="USD">💵 USD</option>
                        <option value="EUR">💶 EUR</option>
                        <option value="ILS">₪ ILS</option>
                        <option value="GBP">💷 GBP</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                        Priority
                      </label>
                      <select
                        value={item.priority}
                        onChange={(e) => handleItemChange(index, 'priority', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e9ecef',
                          borderRadius: '12px',
                          fontSize: '0.95rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🔴 High</option>
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>
                        ✓ Done
                      </label>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleItemCompletion(index)}
                        style={{ width: '20px', height: '20px' }}
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          style={{
                            padding: '0.5rem',
                            border: '2px solid #dc3545',
                            borderRadius: '50%',
                            background: 'white',
                            color: '#dc3545',
                            cursor: 'pointer',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem'
                          }}
                          title="Remove item"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                  background: editingList ? 'linear-gradient(135deg, #ffc107, #ff9800)' : 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white'
                }}
              >
                {editingList ? '✏️ Update List' : '➕ Create List'}
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

      {/* Shopping Lists */}
      {shoppingLists.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '20px',
          border: '2px dashed #dee2e6',
          marginTop: '2rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🛒</div>
          <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.5rem', fontWeight: '600' }}>
            No shopping lists found
          </h3>
          <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
            Create your first shopping list to get started!
          </p>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1.5rem' }}>
            🛒 Shopping Lists ({shoppingLists.length} lists)
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gap: '1.5rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))'
          }}>
            {shoppingLists.map((list) => (
              <div key={list._id} style={{
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
                {/* List Header */}
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
                      backgroundColor: getStatusColor(list.status) + '15',
                      color: getStatusColor(list.status),
                      border: `2px solid ${getStatusColor(list.status)}30`
                    }}>
                      {list.status}
                    </span>
                    {list.dueDate && (
                      <span style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '25px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: '2px solid #007bff'
                      }}>
                        📅 {new Date(list.dueDate).toLocaleDateString()}
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
                      onClick={() => handleToggleStatus(list._id, list.status)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '50%',
                        border: '2px solid #28a745',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: 'white',
                        color: '#28a745',
                        fontSize: '1rem',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={list.status === 'active' ? 'Mark as completed' : 'Mark as active'}
                    >
                      {list.status === 'active' ? '✓' : '🔄'}
                    </button>
                    <button
                      onClick={() => handleEditList(list)}
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
                      title="Edit list"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteList(list._id)}
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
                      title="Delete list"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {/* List Content */}
                <h4 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: '#333', 
                  marginBottom: '0.75rem',
                  lineHeight: '1.3'
                }}>
                  {list.name}
                </h4>
                
                {list.description && (
                  <p style={{ 
                    color: '#666', 
                    marginBottom: '1rem', 
                    lineHeight: '1.6',
                    fontSize: '0.95rem'
                  }}>
                    {list.description}
                  </p>
                )}
                
                {/* Items List */}
                <div style={{ 
                  marginBottom: '1rem',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {list.items && list.items.length > 0 ? (
                    list.items.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem',
                        backgroundColor: item.completed ? '#f8f9fa' : 'white',
                        borderRadius: '12px',
                        border: `2px solid ${item.completed ? '#dee2e6' : '#e9ecef'}`,
                        marginBottom: '0.5rem',
                        opacity: item.completed ? 0.7 : 1
                      }}>
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => {
                            // This would need to be implemented to update individual items
                            console.log('Toggle item completion:', item);
                          }}
                          style={{ width: '18px', height: '18px' }}
                        />
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '0.25rem'
                          }}>
                            <span style={{ 
                              fontSize: '0.95rem', 
                              fontWeight: '600', 
                              color: '#333',
                              textDecoration: item.completed ? 'line-through' : 'none'
                            }}>
                              {item.name}
                            </span>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: getPriorityColor(item.priority) + '15',
                              color: getPriorityColor(item.priority),
                              border: `1px solid ${getPriorityColor(item.priority)}30`
                            }}>
                              {item.priority}
                            </span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            gap: '1rem', 
                            fontSize: '0.875rem', 
                            color: '#666' 
                          }}>
                            <span>Qty: {item.quantity}</span>
                            {item.price && <span>Price: {item.currency} {item.price}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '1rem', 
                      color: '#666', 
                      fontStyle: 'italic' 
                    }}>
                      No items in this list
                    </div>
                  )}
                </div>
                
                {/* List Footer */}
                <div style={{ 
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                    {list.items && list.items.length > 0 && (
                      <span>
                        {list.items.filter(item => item.completed).length} of {list.items.length} items completed
                        {list.items.some(item => item.price) && (
                          <span style={{ marginLeft: '1rem' }}>
                            • Total: {list.items[0]?.currency || 'USD'} {calculateTotal(list.items).toFixed(2)}
                          </span>
                        )}
                      </span>
                    )}
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
                      onClick={() => handleEditList(list)}
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
                      ✏️ Edit List
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

export default Shopping;
