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
  XCircle,
  MoreHorizontal,
  FolderPlus,
  Settings,
  Filter,
  SortAsc,
  Eye,
  Archive,
  Star,
  Copy
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
  const [viewMode, setViewMode] = useState<'tree' | 'grid' | 'table'>('tree');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: '',
    color: '#3B82F6',
    icon: '📦',
    sort_order: 0,
    is_active: true
  });
  
  // Enhanced color palette with better organization
  const colorPalettes = {
    primary: ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
    success: ['#10B981', '#059669', '#047857', '#065F46'],
    warning: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
    danger: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
    purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
    pink: ['#EC4899', '#DB2777', '#BE185D', '#9D174D'],
    indigo: ['#6366F1', '#4F46E5', '#4338CA', '#3730A3'],
    teal: ['#14B8A6', '#0D9488', '#0F766E', '#115E59']
  };
  
  // Enhanced icon collection with categories
  const iconCategories = {
    business: ['📊', '💼', '🏢', '📈', '💰', '🎯', '📋', '📌'],
    food: ['🍽️', '🥕', '🥛', '🥩', '🥤', '🍿', '🥖', '☕', '🍵', '🧃'],
    supplies: ['🧽', '📋', '🍳', '🔧', '⚙️', '🛠️', '📦', '📄'],
    nature: ['🌿', '❄️', '🔥', '💧', '🌱', '🍃', '🌺', '🌳'],
    symbols: ['⭐', '🎨', '🎪', '🎯', '🏆', '💎', '🔮', '⚡'],
    objects: ['📱', '💻', '🖥️', '📺', '📷', '🎧', '⌚', '🔑']
  };
  
  useEffect(() => {
    fetchCategories();
  }, [showInactive]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
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
      color: '#3B82F6',
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
      color: category.color || '#3B82F6',
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

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderTreeView = (categories: Category[], level = 0) => {
    return categories.map(category => {
      const isExpanded = expandedCategories.has(category.id);
      const hasChildren = category.children && category.children.length > 0;
      const isSelected = selectedCategory?.id === category.id;
      
      return (
        <div key={category.id} className="tree-item">
          <div 
            className={`tree-node ${isSelected ? 'selected' : ''} ${!category.is_active ? 'inactive' : ''}`}
            style={{ paddingLeft: `${level * 24 + 16}px` }}
            onClick={() => setSelectedCategory(category)}
          >
            <div className="tree-node-content">
              <button
                className="expand-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.id);
                }}
                disabled={!hasChildren}
              >
                {hasChildren ? (
                  isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                ) : (
                  <div className="expand-placeholder" />
                )}
              </button>
              
              <div 
                className="category-icon-wrapper"
                style={{ backgroundColor: category.color }}
              >
                <span className="category-icon">{category.icon || '📦'}</span>
              </div>
              
              <div className="category-info">
                <div className="category-header">
                  <h4 className="category-name">{category.name}</h4>
                  <div className="category-badges">
                    {category.item_count > 0 && (
                      <span className="badge badge-items">
                        <Package size={12} />
                        {category.item_count}
                      </span>
                    )}
                    {category.subcategory_count > 0 && (
                      <span className="badge badge-subcategories">
                        <Folder size={12} />
                        {category.subcategory_count}
                      </span>
                    )}
                    {!category.is_active && (
                      <span className="badge badge-inactive">
                        <EyeOff size={12} />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                {category.description && (
                  <p className="category-description">{category.description}</p>
                )}
                <div className="category-path">{category.path}</div>
              </div>
            </div>
            
            <div className="category-actions">
              <button
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(category);
                }}
                title="Edit category"
              >
                <Edit size={14} />
              </button>
              <button
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFormData(prev => ({ ...prev, parent_id: category.id }));
                  setShowCreateForm(true);
                }}
                title="Add subcategory"
              >
                <FolderPlus size={14} />
              </button>
              <button
                className="action-btn action-btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(category.id);
                }}
                title="Delete category"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="tree-children">
              {renderTreeView(category.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderGridView = () => {
    return (
      <div className="grid-view">
        {filteredCategories.map(category => (
          <div 
            key={category.id} 
            className={`category-card ${selectedCategory?.id === category.id ? 'selected' : ''} ${!category.is_active ? 'inactive' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            <div className="card-header">
              <div 
                className="card-icon-wrapper"
                style={{ backgroundColor: category.color }}
              >
                <span className="card-icon">{category.icon || '📦'}</span>
              </div>
              <div className="card-actions">
                <button className="action-btn" onClick={(e) => { e.stopPropagation(); startEdit(category); }}>
                  <Edit size={14} />
                </button>
                <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="card-content">
              <h3 className="card-title">{category.name}</h3>
              <p className="card-path">{category.path}</p>
              {category.description && (
                <p className="card-description">{category.description}</p>
              )}
              
              <div className="card-stats">
                <div className="stat-item">
                  <Package size={14} />
                  <span>{category.item_count} items</span>
                </div>
                <div className="stat-item">
                  <Folder size={14} />
                  <span>{category.subcategory_count} subcategories</span>
                </div>
              </div>
              
              <div className="card-meta">
                <span className="level-badge">Level {category.level}</span>
                {!category.is_active && (
                  <span className="status-badge inactive">Inactive</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableView = () => {
    return (
      <div className="table-view">
        <table className="categories-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Path</th>
              <th>Items</th>
              <th>Subcategories</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map(category => (
              <tr 
                key={category.id}
                className={`${selectedCategory?.id === category.id ? 'selected' : ''} ${!category.is_active ? 'inactive' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                <td>
                  <div className="table-category-info">
                    <div 
                      className="table-icon"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon || '📦'}
                    </div>
                    <div>
                      <div className="table-category-name">{category.name}</div>
                      {category.description && (
                        <div className="table-category-desc">{category.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="table-path">{category.path}</td>
                <td>
                  <span className="table-stat">
                    <Package size={12} />
                    {category.item_count}
                  </span>
                </td>
                <td>
                  <span className="table-stat">
                    <Folder size={12} />
                    {category.subcategory_count}
                  </span>
                </td>
                <td>
                  <span className={`status-indicator ${category.is_active ? 'active' : 'inactive'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); startEdit(category); }}>
                      <Edit size={14} />
                    </button>
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSidebar = () => {
    if (!selectedCategory) return null;

    return (
      <div className={`category-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <div 
              className="sidebar-icon"
              style={{ backgroundColor: selectedCategory.color }}
            >
              {selectedCategory.icon || '📦'}
            </div>
            <div>
              <h3>{selectedCategory.name}</h3>
              <p>{selectedCategory.path}</p>
            </div>
          </div>
          <button 
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronRight className={sidebarCollapsed ? '' : 'rotated'} size={16} />
          </button>
        </div>
        
        {!sidebarCollapsed && (
          <div className="sidebar-content">
            <div className="sidebar-section">
              <h4>Details</h4>
              <div className="detail-item">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{selectedCategory.description || 'No description'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Level:</span>
                <span className="detail-value">{selectedCategory.level}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created:</span>
                <span className="detail-value">{new Date(selectedCategory.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="sidebar-section">
              <h4>Statistics</h4>
              <div className="stat-grid">
                <div className="stat-box">
                  <Package size={20} />
                  <div>
                    <div className="stat-number">{selectedCategory.item_count}</div>
                    <div className="stat-label">Items</div>
                  </div>
                </div>
                <div className="stat-box">
                  <Folder size={20} />
                  <div>
                    <div className="stat-number">{selectedCategory.subcategory_count}</div>
                    <div className="stat-label">Subcategories</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h4>Actions</h4>
              <div className="sidebar-actions">
                <button 
                  className="sidebar-action-btn primary"
                  onClick={() => startEdit(selectedCategory)}
                >
                  <Edit size={16} />
                  Edit Category
                </button>
                <button 
                  className="sidebar-action-btn"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, parent_id: selectedCategory.id }));
                    setShowCreateForm(true);
                  }}
                >
                  <FolderPlus size={16} />
                  Add Subcategory
                </button>
                <button 
                  className="sidebar-action-btn danger"
                  onClick={() => handleDeleteCategory(selectedCategory.id)}
                >
                  <Trash2 size={16} />
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderForm = () => {
    const isEditing = editingCategory !== null;
    const title = isEditing ? 'Edit Category' : 'Create Category';
    const onSubmit = isEditing ? handleUpdateCategory : handleCreateCategory;

    return (
      <div className="form-overlay">
        <div className="form-container">
          <div className="form-header">
            <h2>{title}</h2>
            <button
              className="form-close-btn"
              onClick={() => {
                setShowCreateForm(false);
                setEditingCategory(null);
                resetForm();
              }}
            >
              <XCircle size={24} />
            </button>
          </div>
          
          <form onSubmit={onSubmit} className="category-form">
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                
                <div className="form-field">
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
              </div>
              
              <div className="form-field">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Visual Settings</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Color</label>
                  <div className="color-picker">
                    {Object.entries(colorPalettes).map(([paletteName, colors]) => (
                      <div key={paletteName} className="color-palette">
                        <span className="palette-label">{paletteName}</span>
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
                    ))}
                  </div>
                </div>
                
                <div className="form-field">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {Object.entries(iconCategories).map(([categoryName, icons]) => (
                      <div key={categoryName} className="icon-category">
                        <span className="icon-category-label">{categoryName}</span>
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
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Settings</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
                
                <div className="form-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span className="checkbox-text">Active Category</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCategory(null);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Category Management</h1>
            <p>Organize your inventory with hierarchical categories</p>
          </div>
          
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={16} />
              New Category
            </button>
            
            {categories.length === 0 && (
              <button
                className="btn btn-secondary"
                onClick={createSampleCategories}
              >
                <Download size={16} />
                Sample Data
              </button>
            )}
          </div>
        </div>
        
        <div className="header-controls">
          <div className="search-section">
            <div className="search-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-controls">
              <label className="filter-label">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                <span>Show Inactive</span>
              </label>
            </div>
          </div>
          
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
            >
              <List size={16} />
              Tree
            </button>
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
              Grid
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <Calendar size={16} />
              Table
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle size={16} />
          </button>
        </div>
      )}

      {categoryTree && (
        <div className="stats-section">
          <div className="stat-card">
            <Folder className="stat-icon" />
            <div className="stat-info">
              <div className="stat-value">{categoryTree.total_categories}</div>
              <div className="stat-label">Total Categories</div>
            </div>
          </div>
          <div className="stat-card">
            <TrendingUp className="stat-icon" />
            <div className="stat-info">
              <div className="stat-value">{categoryTree.max_depth}</div>
              <div className="stat-label">Max Depth</div>
            </div>
          </div>
          <div className="stat-card">
            <Package className="stat-icon" />
            <div className="stat-info">
              <div className="stat-value">{categories.reduce((sum, cat) => sum + cat.item_count, 0)}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        <div className={`content-area ${selectedCategory ? 'with-sidebar' : ''}`}>
          {viewMode === 'tree' && categoryTree && categoryTree.categories.length > 0 && (
            <div className="tree-container">
              {renderTreeView(categoryTree.categories)}
            </div>
          )}
          
          {viewMode === 'grid' && (
            renderGridView()
          )}
          
          {viewMode === 'table' && (
            renderTableView()
          )}
          
          {categories.length === 0 && (
            <div className="empty-state">
              <Folder size={64} />
              <h3>No Categories Found</h3>
              <p>Create your first category to get started organizing your inventory</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus size={16} />
                Create Category
              </button>
            </div>
          )}
        </div>
        
        {selectedCategory && renderSidebar()}
      </div>
      
      {(showCreateForm || editingCategory) && renderForm()}
    </div>
  );
};

export default Categories;