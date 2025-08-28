import React from 'react';

const Events = () => {
  return (
    <div className="events-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Events</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Manage your calendar events and schedules
        </p>
      </div>

      <div className="alert alert-warning">
        <strong>⚠️ TODO:</strong> Events functionality requires backend integration.
        <br />
        <br />
        <strong>Required endpoints:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li><code>GET /api/events</code> - List events with filtering</li>
          <li><code>POST /api/events</code> - Create new event</li>
          <li><code>PUT /api/events/:id</code> - Update event</li>
          <li><code>DELETE /api/events/:id</code> - Delete event</li>
        </ul>
        <br />
        <strong>Features to implement:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li>Calendar view</li>
          <li>Event creation/editing forms</li>
          <li>Recurring events</li>
          <li>Event reminders</li>
          <li>Date range filtering</li>
        </ul>
      </div>
    </div>
  );
};

export default Events;
