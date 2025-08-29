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

  // Sticker API states
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');
  const [stickerSearchResults, setStickerSearchResults] = useState([]);
  const [stickerSearchLoading, setStickerSearchLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('sticker');
  const [aiGenerationLoading, setAiGenerationLoading] = useState(false);
  const [generatedSticker, setGeneratedSticker] = useState(null);
  const [showStickerSection, setShowStickerSection] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [showStickerModal, setShowStickerModal] = useState(false);

  // Search stickers using Freepik API
  const searchStickers = async () => {
    if (!stickerSearchQuery.trim()) return;
    
    try {
      setStickerSearchLoading(true);
      setError('');
      const response = await apiClient.get(`/stickerAPI?query=${encodeURIComponent(stickerSearchQuery)}&per_page=10`);
      
      // Handle different response structures from Freepik API
      let stickers = [];
      if (response.data && Array.isArray(response.data)) {
        stickers = response.data;
      } else if (response.results && Array.isArray(response.results)) {
        stickers = response.results;
      } else if (Array.isArray(response)) {
        stickers = response;
      }
      
      // Filter out invalid stickers and ensure proper structure
      const validStickers = stickers.filter(sticker => 
        sticker && (sticker.image?.source || sticker.url || sticker.image_url)
      ).map(sticker => {
        const stickerData = {
          id: sticker.id || sticker._id,
          title: sticker.title || sticker.name || 'Untitled Sticker',
          image: {
            source: sticker.image?.source || sticker.url || sticker.image_url || sticker.thumbnail
          },
          url: sticker.image?.source || sticker.url || sticker.image_url || sticker.thumbnail,
          category: sticker.category || 'sticker'
        };
        
        console.log('Processed sticker:', stickerData);
        return stickerData;
      });
      
      setStickerSearchResults(validStickers);
      
      if (validStickers.length === 0) {
        setError('No stickers found for your search. Try different keywords like "cute cat sticker" or "emoji".');
      } else {
        // Clear any previous errors
        setError('');
        console.log(`Found ${validStickers.length} stickers for "${stickerSearchQuery}"`);
      }
    } catch (err) {
      console.error('Sticker search error:', err);
      setError('Failed to search stickers: ' + (err.message || 'Unknown error'));
      setStickerSearchResults([]);
    } finally {
      setStickerSearchLoading(false);
    }
  };

  // Generate AI sticker using Segmind API
  const generateAISticker = async () => {
    if (!aiPrompt.trim()) return;
    
    try {
      setAiGenerationLoading(true);
      setError('');
      const response = await apiClient.post('/stickerAPI/generate', {
        prompt: aiPrompt,
        style: aiStyle
      });
      
      // Handle different response structures from Segmind API
      let imageUrl = null;
      if (response.image_url) {
        imageUrl = response.image_url;
      } else if (response.url) {
        imageUrl = response.url;
      } else if (response.image) {
        imageUrl = response.image;
      } else if (response.data?.image_url) {
        imageUrl = response.data.image_url;
      }
      
      if (imageUrl) {
        setGeneratedSticker(imageUrl);
        // Add to form data stickers field
        setFormData(prev => ({
          ...prev,
          stickers: prev.stickers ? `${prev.stickers}, ${imageUrl}` : imageUrl
        }));
        setError(''); // Clear any previous errors
      } else {
        setError('Generated sticker received but no image URL found in response');
        console.error('Unexpected API response structure:', response);
      }
    } catch (err) {
      console.error('AI sticker generation error:', err);
      setError('Failed to generate AI sticker: ' + (err.message || 'Unknown error'));
      setGeneratedSticker(null);
    } finally {
      setAiGenerationLoading(false);
    }
  };
  const addStickerToTask = (stickerUrl) => {
    console.log('Adding sticker to task:', stickerUrl);
    
    // Ensure we're getting the actual URL string
    let urlToAdd = stickerUrl;
    if (typeof stickerUrl === 'object') {
      urlToAdd = stickerUrl.image?.source || stickerUrl.url || stickerUrl.image_url;
    }
    
    if (!urlToAdd || typeof urlToAdd !== 'string') {
      console.error('Invalid sticker URL:', stickerUrl);
      setError('Invalid sticker URL provided');
      return;
    }
    
    setFormData(prev => {
      const currentStickers = prev.stickers ? prev.stickers.split(',').map(s => s.trim()).filter(s => s) : [];
      const newStickers = [...currentStickers, urlToAdd];
      const updatedStickers = newStickers.join(', ');
      console.log('Updated stickers:', updatedStickers);
      return {
        ...prev,
        stickers: updatedStickers
      };
    });
    
    setError(''); // Clear any previous errors
  };

  // Handle sticker click to show modal
  const handleStickerClick = (sticker) => {
    setSelectedSticker(sticker);
    setShowStickerModal(true);
  };

  // Close sticker modal
  const closeStickerModal = () => {
    setShowStickerModal(false);
    setSelectedSticker(null);
  };

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
             <div style={{ 
         marginBottom: '2rem',
         padding: '2rem',
         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
         borderRadius: '24px',
         color: 'white',
         position: 'relative',
         overflow: 'hidden'
       }}>
         {/* Background Pattern */}
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
                 📋 Task Management
               </h1>
               <p style={{ 
                 fontSize: '1.1rem', 
                 margin: 0, 
                 opacity: 0.9,
                 fontWeight: '300'
               }}>
                 Organize, track, and complete your tasks with style
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
               ➕ Create New Task
             </button>
           </div>
         </div>
       </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

             {/* Filters */}
       <div style={{
         backgroundColor: 'white',
         borderRadius: '20px',
         padding: '2rem',
         boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
         border: '1px solid rgba(255, 255, 255, 0.2)',
         marginBottom: '2rem',
         position: 'relative',
         overflow: 'hidden'
       }}>
         {/* Background Pattern */}
         <div style={{
           position: 'absolute',
           top: '-50%',
           right: '-50%',
           width: '200%',
           height: '200%',
           background: 'radial-gradient(circle, rgba(0, 123, 255, 0.03) 0%, transparent 70%)',
           pointerEvents: 'none'
         }} />
         
         <div style={{ position: 'relative', zIndex: 1 }}>
           <div style={{ 
             display: 'flex', 
             alignItems: 'center', 
             gap: '0.75rem', 
             marginBottom: '1.5rem' 
           }}>
             <div style={{
               width: '40px',
               height: '40px',
               borderRadius: '12px',
               background: 'linear-gradient(135deg, #007bff, #0056b3)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               color: 'white',
               fontSize: '1.2rem',
               fontWeight: 'bold'
             }}>
               🔍
             </div>
             <h3 style={{ 
               fontSize: '1.5rem', 
               fontWeight: '700', 
               color: '#333', 
               margin: 0 
             }}>
               Task Filters
             </h3>
           </div>
           
           <div style={{ 
             display: 'grid', 
             gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
             gap: '1.5rem' 
           }}>
             <div>
               <label style={{ 
                 display: 'block', 
                 marginBottom: '0.5rem', 
                 fontSize: '0.875rem', 
                 fontWeight: '600', 
                 color: '#495057' 
               }}>
                 🔎 Search Tasks
               </label>
               <input
                 type="text"
                 placeholder="Search by title, description..."
                 value={filters.search}
                 onChange={(e) => handleFilterChange('search', e.target.value)}
                 style={{
                   width: '100%',
                   padding: '0.875rem 1rem',
                   border: '2px solid #e9ecef',
                   borderRadius: '12px',
                   fontSize: '0.95rem',
                   transition: 'all 0.3s ease',
                   backgroundColor: '#fff'
                 }}
                 onFocus={(e) => {
                   e.target.style.borderColor = '#007bff';
                   e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
                 }}
                 onBlur={(e) => {
                   e.target.style.borderColor = '#e9ecef';
                   e.target.style.boxShadow = 'none';
                 }}
               />
             </div>
             
             <div>
               <label style={{ 
                 display: 'block', 
                 marginBottom: '0.5rem', 
                 fontSize: '0.875rem', 
                 fontWeight: '600', 
                 color: '#495057' 
               }}>
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
                   transition: 'all 0.3s ease',
                   backgroundColor: '#fff',
                   cursor: 'pointer'
                 }}
                 onFocus={(e) => {
                   e.target.style.borderColor = '#007bff';
                   e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
                 }}
                 onBlur={(e) => {
                   e.target.style.borderColor = '#e9ecef';
                   e.target.style.boxShadow = 'none';
                 }}
               >
                 <option value="">All Statuses</option>
                 <option value="pending">⏳ Pending</option>
                 <option value="in-progress">🔄 In Progress</option>
                 <option value="completed">✅ Completed</option>
                 <option value="cancelled">❌ Cancelled</option>
               </select>
             </div>
             
             <div>
               <label style={{ 
                 display: 'block', 
                 marginBottom: '0.5rem', 
                 fontSize: '0.875rem', 
                 fontWeight: '600', 
                 color: '#495057' 
               }}>
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
                   transition: 'all 0.3s ease',
                   backgroundColor: '#fff',
                   cursor: 'pointer'
                 }}
                 onFocus={(e) => {
                   e.target.style.borderColor = '#007bff';
                   e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
                 }}
                 onBlur={(e) => {
                   e.target.style.borderColor = '#e9ecef';
                   e.target.style.boxShadow = 'none';
                 }}
               >
                 <option value="">All Priorities</option>
                 <option value="low">🟢 Low</option>
                 <option value="medium">🟡 Medium</option>
                 <option value="high">🔴 High</option>
               </select>
             </div>
             
             <div>
               <label style={{ 
                 display: 'block', 
                 marginBottom: '0.5rem', 
                 fontSize: '0.875rem', 
                 fontWeight: '600', 
                 color: '#495057' 
               }}>
                 📁 Category
               </label>
               <input
                 type="text"
                 placeholder="Filter by category..."
                 value={filters.category}
                 onChange={(e) => handleFilterChange('category', e.target.value)}
                 style={{
                   width: '100%',
                   padding: '0.875rem 1rem',
                   border: '2px solid #e9ecef',
                   borderRadius: '12px',
                   fontSize: '0.95rem',
                   transition: 'all 0.3s ease',
                   backgroundColor: '#fff'
                 }}
                 onFocus={(e) => {
                   e.target.style.borderColor = '#007bff';
                   e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
                 }}
                 onBlur={(e) => {
                   e.target.style.borderColor = '#e9ecef';
                   e.target.style.boxShadow = 'none';
                 }}
               />
             </div>
           </div>
           
           {/* Active Filters Display */}
           {(filters.search || filters.status || filters.priority || filters.category) && (
             <div style={{ 
               marginTop: '1.5rem',
               padding: '1rem',
               backgroundColor: '#f8f9fa',
               borderRadius: '12px',
               border: '1px solid #e9ecef'
             }}>
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '0.5rem', 
                 marginBottom: '0.75rem',
                 fontSize: '0.875rem',
                 fontWeight: '600',
                 color: '#495057'
               }}>
                 🎯 Active Filters:
               </div>
               <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                 {filters.search && (
                   <span style={{
                     padding: '0.5rem 0.75rem',
                     backgroundColor: '#007bff',
                     color: 'white',
                     borderRadius: '20px',
                     fontSize: '0.75rem',
                     fontWeight: '500'
                   }}>
                     🔍 "{filters.search}"
                   </span>
                 )}
                 {filters.status && (
                   <span style={{
                     padding: '0.5rem 0.75rem',
                     backgroundColor: '#28a745',
                     color: 'white',
                     borderRadius: '20px',
                     fontSize: '0.75rem',
                     fontWeight: '500'
                   }}>
                     📊 {filters.status}
                   </span>
                 )}
                 {filters.priority && (
                   <span style={{
                     padding: '0.5rem 0.75rem',
                     backgroundColor: '#ffc107',
                     color: '#212529',
                     borderRadius: '20px',
                     fontSize: '0.75rem',
                     fontWeight: '500'
                   }}>
                     ⚡ {filters.priority}
                   </span>
                 )}
                 {filters.category && (
                   <span style={{
                     padding: '0.5rem 0.75rem',
                     backgroundColor: '#6f42c1',
                     color: 'white',
                     borderRadius: '20px',
                     fontSize: '0.75rem',
                     fontWeight: '500'
                   }}>
                     📁 {filters.category}
                   </span>
                 )}
                 <button
                   onClick={() => {
                     setFilters({
                       search: '',
                       status: '',
                       priority: '',
                       category: '',
                       page: 1,
                       limit: 20,
                       sortBy: 'createdAt',
                       sortOrder: 'desc'
                     });
                   }}
                   style={{
                     padding: '0.5rem 0.75rem',
                     backgroundColor: '#dc3545',
                     color: 'white',
                     border: 'none',
                     borderRadius: '20px',
                     fontSize: '0.75rem',
                     fontWeight: '500',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
                   }}
                   onMouseEnter={(e) => {
                     e.target.style.transform = 'scale(1.05)';
                     e.target.style.backgroundColor = '#c82333';
                   }}
                   onMouseLeave={(e) => {
                     e.target.style.transform = 'scale(1)';
                     e.target.style.backgroundColor = '#dc3545';
                   }}
                 >
                   🗑️ Clear All
                 </button>
               </div>
             </div>
           )}
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
           marginBottom: '2rem',
           position: 'relative',
           overflow: 'hidden'
         }}>
           {/* Background Pattern */}
           <div style={{
             position: 'absolute',
             top: '-50%',
             left: '-50%',
             width: '200%',
             height: '200%',
             background: 'radial-gradient(circle, rgba(102, 126, 234, 0.03) 0%, transparent 70%)',
             pointerEvents: 'none'
           }} />
           
           <div style={{ position: 'relative', zIndex: 1 }}>
             {/* Form Header */}
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: '1rem', 
               marginBottom: '2rem',
               paddingBottom: '1.5rem',
               borderBottom: '2px solid #f0f0f0'
             }}>
               <div style={{
                 width: '50px',
                 height: '50px',
                 borderRadius: '15px',
                 background: editingTask ? 'linear-gradient(135deg, #ffc107, #ff9800)' : 'linear-gradient(135deg, #28a745, #20c997)',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 color: 'white',
                 fontSize: '1.5rem',
                 fontWeight: 'bold'
               }}>
                 {editingTask ? '✏️' : '➕'}
               </div>
               <div>
                 <h3 style={{ 
                   fontSize: '1.75rem', 
                   fontWeight: '700', 
                   color: '#333', 
                   margin: '0 0 0.25rem 0' 
                 }}>
                   {editingTask ? 'Edit Task' : 'Create New Task'}
                 </h3>
                 <p style={{ 
                   fontSize: '1rem', 
                   color: '#666', 
                   margin: 0,
                   fontWeight: '400'
                 }}>
                   {editingTask ? 'Update your task details below' : 'Fill in the details to create your new task'}
                 </p>
               </div>
             </div>
             
             <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask}>
               {/* Title and Category Row */}
               <div style={{ 
                 display: 'grid', 
                 gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                 gap: '1.5rem',
                 marginBottom: '1.5rem'
               }}>
                 <div>
                   <label style={{ 
                     display: 'block', 
                     marginBottom: '0.75rem', 
                     fontSize: '0.95rem', 
                     fontWeight: '600', 
                     color: '#495057' 
                   }}>
                     📝 Task Title *
                   </label>
                   <input
                     type="text"
                     name="title"
                     value={formData.title}
                     onChange={handleFormChange}
                     placeholder="Enter a descriptive task title..."
                     required
                     style={{
                       width: '100%',
                       padding: '1rem 1.25rem',
                       border: '2px solid #e9ecef',
                       borderRadius: '15px',
                       fontSize: '1rem',
                       transition: 'all 0.3s ease',
                       backgroundColor: '#fff'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#667eea';
                       e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#e9ecef';
                       e.target.style.boxShadow = 'none';
                     }}
                   />
                 </div>
                 
                 <div>
                   <label style={{ 
                     display: 'block', 
                     marginBottom: '0.75rem', 
                     fontSize: '0.95rem', 
                     fontWeight: '600', 
                     color: '#495057' 
                   }}>
                     📁 Category
                   </label>
                   <input
                     type="text"
                     name="category"
                     value={formData.category}
                     onChange={handleFormChange}
                     placeholder="e.g., Work, Personal, Study..."
                     style={{
                       width: '100%',
                       padding: '1rem 1.25rem',
                       border: '2px solid #e9ecef',
                       borderRadius: '15px',
                       fontSize: '1rem',
                       transition: 'all 0.3s ease',
                       backgroundColor: '#fff'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#667eea';
                       e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#e9ecef';
                       e.target.style.boxShadow = 'none';
                     }}
                   />
                 </div>
               </div>
               
               {/* Description */}
               <div style={{ marginBottom: '1.5rem' }}>
                 <label style={{ 
                   display: 'block', 
                   marginBottom: '0.75rem', 
                   fontSize: '0.95rem', 
                   fontWeight: '600', 
                   color: '#495057' 
                 }}>
                   📄 Description
                 </label>
                 <textarea
                   name="description"
                   value={formData.description}
                   onChange={handleFormChange}
                   placeholder="Describe what needs to be done..."
                   rows="4"
                   style={{
                     width: '100%',
                     padding: '1rem 1.25rem',
                     border: '2px solid #e9ecef',
                     borderRadius: '15px',
                     fontSize: '1rem',
                     transition: 'all 0.3s ease',
                     backgroundColor: '#fff',
                     resize: 'vertical',
                     minHeight: '120px'
                   }}
                   onFocus={(e) => {
                     e.target.style.borderColor = '#667eea';
                     e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                   }}
                   onBlur={(e) => {
                     e.target.style.borderColor = '#e9ecef';
                     e.target.style.boxShadow = 'none';
                   }}
                 />
               </div>
               
               {/* Priority, Status, Due Date Row */}
               <div style={{ 
                 display: 'grid', 
                 gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                 gap: '1.5rem',
                 marginBottom: '1.5rem'
               }}>
                 <div>
                   <label style={{ 
                     display: 'block', 
                     marginBottom: '0.75rem', 
                     fontSize: '0.95rem', 
                     fontWeight: '600', 
                     color: '#495057' 
                   }}>
                     ⚡ Priority
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
                       transition: 'all 0.3s ease',
                       backgroundColor: '#fff',
                       cursor: 'pointer'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#667eea';
                       e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#e9ecef';
                       e.target.style.boxShadow = 'none';
                     }}
                   >
                     <option value="low">🟢 Low Priority</option>
                     <option value="medium">🟡 Medium Priority</option>
                     <option value="high">🔴 High Priority</option>
                   </select>
                 </div>
                 
                 <div>
                   <label style={{ 
                     display: 'block', 
                     marginBottom: '0.75rem', 
                     fontSize: '0.95rem', 
                     fontWeight: '600', 
                     color: '#495057' 
                   }}>
                     📊 Status
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
                       transition: 'all 0.3s ease',
                       backgroundColor: '#fff',
                       cursor: 'pointer'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#667eea';
                       e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#e9ecef';
                       e.target.style.boxShadow = 'none';
                     }}
                   >
                     <option value="pending">⏳ Pending</option>
                     <option value="in-progress">🔄 In Progress</option>
                     <option value="completed">✅ Completed</option>
                     <option value="cancelled">❌ Cancelled</option>
                   </select>
                 </div>
                 
                 <div>
                   <label style={{ 
                     display: 'block', 
                     marginBottom: '0.75rem', 
                     fontSize: '0.95rem', 
                     fontWeight: '600', 
                     color: '#495057' 
                   }}>
                     📅 Due Date
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
                       fontSize: '1rem',
                       transition: 'all 0.3s ease',
                       backgroundColor: '#fff',
                       cursor: 'pointer'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#667eea';
                       e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#e9ecef';
                       e.target.style.boxShadow = 'none';
                     }}
                   />
                 </div>
               </div>
               
               {/* Tags and Stickers Row */}
               <div style={{ 
                 display: 'grid', 
                 gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                 gap: '1.5rem',
                 marginBottom: '1.5rem'
               }}>
                 <div>
                   <label style={{ 
                     display: 'block', 
                     marginBottom: '0.75rem', 
                     fontSize: '0.95rem', 
                     fontWeight: '600', 
                     color: '#495057' 
                   }}>
                     🏷️ Tags
                   </label>
                   <input
                     type="text"
                     name="tags"
                     value={formData.tags}
                     onChange={handleFormChange}
                     placeholder="work, personal, urgent (comma-separated)"
                     style={{
                       width: '100%',
                       padding: '1rem 1.25rem',
                       border: '2px solid #e9ecef',
                       borderRadius: '15px',
                       fontSize: '1rem',
                       transition: 'all 0.3s ease',
                       backgroundColor: '#fff'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#667eea';
                       e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#e9ecef';
                       e.target.style.boxShadow = 'none';
                     }}
                   />
                   
                   {/* Hashtag Selection for Task */}
                   <div style={{ marginTop: '1rem' }}>
                     <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem', fontWeight: '500' }}>
                       💡 Quick hashtag selection:
                     </p>
                     <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                       {['#work', '#personal', '#urgent', '#fun', '#study', '#health', '#finance', '#travel'].map((hashtag) => (
                         <button
                           key={hashtag}
                           type="button"
                           onClick={() => {
                             const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [];
                             if (!currentTags.includes(hashtag)) {
                               const newTags = [...currentTags, hashtag];
                               setFormData(prev => ({
                                 ...prev,
                                 tags: newTags.join(', ')
                               }));
                             }
                           }}
                           style={{
                             fontSize: '0.75rem',
                             padding: '0.5rem 0.75rem',
                             border: '2px solid #667eea',
                             borderRadius: '20px',
                             background: 'white',
                             color: '#667eea',
                             cursor: 'pointer',
                             transition: 'all 0.2s',
                             fontWeight: '600'
                           }}
                           onMouseEnter={(e) => {
                             e.target.style.transform = 'scale(1.05)';
                             e.target.style.background = '#667eea';
                             e.target.style.color = 'white';
                             e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                           }}
                           onMouseLeave={(e) => {
                             e.target.style.transform = 'scale(1)';
                             e.target.style.background = 'white';
                             e.target.style.color = '#667eea';
                             e.target.style.boxShadow = 'none';
                           }}
                         >
                           {hashtag}
                         </button>
                       ))}
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <label style={{ 
                     display: 'block', 
                     marginBottom: '0.75rem', 
                     fontSize: '0.95rem', 
                     fontWeight: '600', 
                     color: '#495057' 
                   }}>
                     🎨 Stickers
                   </label>
                   <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                     <input
                       type="text"
                       name="stickers"
                       value={formData.stickers}
                       onChange={handleFormChange}
                       placeholder="sticker URLs (comma-separated)"
                       style={{ 
                         flex: 1,
                         padding: '1rem 1.25rem',
                         border: '2px solid #e9ecef',
                         borderRadius: '15px',
                         fontSize: '1rem',
                         transition: 'all 0.3s ease',
                         backgroundColor: '#fff'
                       }}
                       onFocus={(e) => {
                         e.target.style.borderColor = '#667eea';
                         e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                       }}
                       onBlur={(e) => {
                         e.target.style.borderColor = '#e9ecef';
                         e.target.style.boxShadow = 'none';
                       }}
                     />
                     <button
                       type="button"
                       onClick={() => setShowStickerSection(!showStickerSection)}
                       style={{
                         padding: '1rem 1.5rem',
                         border: '2px solid #667eea',
                         borderRadius: '15px',
                         background: showStickerSection ? '#667eea' : 'white',
                         color: showStickerSection ? 'white' : '#667eea',
                         fontSize: '1rem',
                         fontWeight: '600',
                         cursor: 'pointer',
                         transition: 'all 0.3s ease',
                         whiteSpace: 'nowrap',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '0.5rem'
                       }}
                       onMouseEnter={(e) => {
                         e.target.style.transform = 'translateY(-2px)';
                         e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                       }}
                       onMouseLeave={(e) => {
                         e.target.style.transform = 'translateY(0)';
                         e.target.style.boxShadow = 'none';
                       }}
                     >
                       {showStickerSection ? '🔒 Hide Tools' : '🎨 Sticker Tools'}
                     </button>
                   </div>
                 
                                    {/* Sticker Tools Section */}
                   {showStickerSection && (
                     <div style={{ 
                       border: '2px solid #e9ecef', 
                       borderRadius: '16px', 
                       padding: '1.5rem', 
                       backgroundColor: '#f8f9fa',
                       marginTop: '1rem'
                     }}>
                       {/* Sticker Search */}
                       <div style={{ marginBottom: '1.5rem' }}>
                         <h5 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#333' }}>🔍 Search Stickers</h5>
                         <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                           <input
                             type="text"
                             placeholder="Search for stickers (e.g., 'cute cat sticker', 'emoji', 'cartoon icon')"
                             value={stickerSearchQuery}
                             onChange={(e) => setStickerSearchQuery(e.target.value)}
                             style={{ 
                               flex: 1, 
                               fontSize: '1rem',
                               padding: '0.875rem 1rem',
                               border: '2px solid #e9ecef',
                               borderRadius: '12px',
                               transition: 'all 0.3s ease'
                             }}
                             onKeyPress={(e) => {
                               if (e.key === 'Enter') {
                                 searchStickers();
                               }
                             }}
                           />
                           <button
                             type="button"
                             onClick={searchStickers}
                             disabled={!stickerSearchQuery.trim() || stickerSearchLoading}
                             style={{ 
                               fontSize: '1rem', 
                               padding: '0.875rem 1.5rem',
                               border: 'none',
                               borderRadius: '12px',
                               background: 'linear-gradient(135deg, #667eea, #764ba2)',
                               color: 'white',
                               fontWeight: '600',
                               cursor: 'pointer',
                               transition: 'all 0.3s ease'
                             }}
                             onMouseEnter={(e) => {
                               e.target.style.transform = 'translateY(-2px)';
                               e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                             }}
                             onMouseLeave={(e) => {
                               e.target.style.transform = 'translateY(0)';
                               e.target.style.boxShadow = 'none';
                             }}
                           >
                             {stickerSearchLoading ? '🔍 Searching...' : '🔍 Search'}
                           </button>
                         </div>
                         

                         
                         {stickerSearchLoading && (
                           <div style={{ 
                             textAlign: 'center', 
                             padding: '1rem',
                             backgroundColor: 'white',
                             borderRadius: '12px',
                             border: '2px dashed #dee2e6',
                             marginTop: '1rem'
                           }}>
                             <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                             <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Searching for stickers...</p>
                           </div>
                         )}
                         
                         {stickerSearchResults.length > 0 && (
                           <div style={{ marginTop: '1.5rem' }}>
                             <h6 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#333', fontWeight: '600' }}>
                               🎯 Found Stickers ({Math.min(stickerSearchResults.length, 5)} of {stickerSearchResults.length})
                             </h6>
                             <div style={{ 
                               display: 'grid', 
                               gridTemplateColumns: 'repeat(5, 1fr)', 
                               gap: '1rem',
                               padding: '1.5rem',
                               backgroundColor: 'white',
                               borderRadius: '16px',
                               border: '2px dashed #dee2e6'
                             }}>
                               {stickerSearchResults.slice(0, 5).map((sticker, index) => (
                                 <div key={index} style={{ textAlign: 'center' }}>
                                   <div
                                     style={{
                                       width: '70px',
                                       height: '70px',
                                       borderRadius: '20px',
                                       cursor: 'pointer',
                                       border: '3px solid #fff',
                                       transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                       backgroundColor: '#fff',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                       overflow: 'hidden',
                                       position: 'relative',
                                       margin: '0 auto'
                                     }}
                                     onClick={() => {
                                       console.log('Sticker clicked:', sticker);
                                       handleStickerClick(sticker);
                                     }}
                                     onMouseEnter={(e) => {
                                       e.target.style.transform = 'scale(1.1) rotate(2deg)';
                                       e.target.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.4)';
                                       e.target.style.borderColor = '#667eea';
                                     }}
                                     onMouseLeave={(e) => {
                                       e.target.style.transform = 'scale(1) rotate(0deg)';
                                       e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
                                       e.target.style.borderColor = '#fff';
                                     }}
                                     title="Click to view sticker"
                                   >
                                     <img 
                                       src={sticker.image?.source || sticker.url} 
                                       alt={sticker.title || `Sticker ${index + 1}`} 
                                       style={{ 
                                         width: '100%', 
                                         height: '100%', 
                                         objectFit: 'cover',
                                         borderRadius: '17px'
                                       }} 
                                       onError={(e) => {
                                         e.target.style.display = 'none';
                                         e.target.nextSibling.style.display = 'flex';
                                       }}
                                     />
                                     {/* Fallback icon for broken images */}
                                     <div 
                                       style={{
                                         display: 'none',
                                         width: '100%',
                                         height: '100%',
                                         alignItems: 'center',
                                         justifyContent: 'center',
                                         fontSize: '28px',
                                         color: '#666',
                                         backgroundColor: '#f0f0f0'
                                       }}
                                     >
                                       🎨
                                     </div>
                                   </div>
                                   <div style={{ 
                                     marginTop: '0.5rem', 
                                     fontSize: '0.75rem', 
                                     color: '#666',
                                     fontWeight: '500'
                                   }}>
                                     {sticker.title?.substring(0, 12) || `Sticker ${index + 1}`}
                                   </div>
                                 </div>
                               ))}
                             </div>
                             {stickerSearchResults.length > 5 && (
                               <p style={{ 
                                 textAlign: 'center', 
                                 marginTop: '1rem', 
                                 fontSize: '0.875rem', 
                                 color: '#666',
                                 fontStyle: 'italic'
                               }}>
                                 Showing first 5 results. Refine your search for more specific stickers.
                               </p>
                             )}
                           </div>
                         )}
                       </div>

                       {/* AI Sticker Generation */}
                       <div style={{ marginBottom: '1.5rem' }}>
                         <h5 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#333' }}>🤖 Generate AI Sticker</h5>
                         <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                           <input
                             type="text"
                             placeholder="Describe your sticker (e.g., 'cute cartoon cat')"
                             value={aiPrompt}
                             onChange={(e) => setAiPrompt(e.target.value)}
                             style={{ 
                               flex: 1, 
                               fontSize: '1rem',
                               padding: '0.875rem 1rem',
                               border: '2px solid #e9ecef',
                               borderRadius: '12px',
                               transition: 'all 0.3s ease'
                             }}
                           />
                           <select
                             value={aiStyle}
                             onChange={(e) => setAiStyle(e.target.value)}
                             style={{ 
                               width: '120px', 
                               fontSize: '1rem',
                               padding: '0.875rem 1rem',
                               border: '2px solid #e9ecef',
                               borderRadius: '12px',
                               transition: 'all 0.3s ease',
                               cursor: 'pointer'
                             }}
                           >
                             <option value="sticker">🎨 Sticker</option>
                             <option value="cartoon">🎭 Cartoon</option>
                             <option value="emoji">😊 Emoji</option>
                             <option value="minimal">⚪ Minimal</option>
                           </select>
                           <button
                             type="button"
                             onClick={generateAISticker}
                             disabled={!aiPrompt.trim() || aiGenerationLoading}
                             style={{ 
                               fontSize: '1rem', 
                               padding: '0.875rem 1.5rem',
                               border: 'none',
                               borderRadius: '12px',
                               background: 'linear-gradient(135deg, #28a745, #20c997)',
                               color: 'white',
                               fontWeight: '600',
                               cursor: 'pointer',
                               transition: 'all 0.3s ease'
                             }}
                             onMouseEnter={(e) => {
                               e.target.style.transform = 'translateY(-2px)';
                               e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                             }}
                             onMouseLeave={(e) => {
                               e.target.style.transform = 'translateY(0)';
                               e.target.style.boxShadow = 'none';
                             }}
                           >
                             {aiGenerationLoading ? '🤖 Generating...' : '🤖 Generate'}
                           </button>
                         </div>
                         
                         {aiGenerationLoading && (
                           <div style={{ 
                             textAlign: 'center', 
                             padding: '1.5rem',
                             backgroundColor: 'white',
                             borderRadius: '16px',
                             border: '2px dashed #dee2e6'
                           }}>
                             <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                             <p style={{ color: '#666', fontSize: '1rem', margin: 0, fontWeight: '500' }}>Generating your AI sticker...</p>
                           </div>
                         )}
                         
                         {generatedSticker && (
                           <div style={{ marginTop: '1.5rem' }}>
                             <h6 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#28a745', fontWeight: '600' }}>
                               ✨ AI Generated Sticker
                             </h6>
                             <div style={{ 
                               display: 'flex', 
                               alignItems: 'center', 
                               gap: '1.5rem',
                               padding: '1.5rem',
                               backgroundColor: 'white',
                               borderRadius: '16px',
                               border: '2px dashed #28a745'
                             }}>
                               <div
                                 style={{
                                   width: '80px',
                                   height: '80px',
                                   borderRadius: '22px',
                                   cursor: 'pointer',
                                   border: '4px solid #28a745',
                                   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                   backgroundColor: '#fff',
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   boxShadow: '0 6px 25px rgba(40, 167, 69, 0.3)',
                                   overflow: 'hidden',
                                   position: 'relative'
                                 }}
                                 onClick={() => handleStickerClick({
                                   image: { source: generatedSticker },
                                   url: generatedSticker,
                                   title: 'AI Generated Sticker'
                                 })}
                                 onMouseEnter={(e) => {
                                   e.target.style.transform = 'scale(1.1) rotate(-2deg)';
                                   e.target.style.boxShadow = '0 10px 35px rgba(40, 167, 69, 0.5)';
                                 }}
                                 onMouseLeave={(e) => {
                                   e.target.style.transform = 'scale(1) rotate(0deg)';
                                   e.target.style.boxShadow = '0 6px 25px rgba(40, 167, 69, 0.3)';
                                 }}
                                 title="Click to view sticker"
                               >
                                 <img 
                                   src={generatedSticker} 
                                   alt="Generated Sticker" 
                                   style={{ 
                                     width: '100%', 
                                     height: '100%', 
                                     objectFit: 'contain',
                                     padding: '0.5rem'
                                   }} 
                                 />
                               </div>
                               <div style={{ flex: 1 }}>
                                 <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                   <button
                                     type="button"
                                     onClick={() => {
                                       console.log('AI Sticker - Adding URL:', generatedSticker);
                                       addStickerToTask(generatedSticker);
                                     }}
                                     style={{ 
                                       fontSize: '0.875rem', 
                                       padding: '0.75rem 1.25rem', 
                                       borderRadius: '20px',
                                       border: 'none',
                                       cursor: 'pointer',
                                       transition: 'all 0.3s',
                                       background: 'linear-gradient(135deg, #28a745, #20c997)',
                                       color: 'white',
                                       fontWeight: '600',
                                       boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                                     }}
                                     onMouseEnter={(e) => {
                                       e.target.style.transform = 'translateY(-2px)';
                                       e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                                     }}
                                     onMouseLeave={(e) => {
                                       e.target.style.transform = 'translateY(0)';
                                       e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                                     }}
                                   >
                                     ✨ Add to Task
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => setGeneratedSticker(null)}
                                     style={{ 
                                       fontSize: '0.875rem', 
                                       padding: '0.75rem 1.25rem',
                                       borderRadius: '20px',
                                       border: '2px solid #dee2e6',
                                       background: 'white',
                                       cursor: 'pointer',
                                       transition: 'all 0.3s',
                                       color: '#666'
                                     }}
                                     onMouseEnter={(e) => {
                                       e.target.style.borderColor = '#28a745';
                                       e.target.style.backgroundColor = '#f8f9fa';
                                       e.target.style.color = '#28a745';
                                     }}
                                     onMouseLeave={(e) => {
                                       e.target.style.borderColor = '#dee2e6';
                                       e.target.style.backgroundColor = 'white';
                                       e.target.style.color = '#666';
                                     }}
                                   >
                                     🗑️ Clear
                                   </button>
                                 </div>
                               </div>
                             </div>
                           </div>
                         )}
                       </div>

                                               {/* Current Task Stickers Preview */}
                        <div>
                          <h5 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#333' }}>📝 Current Stickers:</h5>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', minHeight: '40px' }}>
                            {formData.stickers ? (
                              formData.stickers.split(',').map((sticker, index) => {
                                const trimmedSticker = sticker.trim();
                                if (!trimmedSticker || trimmedSticker === '[object Object]') return null;
                                
                                return (
                                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        backgroundColor: '#f8f9fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                                        overflow: 'hidden',
                                        border: '2px solid #e9ecef',
                                        position: 'relative'
                                      }}
                                    >
                                      <img 
                                        src={trimmedSticker} 
                                        alt={`Sticker ${index + 1}`} 
                                        style={{ 
                                          width: '100%', 
                                          height: '100%', 
                                          objectFit: 'cover',
                                          borderRadius: '10px'
                                        }} 
                                        onError={(e) => {
                                          console.error('Failed to load sticker:', trimmedSticker);
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                        onLoad={() => {
                                          console.log('Sticker loaded successfully:', trimmedSticker);
                                        }}
                                      />
                                      {/* Fallback icon for broken images */}
                                      <div 
                                        style={{
                                          display: 'none',
                                          width: '100%',
                                          height: '100%',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '16px',
                                          color: '#666',
                                          backgroundColor: '#f0f0f0'
                                        }}
                                      >
                                        🎨
                                      </div>
                                    </div>
                                    {/* Remove button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const stickers = formData.stickers.split(',').filter((_, i) => i !== index).join(',');
                                        setFormData(prev => ({ ...prev, stickers }));
                                      }}
                                      style={{ 
                                        padding: '0.25rem 0.5rem', 
                                        fontSize: '0.75rem',
                                        borderRadius: '50%',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        minWidth: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'linear-gradient(135deg, #dc3545, #c82333)',
                                        color: 'white',
                                        fontWeight: 'bold'
                                      }}
                                      title="Remove sticker"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              }).filter(Boolean)
                            ) : (
                              <span style={{ color: '#666', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                No stickers added yet. Search or generate some above!
                              </span>
                            )}
                          </div>
                        </div>
                     </div>
                   )}
                 </div>
               </div>
               
               {/* Form Action Buttons */}
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
                     background: editingTask ? 'linear-gradient(135deg, #ffc107, #ff9800)' : 'linear-gradient(135deg, #28a745, #20c997)',
                     color: 'white',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.5rem'
                   }}
                   onMouseEnter={(e) => {
                     e.target.style.transform = 'translateY(-2px)';
                     e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.3)';
                   }}
                   onMouseLeave={(e) => {
                     e.target.style.transform = 'translateY(0)';
                     e.target.style.boxShadow = 'none';
                   }}
                 >
                   {editingTask ? '✏️ Update Task' : '➕ Create Task'}
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
                   onMouseEnter={(e) => {
                     e.target.style.background = '#6c757d';
                     e.target.style.color = 'white';
                     e.target.style.transform = 'translateY(-2px)';
                   }}
                   onMouseLeave={(e) => {
                     e.target.style.background = 'white';
                     e.target.style.color = '#6c757d';
                     e.target.style.transform = 'translateY(0)';
                   }}
                 >
                   ❌ Cancel
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

             {/* Tasks List */}
       {tasks.length === 0 ? (
         <div style={{
           textAlign: 'center',
           padding: '4rem 2rem',
           backgroundColor: '#f8f9fa',
           borderRadius: '20px',
           border: '2px dashed #dee2e6',
           marginTop: '2rem'
         }}>
           <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📝</div>
           <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.5rem', fontWeight: '600' }}>
             No tasks found
           </h3>
           <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
             Create your first task to get started!
           </p>
         </div>
       ) : (
         <div style={{ marginTop: '2rem' }}>
           <div style={{ 
             display: 'flex', 
             justifyContent: 'space-between', 
             alignItems: 'center', 
             marginBottom: '1.5rem',
             padding: '0 0.5rem'
           }}>
             <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', margin: 0 }}>
               📋 Task List ({tasks.length} tasks)
             </h3>
             <div style={{ 
               display: 'flex', 
               gap: '0.5rem', 
               fontSize: '0.875rem', 
               color: '#666' 
             }}>
               <span>🔄 Last updated: {new Date().toLocaleTimeString()}</span>
             </div>
           </div>
           
           <div style={{ 
             display: 'grid', 
             gap: '1.5rem',
             gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
           }}>
             {tasks.map((task) => (
               <div key={task._id} style={{
                 backgroundColor: 'white',
                 borderRadius: '20px',
                 padding: '1.5rem',
                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 backdropFilter: 'blur(10px)',
                 transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                 position: 'relative',
                 overflow: 'hidden'
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
                 {/* Priority and Status Badges */}
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
                       backgroundColor: getPriorityColor(task.priority) + '15',
                       color: getPriorityColor(task.priority),
                       border: `2px solid ${getPriorityColor(task.priority)}30`
                     }}>
                       {task.priority}
                     </span>
                     <span style={{
                       padding: '0.5rem 1rem',
                       borderRadius: '25px',
                       fontSize: '0.75rem',
                       fontWeight: '600',
                       textTransform: 'uppercase',
                       letterSpacing: '0.5px',
                       backgroundColor: getStatusColor(task.status) + '15',
                       color: getStatusColor(task.status),
                       border: `2px solid ${getStatusColor(task.status)}30`
                     }}>
                       {task.status}
                     </span>
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
                     {task.status !== 'completed' && (
                       <button
                         onClick={() => handleCompleteTask(task._id)}
                         style={{
                           padding: '0.5rem',
                           borderRadius: '50%',
                           border: 'none',
                           cursor: 'pointer',
                           transition: 'all 0.2s',
                           background: 'linear-gradient(135deg, #28a745, #20c997)',
                           color: 'white',
                           fontSize: '1rem',
                           width: '36px',
                           height: '36px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                         }}
                         onMouseEnter={(e) => {
                           e.target.style.transform = 'scale(1.1)';
                           e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                         }}
                         onMouseLeave={(e) => {
                           e.target.style.transform = 'scale(1)';
                           e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                         }}
                         title="Mark as complete"
                       >
                         ✓
                       </button>
                     )}
                     <button
                       onClick={() => handleEditTask(task)}
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
                       onMouseEnter={(e) => {
                         e.target.style.transform = 'scale(1.1)';
                         e.target.style.backgroundColor = '#007bff';
                         e.target.style.color = 'white';
                       }}
                       onMouseLeave={(e) => {
                         e.target.style.transform = 'scale(1)';
                         e.target.style.backgroundColor = 'white';
                         e.target.style.color = '#007bff';
                       }}
                       title="Edit task"
                     >
                       ✏️
                     </button>
                     <button
                       onClick={() => handleDeleteTask(task._id)}
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
                       onMouseEnter={(e) => {
                         e.target.style.transform = 'scale(1.1)';
                         e.target.style.backgroundColor = '#dc3545';
                         e.target.style.color = 'white';
                       }}
                       onMouseLeave={(e) => {
                         e.target.style.transform = 'scale(1)';
                         e.target.style.backgroundColor = 'white';
                         e.target.style.color = '#dc3545';
                       }}
                       title="Delete task"
                     >
                       🗑️
                     </button>
                   </div>
                 </div>
                 
                 {/* Task Title */}
                 <h4 style={{ 
                   fontSize: '1.25rem', 
                   fontWeight: '700', 
                   color: '#333', 
                   marginBottom: '0.75rem',
                   lineHeight: '1.3'
                 }}>
                   {task.title}
                 </h4>
                 
                 {/* Task Description */}
                 {task.description && (
                   <p style={{ 
                     color: '#666', 
                     marginBottom: '1rem', 
                     lineHeight: '1.6',
                     fontSize: '0.95rem'
                   }}>
                     {task.description}
                   </p>
                 )}
                 
                 {/* Task Metadata */}
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
                   {task.category && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <span style={{ fontSize: '1.2rem' }}>📁</span>
                       <span style={{ fontSize: '0.875rem', color: '#495057', fontWeight: '500' }}>
                         {task.category}
                       </span>
                     </div>
                   )}
                   {task.dueDate && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <span style={{ fontSize: '1.2rem' }}>📅</span>
                       <span style={{ fontSize: '0.875rem', color: '#495057', fontWeight: '500' }}>
                         {new Date(task.dueDate).toLocaleDateString('en-US', { 
                           weekday: 'short', 
                           year: 'numeric', 
                           month: 'short', 
                           day: 'numeric' 
                         })}
                       </span>
                     </div>
                   )}
                   {task.tags && task.tags.length > 0 && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <span style={{ fontSize: '1.2rem' }}>🏷️</span>
                       <span style={{ fontSize: '0.875rem', color: '#495057', fontWeight: '500' }}>
                         {task.tags.slice(0, 3).join(', ')}
                         {task.tags.length > 3 && ` +${task.tags.length - 3} more`}
                       </span>
                     </div>
                   )}
                 </div>
                 
                 {/* Stickers Display */}
                 {task.stickers && task.stickers.length > 0 && (
                   <div style={{ 
                     marginTop: '0.75rem',
                     padding: '0.75rem',
                     backgroundColor: '#fff3cd',
                     borderRadius: '12px',
                     border: '1px solid #ffeaa7'
                   }}>
                     <div style={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       gap: '0.5rem', 
                       marginBottom: '0.5rem' 
                     }}>
                       <span style={{ fontSize: '1.1rem' }}>🎨</span>
                       <span style={{ 
                         fontSize: '0.875rem', 
                         color: '#856404', 
                         fontWeight: '600' 
                       }}>
                         Stickers ({task.stickers.length})
                       </span>
                     </div>
                     <div style={{ 
                       display: 'flex', 
                       gap: '0.5rem', 
                       flexWrap: 'wrap' 
                     }}>
                       {task.stickers.map((sticker, index) => (
                         <div
                           key={index}
                           style={{
                             width: '32px',
                             height: '32px',
                             borderRadius: '8px',
                             overflow: 'hidden',
                             border: '2px solid #fff',
                             boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                             transition: 'all 0.2s ease'
                           }}
                           onMouseEnter={(e) => {
                             e.target.style.transform = 'scale(1.2)';
                             e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                           }}
                           onMouseLeave={(e) => {
                             e.target.style.transform = 'scale(1)';
                             e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                           }}
                         >
                           <img 
                             src={sticker} 
                             alt={`Sticker ${index + 1}`} 
                             style={{ 
                               width: '100%', 
                               height: '100%', 
                               objectFit: 'cover'
                             }} 
                           />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                                   {/* Task Footer */}
                  <div style={{ 
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e9ecef',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                      Created: {new Date(task.createdAt || Date.now()).toLocaleDateString()}
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
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleCompleteTask(task._id)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: 'linear-gradient(135deg, #28a745, #20c997)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          ✓ Complete Task
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Update Task Button */}
                  <div style={{ 
                    marginTop: '1rem',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => handleEditTask(task)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '25px',
                        border: '2px solid #667eea',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-3px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                        e.target.style.borderColor = '#5a6fd8';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                        e.target.style.borderColor = '#667eea';
                      }}
                      title="Update this task"
                    >
                      ✏️ Update Task
                    </button>
                  </div>
               </div>
             ))}
           </div>
         </div>
       )}

             {/* Pagination */}
       {pagination.totalPages > 1 && (
         <div style={{ 
           display: 'flex', 
           justifyContent: 'center', 
           alignItems: 'center', 
           gap: '1rem',
           marginTop: '3rem',
           padding: '2rem',
           backgroundColor: 'white',
           borderRadius: '20px',
           boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
           border: '1px solid rgba(255, 255, 255, 0.2)'
         }}>
           <button
             onClick={() => handlePageChange(pagination.currentPage - 1)}
             disabled={!pagination.hasPrevPage}
             style={{
               padding: '0.75rem 1.5rem',
               border: '2px solid #007bff',
               borderRadius: '25px',
               background: pagination.hasPrevPage ? 'white' : '#f8f9fa',
               color: pagination.hasPrevPage ? '#007bff' : '#6c757d',
               cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
               fontSize: '0.95rem',
               fontWeight: '600',
               transition: 'all 0.3s ease',
               display: 'flex',
               alignItems: 'center',
               gap: '0.5rem'
             }}
             onMouseEnter={(e) => {
               if (pagination.hasPrevPage) {
                 e.target.style.background = '#007bff';
                 e.target.style.color = 'white';
                 e.target.style.transform = 'translateY(-2px)';
                 e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';
               }
             }}
             onMouseLeave={(e) => {
               if (pagination.hasPrevPage) {
                 e.target.style.background = 'white';
                 e.target.style.color = '#007bff';
                 e.target.style.transform = 'translateY(0)';
                 e.target.style.boxShadow = 'none';
               }
             }}
           >
             ← Previous
           </button>
           
           <div style={{ 
             display: 'flex', 
             alignItems: 'center', 
             gap: '0.5rem',
             padding: '0.75rem 1.5rem',
             backgroundColor: '#f8f9fa',
             borderRadius: '25px',
             border: '2px solid #e9ecef'
           }}>
             <span style={{ 
               fontSize: '0.95rem', 
               fontWeight: '600', 
               color: '#495057' 
             }}>
               📄 Page {pagination.currentPage} of {pagination.totalPages}
             </span>
           </div>
           
           <button
             onClick={() => handlePageChange(pagination.currentPage + 1)}
             disabled={!pagination.hasNextPage}
             style={{
               padding: '0.75rem 1.5rem',
               border: '2px solid #007bff',
               borderRadius: '25px',
               background: pagination.hasNextPage ? 'white' : '#f8f9fa',
               color: pagination.hasNextPage ? '#007bff' : '#6c757d',
               cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
               fontSize: '0.95rem',
               fontWeight: '600',
               transition: 'all 0.3s ease',
               display: 'flex',
               alignItems: 'center',
               gap: '0.5rem'
             }}
             onMouseEnter={(e) => {
               if (pagination.hasNextPage) {
                 e.target.style.background = '#007bff';
                 e.target.style.color = 'white';
                 e.target.style.transform = 'translateY(-2px)';
                 e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';
               }
             }}
             onMouseLeave={(e) => {
               if (pagination.hasNextPage) {
                 e.target.style.background = 'white';
                 e.target.style.color = '#007bff';
                 e.target.style.transform = 'translateY(0)';
                 e.target.style.boxShadow = 'none';
               }
             }}
           >
             Next →
           </button>
         </div>
       )}

      {/* Sticker Modal */}
      {showStickerModal && selectedSticker && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}
          onClick={closeStickerModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeStickerModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              ×
            </button>

            {/* Sticker Image */}
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={selectedSticker.image?.source || selectedSticker.url} 
                alt={selectedSticker.title || 'Sticker'} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  padding: '1rem'
                }} 
              />
            </div>

            {/* Sticker Info */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: '#333'
              }}>
                {selectedSticker.title || 'Sticker'}
              </h3>
              <p style={{ 
                margin: 0, 
                color: '#666', 
                fontSize: '0.875rem' 
              }}>
                Click "Add to Task" to include this sticker
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                             <button
                 onClick={() => {
                  const stickerUrl = selectedSticker.image?.source || selectedSticker.url;
                  console.log('Modal - Adding sticker URL:', stickerUrl);
                  if (stickerUrl && typeof stickerUrl === 'string') {
                    addStickerToTask(stickerUrl);
                    closeStickerModal();
                  } else {
                    setError('Invalid sticker URL');
                  }
                }}
                 className="btn btn-primary"
                style={{ 
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  borderRadius: '25px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 123, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                ✨ Add to Task
              </button>
              <button
                onClick={closeStickerModal}
                className="btn btn-outline"
                style={{ 
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  borderRadius: '25px',
                  border: '2px solid #ddd',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#999';
                  e.target.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#ddd';
                  e.target.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
