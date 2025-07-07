import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Folder,
  Package,
  AlertCircle
} from 'lucide-react';
import './Categories.css';

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  level: number;
  path: string;
  item_count: number;
  subcategory_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
    color: '#3B82F6',
    icon: '📦'
  });

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const icons = ['📦', '🍽️', '🥕', '🧽', '📋', '🔧', '💼', '🏠'];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          parent_id: formData.parent_id || null,
          color: formData.color,
          icon: formData.icon,
          sort_order: 0,
          is_active: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      // Reset form and refresh categories
      setFormData({
        name: '',
        description: '',
        parent_id: '',
        color: '#3B82F6',
        icon: '📦'
      });
      setShowForm(false);
      await fetchCategories();
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const createSampleData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/categories/sample-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to create sample data');
      }

      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create sample data');
    }
  };

  if (loading) {
    return (
      <div className="categories-container">
        <div className="loading">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h1>Categories</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Category
          </button>
          {categories.length === 0 && (
            <button className="btn btn-secondary" onClick={createSampleData}>
              Create Sample Data
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <div className="form-header">
              <h2>Add New Category</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Parent Category</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                >
                  <option value="">None (Root Category)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.path}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-options">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${formData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-options">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="categories-list">
        {categories.length === 0 ? (
          <div className="empty-state">
            <Folder size={48} />
            <h3>No Categories Yet</h3>
            <p>Create your first category to organize your inventory</p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map(category => (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <div 
                    className="category-icon"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon}
                  </div>
                  <div className="category-actions">
                    <button 
                      className="action-btn"
                      onClick={() => handleDelete(category.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="category-content">
                  <h3>{category.name}</h3>
                  <p className="category-path">{category.path}</p>
                  {category.description && (
                    <p className="category-description">{category.description}</p>
                  )}
                  
                  <div className="category-stats">
                    <div className="stat">
                      <Package size={14} />
                      <span>{category.item_count} items</span>
                    </div>
                    <div className="stat">
                      <Folder size={14} />
                      <span>{category.subcategory_count} subcategories</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;