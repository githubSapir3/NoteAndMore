import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import './Events.css';

const Events = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [view, setView] = useState('month'); // 'week' or 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    location: { name: '', address: '' },
    color: '#3174ad',
    category: 'General',
    status: 'scheduled',
    recurrence: { type: 'none', interval: 1 },
    reminders: [{ type: 'notification', minutesBefore: 15 }]
  });

  const [quickEventData, setQuickEventData] = useState({
    title: '',
    date: '',
    time: '',
    allDay: false
  });
  const [showQuickEventForm, setShowQuickEventForm] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState(null);
  const [attendeeForm, setAttendeeForm] = useState({ email: '', name: '' });
  const [attendeeStatusForm, setAttendeeStatusForm] = useState({ email: '', status: 'pending' });
  const [eventFilters, setEventFilters] = useState({
    category: '',
    status: 'scheduled'
  });



  // Fetch events for current month/week
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching events for:', { view, currentDate: currentDate.toISOString(), eventFilters });
      
      let response;
      if (view === 'month') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        console.log('📅 Month view - fetching for:', { year, month });
        response = await apiClient.get(`/events/calendar/${year}/${month}`);
      } else {
        // Week view - get events for current week
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        console.log('📅 Week view - fetching for:', { 
          startOfWeek: startOfWeek.toISOString(), 
          endOfWeek: endOfWeek.toISOString() 
        });
        
        // Build query parameters with filters
        const queryParams = new URLSearchParams({
          startDate: startOfWeek.toISOString(),
          endDate: endOfWeek.toISOString()
        });
        
        if (eventFilters.category) {
          queryParams.append('category', eventFilters.category);
        }
        if (eventFilters.status) {
          queryParams.append('status', eventFilters.status);
        }
        
        response = await apiClient.get(`/events?${queryParams.toString()}`);
      }
      
      console.log('📊 API Response:', response);
      console.log('📊 Events received:', response.events?.length || 0);
      
      setEvents(response.events || []);
    } catch (err) {
      setError(err.message);
      console.error('❌ Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [view, currentDate, eventFilters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Debug events state changes
  useEffect(() => {
    console.log('📊 Events state updated:', {
      eventsCount: events.length,
      events: events.map(e => ({ id: e._id, title: e.title, startDate: e.startDate }))
    });
  }, [events]);

  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await apiClient.get('/events/upcoming?days=7');
        setUpcomingEvents(response.events || []);
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
      }
    };
    
    fetchUpcomingEvents();
  }, []);

  // Fetch single event by ID
  const fetchEventById = async (eventId) => {
    try {
      const response = await apiClient.get(`/events/${eventId}`);
      return response.event;
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to fetch event details');
      return null;
    }
  };

  // Add attendee to event
  const addAttendee = async (eventId, attendeeData) => {
    try {
      const response = await apiClient.put(`/events/${eventId}/attendees`, attendeeData);
      setSuccess('Attendee added successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh the event data
      const updatedEvent = await fetchEventById(eventId);
      if (updatedEvent) {
        setSelectedEventForAttendees(updatedEvent);
      }
      
      return response;
    } catch (err) {
      console.error('Error adding attendee:', err);
      setError(err.message || 'Failed to add attendee');
      return null;
    }
  };

  // Update attendee status
  const updateAttendeeStatus = async (eventId, email, status) => {
    try {
      const response = await apiClient.put(`/events/${eventId}/attendees/${encodeURIComponent(email)}/status`, { status });
      setSuccess('Attendee status updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh the event data
      const updatedEvent = await fetchEventById(eventId);
      if (updatedEvent) {
        setSelectedEventForAttendees(updatedEvent);
      }
      
      return response;
    } catch (err) {
      console.error('Error updating attendee status:', err);
      setError(err.message || 'Failed to update attendee status');
      return null;
    }
  };

  // Handle attendee form submission
  const handleAttendeeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventForAttendees) return;
    
    await addAttendee(selectedEventForAttendees._id, attendeeForm);
    setAttendeeForm({ email: '', name: '' });
  };

  // Handle attendee status update
  const handleAttendeeStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEventForAttendees) return;
    
    await updateAttendeeStatus(selectedEventForAttendees._id, attendeeStatusForm.email, attendeeStatusForm.status);
    setAttendeeStatusForm({ email: '', status: 'pending' });
  };

  // Open attendee management modal
  const openAttendeeModal = async (event) => {
    const fullEvent = await fetchEventById(event._id);
    if (fullEvent) {
      setSelectedEventForAttendees(fullEvent);
      setShowAttendeeModal(true);
    }
  };

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar generation functions
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Event handling functions
  const handleCreateEvent = () => {
    setSelectedEvent(null);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    setFormData({
      title: '',
      description: '',
      startDate: now.toISOString().split('T')[0],
      startTime: now.toTimeString().slice(0, 5),
      endDate: oneHourLater.toISOString().split('T')[0],
      endTime: oneHourLater.toTimeString().slice(0, 5),
      allDay: false,
      location: { name: '', address: '' },
      color: '#3174ad',
      category: 'General',
      status: 'scheduled',
      recurrence: { type: 'none', interval: 1 },
      reminders: [{ type: 'notification', minutesBefore: 15 }]
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: new Date(event.startDate).toISOString().split('T')[0],
      startTime: event.allDay ? '' : new Date(event.startDate).toTimeString().slice(0, 5),
      endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
      endTime: event.allDay ? '' : (event.endDate ? new Date(event.endDate).toTimeString().slice(0, 5) : ''),
      allDay: event.allDay,
      location: event.location || { name: '', address: '' },
      color: event.color || '#3174ad',
      category: event.category || 'General',
      status: event.status || 'scheduled',
      recurrence: event.recurrence || { type: 'none', interval: 1 },
      reminders: event.reminders || [{ type: 'notification', minutesBefore: 15 }]
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      console.log('Deleting event:', eventToDelete._id);
      await apiClient.del(`/events/${eventToDelete._id}`);
      console.log('Event deleted successfully');
      
      // Close modal and reset state on success
      setShowDeleteModal(false);
      setEventToDelete(null);
      setError(null);
      
      // Refresh events list
      await fetchEvents();
      
      console.log('Delete operation completed successfully');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete event');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Form data before validation:', formData);
      
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Event title is required');
        return;
      }

      if (!formData.startDate) {
        setError('Start date is required');
        return;
      }

      // Build event data with proper validation
      const eventData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        startDate: new Date(`${formData.startDate}T${formData.allDay ? '00:00' : (formData.startTime || '00:00')}`),
        allDay: formData.allDay,
        color: formData.color,
        category: formData.category,
        status: formData.status,
        location: {
          name: formData.location.name?.trim() || '',
          address: formData.location.address?.trim() || ''
        }
      };

      // Validate that startDate is a valid date
      if (isNaN(eventData.startDate.getTime())) {
        setError('Invalid start date');
        return;
      }

      // Add end date if provided
      if (formData.endDate) {
        eventData.endDate = new Date(`${formData.endDate}T${formData.allDay ? '23:59' : (formData.endTime || '23:59')}`);
        
        // Validate that endDate is a valid date
        if (isNaN(eventData.endDate.getTime())) {
          setError('Invalid end date');
          return;
        }
        
        // Validate end date is after start date
        if (eventData.endDate <= eventData.startDate) {
          setError('End date must be after start date');
          return;
        }
      }

      // Add recurrence if not 'none'
      if (formData.recurrence.type !== 'none') {
        eventData.recurrence = formData.recurrence;
      }

      // Add reminders if provided
      if (formData.reminders && formData.reminders.length > 0) {
        eventData.reminders = formData.reminders;
      }

      // Clean up the event data - remove undefined values and empty strings
      const cleanEventData = Object.fromEntries(
        Object.entries(eventData).filter(([key, value]) => {
          if (value === undefined || value === null) return false;
          if (typeof value === 'string' && value.trim() === '') return false;
          if (key === 'location' && (!value.name && !value.address)) return false;
          return true;
        })
      );

      // Ensure required fields are present and properly formatted
      if (!cleanEventData.title || cleanEventData.title.trim() === '') {
        setError('Event title is required');
        return;
      }

      // Check title length (assuming backend has a limit)
      if (cleanEventData.title.length > 200) {
        setError('Event title is too long. Please keep it under 200 characters.');
        return;
      }

      if (!cleanEventData.startDate) {
        setError('Start date is required');
        return;
      }

      // Ensure startDate is a valid Date object
      if (!(cleanEventData.startDate instanceof Date) || isNaN(cleanEventData.startDate.getTime())) {
        setError('Invalid start date format');
        return;
      }

      // Convert dates to ISO strings for API
      cleanEventData.startDate = cleanEventData.startDate.toISOString();
      if (cleanEventData.endDate) {
        cleanEventData.endDate = cleanEventData.endDate.toISOString();
      }

      // Clean up location object
      if (cleanEventData.location) {
        if (!cleanEventData.location.name && !cleanEventData.location.address) {
          delete cleanEventData.location;
        } else {
          cleanEventData.location = {
            name: cleanEventData.location.name || '',
            address: cleanEventData.location.address || ''
          };
        }
      }

      console.log('Sending clean event data:', cleanEventData);
      console.log('Event data types:', {
        title: typeof cleanEventData.title,
        startDate: typeof cleanEventData.startDate,
        startDateValue: cleanEventData.startDate,
        allDay: typeof cleanEventData.allDay,
        color: typeof cleanEventData.color,
        category: typeof cleanEventData.category
      });

      // Final validation before sending
      if (!cleanEventData.title || cleanEventData.title.length === 0) {
        setError('Event title cannot be empty');
        return;
      }

      if (!cleanEventData.startDate || cleanEventData.startDate.length === 0) {
        setError('Start date cannot be empty');
        return;
      }

      // Log the exact data being sent
      console.log('Final data being sent to API:', JSON.stringify(cleanEventData, null, 2));
      
      // Validate data structure before sending
      const validationErrors = [];
      if (!cleanEventData.title || cleanEventData.title.length === 0) {
        validationErrors.push('Title is required');
      }
      if (!cleanEventData.startDate || cleanEventData.startDate.length === 0) {
        validationErrors.push('Start date is required');
      }
      if (cleanEventData.startDate && cleanEventData.endDate) {
        const startDate = new Date(cleanEventData.startDate);
        const endDate = new Date(cleanEventData.endDate);
        if (startDate >= endDate) {
          validationErrors.push('End date must be after start date');
        }
      }
      
      if (validationErrors.length > 0) {
        setError(`Validation errors: ${validationErrors.join(', ')}`);
        return;
      }

      if (selectedEvent) {
        console.log('Updating event with ID:', selectedEvent._id);
        console.log('Request URL:', `/events/${selectedEvent._id}`);
        console.log('Request method: PUT');
        console.log('Request headers:', {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('authToken')}`
        });
        
        const response = await apiClient.put(`/events/${selectedEvent._id}`, cleanEventData);
        console.log('Event updated successfully:', response);
      } else {
        console.log('Creating new event');
        const response = await apiClient.post('/events', cleanEventData);
        console.log('Event created successfully:', response);
      }

      // Close modal and reset state on success
      setShowEventModal(false);
      setSelectedEvent(null);
      setError(null);
      setSuccess(selectedEvent ? 'Event updated successfully!' : 'Event created successfully!');
      
      // Refresh events list
      await fetchEvents();
      
      // Show success message (optional)
      console.log('Operation completed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Event submission error:', err);
      console.error('Error object:', {
        message: err.message,
        details: err.details,
        error: err.error,
        response: err.response,
        status: err.status
      });
      
      // Try to get more detailed error information
      let errorMessage = 'Failed to save event. Please check your input and try again.';
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        console.error('Response headers:', err.response.headers);
        
        if (err.response.data) {
          if (err.response.data.details) {
            errorMessage = `Server error: ${err.response.data.details}`;
          } else if (err.response.data.error) {
            errorMessage = `Server error: ${err.response.data.error}`;
          } else if (err.response.data.message) {
            errorMessage = `Server error: ${err.response.data.message}`;
          }
        }
      } else if (err.details && Array.isArray(err.details)) {
        errorMessage = `Validation error: ${err.details.join(', ')}`;
      } else if (err.details && typeof err.details === 'string') {
        errorMessage = `Validation error: ${err.details}`;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      }
      
      setError(errorMessage);
    }
  };

  const handleQuickEventSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!quickEventData.title.trim()) {
        setError('Event title is required');
        return;
      }

      if (!quickEventData.date) {
        setError('Event date is required');
        return;
      }

      const eventData = {
        title: quickEventData.title.trim(),
        startDate: new Date(`${quickEventData.date}T${quickEventData.allDay ? '00:00' : (quickEventData.time || '00:00')}`),
        allDay: quickEventData.allDay,
        color: '#3174ad',
        category: 'General'
      };

      // Add end date for non-all-day events
      if (!quickEventData.allDay && quickEventData.time) {
        eventData.endDate = new Date(`${quickEventData.date}T${quickEventData.time}`);
      } else if (quickEventData.allDay) {
        eventData.endDate = new Date(`${quickEventData.date}T23:59`);
      }

      console.log('Sending quick event data:', eventData);

      await apiClient.post('/events', eventData);
      console.log('Quick event created successfully');
      
      // Close modal and reset state on success
      setShowQuickEventForm(false);
      setQuickEventData({ title: '', date: '', time: '', allDay: false });
      setError(null);
      
      // Refresh events list
      await fetchEvents();
      
      console.log('Quick event operation completed successfully');
    } catch (err) {
      console.error('Quick event submission error:', err);
      
      // Handle different types of error responses
      if (err.details && Array.isArray(err.details)) {
        setError(`Validation error: ${err.details.join(', ')}`);
      } else if (err.details && typeof err.details === 'string') {
        setError(`Validation error: ${err.details}`);
      } else if (err.message) {
        setError(err.message);
      } else if (err.error) {
        setError(err.error);
      } else {
        setError('Failed to create event. Please check your input and try again.');
      }
    }
  };

  const getEventsForDate = (date) => {
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      // Check if event spans this date
      const spansDate = eventStart <= checkDate && eventEnd >= checkDate;
      
      if (spansDate) {
        console.log('✅ Event spans date:', {
          eventTitle: event.title,
          eventStart: eventStart.toISOString(),
          eventEnd: eventEnd.toISOString(),
          checkDate: checkDate.toISOString()
        });
      }
      
      return spansDate;
    });
    
    console.log(`📅 Events for ${date.toDateString()}:`, dayEvents.length);
    return dayEvents;
  };

  // Function to truncate long titles to 5 words
  const truncateTitle = (title, maxWords = 5) => {
    if (!title) return '';
    const words = title.split(' ');
    if (words.length <= maxWords) return title;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  if (loading) {
    return (
      <div className="events-page">
        <div className="loading">Loading events...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="events-page">
        <div className="alert alert-danger">
          <strong>Authentication Required:</strong> Please log in to view and manage events.
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-controls">
          <button onClick={goToPrevious} className="btn btn-outline">
            ‹
          </button>
          <button onClick={goToToday} className="btn btn-primary">
            Today
          </button>
          <button onClick={goToNext} className="btn btn-outline">
            ›
          </button>
        </div>
        
        <h1 className="calendar-title">
          {view === 'month' 
            ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          }
        </h1>
        
        <div className="view-controls">
          <button 
            onClick={() => setView('week')} 
            className={`btn ${view === 'week' ? 'btn-primary' : 'btn-outline'}`}
          >
            Week
          </button>
          <button 
            onClick={() => setView('month')} 
            className={`btn ${view === 'month' ? 'btn-primary' : 'btn-outline'}`}
          >
            Month
          </button>
          <button onClick={() => {
            setQuickEventData({
              title: '',
              date: new Date().toISOString().split('T')[0],
              time: new Date().toTimeString().slice(0, 5),
              allDay: false
            });
            setShowQuickEventForm(true);
          }} className="btn btn-outline">
            Quick Add
          </button>
                     <button onClick={handleCreateEvent} className="btn btn-success">
             + New Event
           </button>
           
           {/* Temporary Debug Button */}
           <button 
             onClick={() => {
               console.log('🔍 Manual fetch triggered');
               console.log('Current state:', { events, loading, error, view, currentDate });
               fetchEvents();
             }} 
             className="btn btn-outline btn-sm"
             style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
           >
             🔍 Debug
           </button>
          
          {/* Event Filters */}
          <div className="event-filters">
            <select
              value={eventFilters.category}
              onChange={(e) => setEventFilters(prev => ({ ...prev, category: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="General">General</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
              <option value="Social">Social</option>
            </select>
            
            <select
              value={eventFilters.status}
              onChange={(e) => setEventFilters(prev => ({ ...prev, status: e.target.value }))}
              className="filter-select"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <button 
              onClick={() => {
                setEventFilters({ category: '', status: 'scheduled' });
                fetchEvents();
              }} 
              className="btn btn-outline btn-sm"
            >
              Clear Filters
            </button>
          </div>
          
        </div>
      </div>

      {/* Success Display */}
      {success && (
        <div className="alert alert-success">
          <div className="success-content">
            <strong>Success:</strong> {success}
          </div>
          <button onClick={() => setSuccess(null)} className="close-btn">×</button>
        </div>
      )}

             {/* Error Display */}
       {error && (
         <div className="alert alert-danger">
           <div className="error-content">
             <strong>Error:</strong> {error}
           </div>
           <button onClick={() => setError(null)} className="close-btn">×</button>
         </div>
       )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="upcoming-events-section">
          <h3>Upcoming Events (Next 7 Days)</h3>
          <div className="upcoming-events-grid">
            {upcomingEvents.slice(0, 6).map((event) => (
              <div
                key={event._id}
                className="upcoming-event-card"
                style={{ borderLeftColor: event.color }}
                onClick={() => handleEditEvent(event)}
              >
                <div className="upcoming-event-date">
                  {new Date(event.startDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                <div className="upcoming-event-time">
                  {event.allDay ? 'All Day' : formatTime(event.startDate)}
                </div>
                                 <div className="upcoming-event-title">{truncateTitle(event.title)}</div>
                {event.location?.name && (
                  <div className="upcoming-event-location">📍 {event.location.name}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Day Headers */}
        <div className="calendar-day-headers">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="calendar-days">
          {(view === 'month' ? getMonthDays() : getWeekDays()).map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentMonthDay = view === 'month' ? isCurrentMonth(date) : true;
            
            return (
              <div 
                key={index} 
                className={`calendar-day ${isToday(date) ? 'today' : ''} ${!isCurrentMonthDay ? 'other-month' : ''}`}
                onClick={() => {
                  if (isCurrentMonthDay) {
                    setFormData(prev => ({
                      ...prev,
                      startDate: date.toISOString().split('T')[0]
                    }));
                    handleCreateEvent();
                  }
                }}
              >
                <div className="day-number">{date.getDate()}</div>
                <div className="day-events">
                                     {dayEvents.slice(0, 3).map((event, eventIndex) => (
                     <div
                       key={event._id}
                       className="day-event"
                       style={{ backgroundColor: event.color }}
                       onClick={(e) => {
                         e.stopPropagation();
                         handleEditEvent(event);
                       }}
                       title={`${event.title}${event.description ? ` - ${event.description}` : ''}${event.location?.name ? ` at ${event.location.name}` : ''}`}
                     >
                       <span className="event-time">
                         {event.allDay ? 'All Day' : formatTime(event.startDate)}
                       </span>
                                               <span className="event-title">{truncateTitle(event.title)}</span>
                        {event.category && event.category !== 'General' && (
                          <span className="event-category">{event.category}</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAttendeeModal(event);
                          }}
                          className="attendee-btn"
                          title="Manage Attendees"
                        >
                          👥
                        </button>
                     </div>
                   ))}
                  {dayEvents.length > 3 && (
                    <div className="more-events">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Event Modal */}
      {showQuickEventForm && (
        <div className="modal-overlay" onClick={() => setShowQuickEventForm(false)}>
          <div className="modal-content quick-event-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quick Add Event</h2>
              <button onClick={() => setShowQuickEventForm(false)} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleQuickEventSubmit} className="quick-event-form">
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  value={quickEventData.title}
                  onChange={(e) => setQuickEventData({...quickEventData, title: e.target.value})}
                  required
                  placeholder="What's happening?"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={quickEventData.date}
                  onChange={(e) => setQuickEventData({...quickEventData, date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={quickEventData.time}
                  onChange={(e) => setQuickEventData({...quickEventData, time: e.target.value})}
                  disabled={quickEventData.allDay}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={quickEventData.allDay}
                    onChange={(e) => setQuickEventData({...quickEventData, allDay: e.target.checked})}
                  />
                  All Day Event
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowQuickEventForm(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button onClick={() => setShowEventModal(false)} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="Event title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Event description"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    disabled={formData.allDay}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    disabled={formData.allDay}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.allDay}
                    onChange={(e) => setFormData({...formData, allDay: e.target.checked})}
                  />
                  All Day Event
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Health">Health</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location.name}
                  onChange={(e) => setFormData({
                    ...formData, 
                    location: {...formData.location, name: e.target.value}
                  })}
                  placeholder="Location name"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowEventModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedEvent ? 'Update Event' : 'Create Event'}
                </button>
                {selectedEvent && (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Event</h2>
              <button onClick={() => setShowDeleteModal(false)} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete "{eventToDelete?.title}"?</p>
              <p>This action cannot be undone.</p>
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn btn-danger">
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendee Management Modal */}
      {showAttendeeModal && selectedEventForAttendees && (
        <div className="modal-overlay" onClick={() => setShowAttendeeModal(false)}>
          <div className="modal-content attendee-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Attendees - {selectedEventForAttendees.title}</h2>
              <button onClick={() => setShowAttendeeModal(false)} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              {/* Current Attendees */}
              <div className="current-attendees">
                <h3>Current Attendees</h3>
                {selectedEventForAttendees.attendees && selectedEventForAttendees.attendees.length > 0 ? (
                  <div className="attendees-list">
                    {selectedEventForAttendees.attendees.map((attendee, index) => (
                      <div key={index} className="attendee-item">
                        <span className="attendee-name">{attendee.name}</span>
                        <span className="attendee-email">{attendee.email}</span>
                        <span className={`attendee-status ${attendee.status}`}>
                          {attendee.status}
                        </span>
                        <button
                          onClick={() => updateAttendeeStatus(
                            selectedEventForAttendees._id, 
                            attendee.email, 
                            attendee.status === 'accepted' ? 'declined' : 'accepted'
                          )}
                          className="btn btn-sm btn-outline"
                        >
                          Toggle Status
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No attendees yet.</p>
                )}
              </div>

              {/* Add New Attendee */}
              <div className="add-attendee">
                <h3>Add New Attendee</h3>
                <form onSubmit={handleAttendeeSubmit} className="attendee-form">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={attendeeForm.name}
                      onChange={(e) => setAttendeeForm({...attendeeForm, name: e.target.value})}
                      required
                      placeholder="Attendee name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={attendeeForm.email}
                      onChange={(e) => setAttendeeForm({...attendeeForm, email: e.target.value})}
                      required
                      placeholder="Attendee email"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Add Attendee
                  </button>
                </form>
              </div>

              {/* Update Attendee Status */}
              <div className="update-attendee-status">
                <h3>Update Attendee Status</h3>
                <form onSubmit={handleAttendeeStatusUpdate} className="status-form">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={attendeeStatusForm.email}
                      onChange={(e) => setAttendeeStatusForm({...attendeeStatusForm, email: e.target.value})}
                      required
                      placeholder="Attendee email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={attendeeStatusForm.status}
                      onChange={(e) => setAttendeeStatusForm({...attendeeStatusForm, status: e.target.value})}
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Update Status
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
