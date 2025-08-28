import React from 'react';

const Contacts = () => {
  return (
    <div className="contacts-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Contacts</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Manage your contacts and relationships
        </p>
      </div>

      <div className="alert alert-warning">
        <strong>⚠️ TODO:</strong> Contacts functionality requires backend integration.
        <br />
        <br />
        <strong>Required endpoints:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li><code>GET /api/contacts</code> - List contacts with search</li>
          <li><code>POST /api/contacts</code> - Create new contact</li>
          <li><code>PUT /api/contacts/:id</code> - Update contact</li>
          <li><code>DELETE /api/contacts/:id</code> - Delete contact</li>
        </ul>
        <br />
        <strong>Features to implement:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li>Contact list with search</li>
          <li>Contact creation/editing forms</li>
          <li>Contact categories/groups</li>
          <li>Call history tracking</li>
          <li>Favorite contacts</li>
        </ul>
      </div>
    </div>
  );
};

export default Contacts;
