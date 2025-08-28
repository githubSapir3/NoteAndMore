import React from 'react';

const Shopping = () => {
  return (
    <div className="shopping-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Shopping Lists</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Create and manage your shopping lists
        </p>
      </div>

      <div className="alert alert-warning">
        <strong>⚠️ TODO:</strong> Shopping functionality requires backend integration.
        <br />
        <br />
        <strong>Required endpoints:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li><code>GET /api/shopping</code> - List shopping lists</li>
          <li><code>POST /api/shopping</code> - Create new shopping list</li>
          <li><code>PUT /api/shopping/:id</code> - Update shopping list</li>
          <li><code>DELETE /api/shopping/:id</code> - Delete shopping list</li>
          <li><code>PUT /api/shopping/:id/items</code> - Add/update items</li>
        </ul>
        <br />
        <strong>Features to implement:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li>Shopping list creation</li>
          <li>Item management (add, edit, delete)</li>
          <li>Item status (checked/unchecked)</li>
          <li>List sharing</li>
          <li>Categories and organization</li>
        </ul>
      </div>
    </div>
  );
};

export default Shopping;
