import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Folder,
  ChevronDown,
  ChevronRight,
  Search,
  EyeOff,
  Package,
  TrendingUp,
  Grid,
  List,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
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

interface CategoryFormData {
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: '',
    color: '#FF6B6B',
    icon: '📦',
    sort_order: 0,
    is_active: true
  });
  
  // Common color options
  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#FD79A8', '#6C5CE7', '#00B894',
    '#0984E3', '#E17055', '#FDCB6E', '#E84393', '#74B9FF'
  ];
  
  // Common icon options
  const iconOptions = [
    '📦', '🍽️', '🥕', '🥛', '🥩', '🥤', '🍿', '🥖', '🧽', '📋', '🍳',
    '🌿', '❄️', '🥫', '☕', '🍵', '🧃', '🛒', '🏪', '🎯', '⚡', '🔥',
    '💡', '🎨', '🎭', '🎪', '🎨', '🎯', '🏆', '🌟', '💎', '🔮'
  ];

  useEffect(() => {
    fetchCategories();
  }, [showInactive]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // Fetch both flat list and tree structure
      const [categoriesResponse, treeResponse] = await Promise.all([
        fetch(`/api/categories?include_inactive=${showInactive}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/categories/tree?include_inactive=${showInactive}`, {
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      await fetchCategories();
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      await fetchCategories();
      setEditingCategory(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
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
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const createSampleCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/categories/sample-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to create sample categories');
      }

      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sample categories');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_id: '',
      color: '#FF6B6B',
      icon: '📦',
      sort_order: 0,
      is_active: true
    });
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
      color: category.color || '#FF6B6B',
      icon: category.icon || '📦',
      sort_order: category.sort_order,
      is_active: category.is_active
    });
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map(category => {
      const isExpanded = expandedCategories.has(category.id);
      const hasChildren = category.children && category.children.length > 0;
      
      return (
        <div key={category.id} className="category-item">
          <div 
            className={`category-row ${selectedCategory?.id === category.id ? 'selected' : ''}`}
            style={{ marginLeft: `${level * 20}px` }}
          >
            <div className="category-info">
              <button
                onClick={() => toggleExpanded(category.id)}
                className="expand-button"
                disabled={!hasChildren}
              >
                {hasChildren ? (
                  isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                ) : (
                  <span className="spacer" />
                )}
              </button>
              
              <span className="category-icon" style={{ color: category.color }}>
                {category.icon || '📦'}
              </span>
              
              <div className="category-details">
                <h4>{category.name}</h4>
                <p className="category-path">{category.path}</p>
                {category.description && (
                  <p className="category-description">{category.description}</p>
                )}
              </div>
              
              <div className="category-stats">
                <span className="stat">
                  <Package size={14} />
                  {category.item_count}
                </span>
                {category.subcategory_count > 0 && (
                  <span className="stat">
                    <Folder size={14} />
                    {category.subcategory_count}
                  </span>
                )}
                {!category.is_active && (
                  <span className="stat inactive">
                    <EyeOff size={14} />
                    Inactive
                  </span>
                )}
              </div>
            </div>
            
            <div className="category-actions">
              <button
                onClick={() => startEdit(category)}
                className="action-button edit"
                title="Edit category"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="action-button delete"
                title="Delete category"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="category-children">
              {renderCategoryTree(category.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderListView = () => {
    const filteredCategories = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div className="category-list">
        {filteredCategories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-header">
              <div className="category-title">
                <span className="category-icon" style={{ color: category.color }}>
                  {category.icon || '📦'}
                </span>
                <h3>{category.name}</h3>
                <span className="category-level">Level {category.level}</span>
              </div>
              <div className="category-actions">
                <button
                  onClick={() => startEdit(category)}
                  className="action-button edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="action-button delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="category-content">
              <p className="category-path">{category.path}</p>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
            </div>
            
            <div className="category-footer">
              <div className="category-stats">
                <span className="stat">
                  <Package size={14} />
                  {category.item_count} items
                </span>
                <span className="stat">
                  <Folder size={14} />
                  {category.subcategory_count} subcategories
                </span>
                <span className="stat">
                  <Calendar size={14} />
                  {new Date(category.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="category-status">
                {category.is_active ? (
                  <span className="status active">
                    <CheckCircle size={14} />
                    Active
                  </span>
                ) : (
                  <span className="status inactive">
                    <XCircle size={14} />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderForm = () => {
    const isEditing = editingCategory !== null;
    const title = isEditing ? 'Edit Category' : 'Create Category';
    const onSubmit = isEditing ? handleUpdateCategory : handleCreateCategory;

    return (
      <div className="category-form-overlay">
        <div className="category-form">
          <div className="form-header">
            <h2>{title}</h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingCategory(null);
                resetForm();
              }}
              className="close-button"
            >
              <XCircle size={20} />
            </button>
          </div>
          
          <form onSubmit={onSubmit} className="form-content">
            <div className="form-group">
              <label>Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter category name"
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
                <option value="">-- Root Category --</option>
                {categories
                  .filter(cat => cat.id !== editingCategory?.id)
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.path}
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Color</label>
                <div className="color-options">
                  {colorOptions.map(color => (
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
                  {iconOptions.map(icon => (
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
            
            <div className="form-row">
              <div className="form-group">
                <label>Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="cancel-button"
              >
                Cancel
              </button>
              <button type="submit" className="submit-button">
                {isEditing ? 'Update' : 'Create'} Category
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="categories-loading">
        <div className="spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <div className="categories-header">
        <div className="header-title">
          <h1>Categories</h1>
          <p>Organize your inventory with nested categories</p>
        </div>
        
        <div className="header-actions">
          <button
            onClick={() => setShowCreateForm(true)}
            className="primary-button"
          >
            <Plus size={16} />
            Add Category
          </button>
          
          {categories.length === 0 && (
            <button
              onClick={createSampleCategories}
              className="secondary-button"
            >
              <Download size={16} />
              Create Sample Data
            </button>
          )}
        </div>
      </div>
      
      <div className="categories-controls">
        <div className="search-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="view-controls">
            <label>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show Inactive
            </label>
            
            <div className="view-mode">
              <button
                onClick={() => setViewMode('tree')}
                className={`view-button ${viewMode === 'tree' ? 'active' : ''}`}
              >
                <List size={16} />
                Tree
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
              >
                <Grid size={16} />
                List
              </button>
            </div>
          </div>
        </div>
        
        {categoryTree && (
          <div className="category-stats">
            <div className="stat-card">
              <Folder size={20} />
              <div>
                <h3>{categoryTree.total_categories}</h3>
                <p>Total Categories</p>
              </div>
            </div>
            <div className="stat-card">
              <TrendingUp size={20} />
              <div>
                <h3>{categoryTree.max_depth}</h3>
                <p>Max Depth</p>
              </div>
            </div>
            <div className="stat-card">
              <Package size={20} />
              <div>
                <h3>{categories.reduce((sum, cat) => sum + cat.item_count, 0)}</h3>
                <p>Total Items</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      
      <div className="categories-content">
        {viewMode === 'tree' ? (
          <div className="category-tree">
            {categoryTree && categoryTree.categories.length > 0 ? (
              renderCategoryTree(categoryTree.categories)
            ) : (
              <div className="empty-state">
                <Folder size={48} />
                <h3>No Categories Found</h3>
                <p>Create your first category to get started</p>
              </div>
            )}
          </div>
        ) : (
          renderListView()
        )}
      </div>
      
      {(showCreateForm || editingCategory) && renderForm()}
    </div>
  );
};

export default Categories;