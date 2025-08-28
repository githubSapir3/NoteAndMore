import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    category: '',
    dueDate: '',
    tags: '',
    stickers: ''
  });

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await apiClient.get(`/tasks?${queryParams.toString()}`);
      
      setTasks(response.tasks);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Load tasks on component mount and filter changes
  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      category: '',
      dueDate: '',
      tags: '',
      stickers: ''
    });
    setEditingTask(null);
    setShowCreateForm(false);
  };

  // Create new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    try {
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        stickers: formData.stickers ? formData.stickers.split(',').map(sticker => sticker.trim()) : []
      };
      
      await apiClient.post('/tasks', taskData);
      resetForm();
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    }
  };

  // Update task
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    
    try {
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        stickers: formData.stickers ? formData.stickers.split(',').map(sticker => sticker.trim()) : []
      };
      
      await apiClient.put(`/tasks/${editingTask.id}`, taskData);
      resetForm();
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to update task');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await apiClient.del(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    }
  };

  // Mark task as complete
  const handleCompleteTask = async (taskId) => {
    try {
      await apiClient.put(`/tasks/${taskId}/complete`);
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to complete task');
    }
  };

  // Edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      category: task.category || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      tags: task.tags ? task.tags.join(', ') : '',
      stickers: task.stickers ? task.stickers.join(', ') : ''
    });
    setShowCreateForm(true);
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--danger-color)';
      case 'medium': return 'var(--warning-color)';
      case 'low': return 'var(--success-color)';
      default: return 'var(--text-secondary)';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success-color)';
      case 'in-progress': return 'var(--primary-color)';
      case 'cancelled': return 'var(--danger-color)';
      default: return 'var(--text-secondary)';
    }
  };

  if (loading && tasks.length === 0) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="tasks-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Tasks</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            ➕ New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Filters</h3>
        <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              className="form-input"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              className="form-input"
              placeholder="Filter by category..."
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="task-form card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          
          <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask}>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Task title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  className="form-input"
                  value={formData.category}
                  onChange={handleFormChange}
                  placeholder="Task category"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-input"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Task description"
                rows="3"
              />
            </div>
            
            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  name="priority"
                  className="form-input"
                  value={formData.priority}
                  onChange={handleFormChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-input"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  className="form-input"
                  value={formData.dueDate}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  className="form-input"
                  value={formData.tags}
                  onChange={handleFormChange}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Stickers (comma-separated)</label>
                <input
                  type="text"
                  name="stickers"
                  className="form-input"
                  value={formData.stickers}
                  onChange={handleFormChange}
                  placeholder="sticker1, sticker2"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks found</h3>
          <p>Create your first task to get started!</p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task._id} className="task-item card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{task.title}</h4>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: getPriorityColor(task.priority) + '20',
                      color: getPriorityColor(task.priority)
                    }}>
                      {task.priority}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: getStatusColor(task.status) + '20',
                      color: getStatusColor(task.status)
                    }}>
                      {task.status}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {task.description}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {task.category && <span>📁 {task.category}</span>}
                    {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                    {task.tags && task.tags.length > 0 && (
                      <span>🏷️ {task.tags.join(', ')}</span>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleCompleteTask(task._id)}
                      className="btn btn-success"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      ✓ Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleEditTask(task)}
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="btn btn-danger"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="btn btn-outline"
            style={{ padding: '0.5rem 0.75rem' }}
          >
            ← Previous
          </button>
          
          <span style={{ padding: '0.5rem 1rem' }}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="btn btn-outline"
            style={{ padding: '0.5rem 0.75rem' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Tasks;
