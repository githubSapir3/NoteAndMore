import React from 'react';

const Categories = () => {
  return (
    <div className="categories-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Categories</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Organize your content with categories
        </p>
      </div>

      <div className="alert alert-warning">
        <strong>⚠️ TODO:</strong> Categories functionality requires backend integration.
        <br />
        <br />
        <strong>Required endpoints:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li><code>GET /api/categories</code> - List categories</li>
          <li><code>POST /api/categories</code> - Create new category</li>
          <li><code>PUT /api/categories/:id</code> - Update category</li>
          <li><code>DELETE /api/categories/:id</code> - Delete category</li>
        </ul>
        <br />
        <strong>Features to implement:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li>Category creation and management</li>
          <li>Category hierarchy (parent/child)</li>
          <li>Category colors and icons</li>
          <li>Content filtering by category</li>
          <li>Category usage statistics</li>
        </ul>
      </div>
    </div>
  );
};

export default Categories;
