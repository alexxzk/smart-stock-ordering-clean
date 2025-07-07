import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Folder,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Edit,
  Save,
  X,
  RefreshCw
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
  children?: Category[];
}

interface CategoryTree {
  categories: Category[];
  total_categories: number;
  max_depth: number;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
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
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCategories, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      const [categoriesResponse, treeResponse] = await Promise.all([
        fetch('/api/categories', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/categories/tree', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!categoriesResponse.ok || !treeResponse.ok) {
        throw new Error('Failed to fetch categories');
      }

      const categoriesData = await categoriesResponse.json();
      const treeData = await treeResponse.json();

      setCategories(categoriesData);
      setCategoryTree(treeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
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
          name: newCategory.name,
          description: newCategory.description,
          parent_id: newCategory.parent_id || null,
          color: newCategory.color,
          icon: newCategory.icon,
          sort_order: 0,
          is_active: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      // Reset form and refresh data
      setNewCategory({
        name: '',
        description: '',
        parent_id: '',
        color: '#3B82F6',
        icon: '📦'
      });
      setShowAddForm(false);
      await fetchCategories();
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      setEditingRow(null);
      setEditData({});
      await fetchCategories();
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
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

  const toggleRowExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedRows(newExpanded);
  };

  const startEditing = (category: Category) => {
    setEditingRow(category.id);
    setEditData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
      color: category.color || '#3B82F6',
      icon: category.icon || '📦',
      is_active: category.is_active
    });
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditData({});
  };

  const renderCategoryRows = (categories: Category[], level = 0) => {
    return categories.map(category => {
      const isExpanded = expandedRows.has(category.id);
      const isEditing = editingRow === category.id;
      const hasChildren = category.children && category.children.length > 0;

      return (
        <React.Fragment key={category.id}>
          <tr className={`category-row level-${level} ${!category.is_active ? 'inactive' : ''}`}>
            <td className="category-name-cell">
              <div className="name-content" style={{ paddingLeft: `${level * 20}px` }}>
                <button
                  className="expand-button"
                  onClick={() => toggleRowExpansion(category.id)}
                  disabled={!hasChildren}
                >
                  {hasChildren ? (
                    isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  ) : (
                    <span className="no-children">•</span>
                  )}
                </button>
                
                <div 
                  className="category-icon"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="edit-input"
                  />
                ) : (
                  <span className="category-name">{category.name}</span>
                )}
              </div>
            </td>

            <td className="description-cell">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="edit-input"
                  placeholder="Description"
                />
              ) : (
                category.description || '-'
              )}
            </td>

            <td className="path-cell">
              <code>{category.path}</code>
            </td>

            <td className="count-cell">
              <div className="count-badge">
                <Package size={12} />
                {category.item_count}
              </div>
            </td>

            <td className="count-cell">
              <div className="count-badge">
                <Folder size={12} />
                {category.subcategory_count}
              </div>
            </td>

            <td className="status-cell">
              {isEditing ? (
                <select
                  value={editData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setEditData({...editData, is_active: e.target.value === 'active'})}
                  className="edit-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              ) : (
                <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              )}
            </td>

            <td className="actions-cell">
              {isEditing ? (
                <div className="edit-actions">
                  <button
                    className="save-btn"
                    onClick={() => handleUpdateCategory(category.id)}
                  >
                    <Save size={14} />
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={cancelEditing}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="row-actions">
                  <button
                    className="edit-btn"
                    onClick={() => startEditing(category)}
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteCategory(category.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </td>
          </tr>

          {hasChildren && isExpanded && renderCategoryRows(category.children!, level + 1)}
        </React.Fragment>
      );
    });
  };

  if (loading) {
    return (
      <div className="categories-container">
        <div className="loading-state">
          <RefreshCw className="spinning" size={24} />
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <div className="categories-header">
        <div className="header-left">
          <h1>Categories Management</h1>
          <p>Organize your inventory with hierarchical categories</p>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchCategories}
            title="Refresh data"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(true)}
          >
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
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {categoryTree && (
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{categoryTree.total_categories}</span>
            <span className="stat-label">Total Categories</span>
          </div>
          <div className="stat">
            <span className="stat-value">{categoryTree.max_depth}</span>
            <span className="stat-label">Max Depth</span>
          </div>
          <div className="stat">
            <span className="stat-value">{categories.reduce((sum, cat) => sum + cat.item_count, 0)}</span>
            <span className="stat-label">Total Items</span>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="add-form-overlay">
          <div className="add-form">
            <div className="form-header">
              <h3>Add New Category</h3>
              <button onClick={() => setShowAddForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddCategory}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Parent Category</label>
                  <select
                    value={newCategory.parent_id}
                    onChange={(e) => setNewCategory({...newCategory, parent_id: e.target.value})}
                  >
                    <option value="">Root Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.path}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-picker">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${newCategory.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategory({...newCategory, color})}
                      />
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${newCategory.icon === icon ? 'selected' : ''}`}
                        onClick={() => setNewCategory({...newCategory, icon})}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="categories-table-container">
        {categories.length === 0 ? (
          <div className="empty-state">
            <Folder size={48} />
            <h3>No Categories Yet</h3>
            <p>Create your first category to organize your inventory</p>
          </div>
        ) : (
          <table className="categories-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Path</th>
                <th>Items</th>
                <th>Subcategories</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categoryTree && renderCategoryRows(categoryTree.categories)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Categories;