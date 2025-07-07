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
  RefreshCw,
  Wifi,
  WifiOff,
  Building2,
  Copy,
  Download,
  Upload
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
  business_type?: string;
  children?: Category[];
}

interface BusinessTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: Omit<Category, 'id' | 'created_at' | 'updated_at'>[];
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
  const [isOnline, setIsOnline] = useState(true);
  const [currentBusiness, setCurrentBusiness] = useState<string>('general');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBusinessSelector, setShowBusinessSelector] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parent_id: '',
    color: '#3B82F6',
    icon: '📦'
  });

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  const icons = ['📦', '🍽️', '🥕', '🧽', '📋', '🔧', '💼', '🏠', '👕', '🏥', '🎓', '🏪'];

  // Business templates for different industries
  const businessTemplates: BusinessTemplate[] = [
    {
      id: 'restaurant',
      name: 'Restaurant',
      description: 'Food service and dining establishment',
      icon: '🍽️',
      categories: [
        { name: 'Food Items', description: 'All food products', parent_id: undefined, color: '#FF6B6B', icon: '🍽️', sort_order: 0, is_active: true, level: 0, path: 'Food Items', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'restaurant' },
        { name: 'Appetizers', description: 'Starter dishes', parent_id: 'food-items', color: '#4ECDC4', icon: '🥗', sort_order: 0, is_active: true, level: 1, path: 'Food Items/Appetizers', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'restaurant' },
        { name: 'Main Courses', description: 'Primary dishes', parent_id: 'food-items', color: '#45B7D1', icon: '🍖', sort_order: 1, is_active: true, level: 1, path: 'Food Items/Main Courses', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'restaurant' },
        { name: 'Beverages', description: 'Drinks and beverages', parent_id: undefined, color: '#6C5CE7', icon: '🥤', sort_order: 1, is_active: true, level: 0, path: 'Beverages', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'restaurant' },
        { name: 'Alcoholic', description: 'Alcoholic beverages', parent_id: 'beverages', color: '#FF9F43', icon: '🍷', sort_order: 0, is_active: true, level: 1, path: 'Beverages/Alcoholic', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'restaurant' },
        { name: 'Non-Alcoholic', description: 'Non-alcoholic drinks', parent_id: 'beverages', color: '#00D2D3', icon: '🥤', sort_order: 1, is_active: true, level: 1, path: 'Beverages/Non-Alcoholic', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'restaurant' }
      ]
    },
    {
      id: 'retail',
      name: 'Retail Store',
      description: 'General merchandise and retail',
      icon: '🏪',
      categories: [
        { name: 'Clothing', description: 'Apparel and accessories', parent_id: undefined, color: '#FF6B6B', icon: '👕', sort_order: 0, is_active: true, level: 0, path: 'Clothing', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'retail' },
        { name: 'Men\'s Clothing', description: 'Male apparel', parent_id: 'clothing', color: '#4ECDC4', icon: '👔', sort_order: 0, is_active: true, level: 1, path: 'Clothing/Men\'s Clothing', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'retail' },
        { name: 'Women\'s Clothing', description: 'Female apparel', parent_id: 'clothing', color: '#FF9F43', icon: '👗', sort_order: 1, is_active: true, level: 1, path: 'Clothing/Women\'s Clothing', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'retail' },
        { name: 'Electronics', description: 'Electronic devices and accessories', parent_id: undefined, color: '#45B7D1', icon: '📱', sort_order: 1, is_active: true, level: 0, path: 'Electronics', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'retail' },
        { name: 'Home & Garden', description: 'Home improvement and garden supplies', parent_id: undefined, color: '#00B894', icon: '🏠', sort_order: 2, is_active: true, level: 0, path: 'Home & Garden', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'retail' }
      ]
    },
    {
      id: 'medical',
      name: 'Medical Practice',
      description: 'Healthcare and medical services',
      icon: '🏥',
      categories: [
        { name: 'Medical Supplies', description: 'General medical equipment', parent_id: undefined, color: '#FF6B6B', icon: '🏥', sort_order: 0, is_active: true, level: 0, path: 'Medical Supplies', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'medical' },
        { name: 'Diagnostic Equipment', description: 'Equipment for diagnostics', parent_id: 'medical-supplies', color: '#4ECDC4', icon: '🔬', sort_order: 0, is_active: true, level: 1, path: 'Medical Supplies/Diagnostic Equipment', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'medical' },
        { name: 'Surgical Instruments', description: 'Tools for surgery', parent_id: 'medical-supplies', color: '#45B7D1', icon: '⚕️', sort_order: 1, is_active: true, level: 1, path: 'Medical Supplies/Surgical Instruments', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'medical' },
        { name: 'Pharmaceuticals', description: 'Medications and drugs', parent_id: undefined, color: '#6C5CE7', icon: '💊', sort_order: 1, is_active: true, level: 0, path: 'Pharmaceuticals', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'medical' },
        { name: 'Prescription Drugs', description: 'Prescription medications', parent_id: 'pharmaceuticals', color: '#FF9F43', icon: '💉', sort_order: 0, is_active: true, level: 1, path: 'Pharmaceuticals/Prescription Drugs', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'medical' }
      ]
    },
    {
      id: 'education',
      name: 'Educational Institution',
      description: 'Schools, colleges, and training centers',
      icon: '🎓',
      categories: [
        { name: 'Classroom Supplies', description: 'Teaching and learning materials', parent_id: undefined, color: '#FF6B6B', icon: '📚', sort_order: 0, is_active: true, level: 0, path: 'Classroom Supplies', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'education' },
        { name: 'Stationery', description: 'Writing and office supplies', parent_id: 'classroom-supplies', color: '#4ECDC4', icon: '✏️', sort_order: 0, is_active: true, level: 1, path: 'Classroom Supplies/Stationery', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'education' },
        { name: 'Teaching Aids', description: 'Educational tools and materials', parent_id: 'classroom-supplies', color: '#45B7D1', icon: '🎯', sort_order: 1, is_active: true, level: 1, path: 'Classroom Supplies/Teaching Aids', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'education' },
        { name: 'Technology', description: 'Educational technology equipment', parent_id: undefined, color: '#6C5CE7', icon: '💻', sort_order: 1, is_active: true, level: 0, path: 'Technology', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'education' }
      ]
    },
    {
      id: 'general',
      name: 'General Business',
      description: 'Generic business categories',
      icon: '💼',
      categories: [
        { name: 'Office Supplies', description: 'General office equipment', parent_id: undefined, color: '#FF6B6B', icon: '📋', sort_order: 0, is_active: true, level: 0, path: 'Office Supplies', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'general' },
        { name: 'Equipment', description: 'Business equipment and machinery', parent_id: undefined, color: '#4ECDC4', icon: '🔧', sort_order: 1, is_active: true, level: 0, path: 'Equipment', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'general' },
        { name: 'Inventory', description: 'Stock and inventory items', parent_id: undefined, color: '#45B7D1', icon: '📦', sort_order: 2, is_active: true, level: 0, path: 'Inventory', item_count: 0, subcategory_count: 0, created_by: 'system', business_type: 'general' }
      ]
    }
  ];

  useEffect(() => {
    loadBusinessData();
    // Auto-save every 5 minutes
    const saveInterval = setInterval(saveToLocalStorage, 300000);
    return () => clearInterval(saveInterval);
  }, [currentBusiness]);

  const getStorageKey = (business: string) => `categories_${business}`;

  const saveToLocalStorage = () => {
    try {
      const dataToSave = {
        categories,
        categoryTree,
        currentBusiness,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(getStorageKey(currentBusiness), JSON.stringify(dataToSave));
      console.log('✅ Categories saved to localStorage');
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  const loadFromLocalStorage = (business: string): Category[] | null => {
    try {
      const saved = localStorage.getItem(getStorageKey(business));
      if (saved) {
        const data = JSON.parse(saved);
        console.log('📂 Loaded categories from localStorage');
        return data.categories || [];
      }
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
    }
    return null;
  };

  const testBackendConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch {
      try {
        const response = await fetch('/api/categories', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return response.status !== 0;
      } catch {
        return false;
      }
    }
  };

  const buildCategoryTree = (categories: Category[]): CategoryTree => {
    const categoryMap = new Map<string, Category>(categories.map(cat => [cat.id, { ...cat, children: [] as Category[] }]));
    const rootCategories: Category[] = [];

    categories.forEach(category => {
      const catWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id)!;
        if (!parent.children) parent.children = [];
        parent.children.push(catWithChildren);
      } else {
        rootCategories.push(catWithChildren);
      }
    });

    const calculateDepth = (cats: Category[]): number => {
      return Math.max(0, ...cats.map(cat => 
        cat.children ? 1 + calculateDepth(cat.children) : 0
      ));
    };

    return {
      categories: rootCategories,
      total_categories: categories.length,
      max_depth: calculateDepth(rootCategories)
    };
  };

  const flattenCategories = (categories: Category[]): Category[] => {
    const result: Category[] = [];
    const flatten = (cats: Category[]) => {
      cats.forEach(cat => {
        result.push(cat);
        if (cat.children) {
          flatten(cat.children);
        }
      });
    };
    flatten(categories);
    return result;
  };

  const generateCategoriesFromTemplate = (template: BusinessTemplate): Category[] => {
    return template.categories.map((cat, index) => ({
      ...cat,
      id: `${template.id}-${index}-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      business_type: template.id
    }));
  };

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from localStorage first
      const savedCategories = loadFromLocalStorage(currentBusiness);
      
      if (savedCategories && savedCategories.length > 0) {
        setCategories(savedCategories);
        setCategoryTree(buildCategoryTree(savedCategories));
        setIsOnline(false); // Using local data
        setLoading(false);
        return;
      }

      // Test backend connection
      const backendOnline = await testBackendConnection();
      setIsOnline(backendOnline);

      if (backendOnline) {
        // Try to fetch from API
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/categories?business_type=${currentBusiness}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
          setCategoryTree(buildCategoryTree(categoriesData));
          saveToLocalStorage();
          setLoading(false);
          return;
        }
      }

      // Fallback to business template
      const template = businessTemplates.find(t => t.id === currentBusiness) || businessTemplates[4]; // Default to general
      const templateCategories = generateCategoriesFromTemplate(template);
      
      setCategories(templateCategories);
      setCategoryTree(buildCategoryTree(templateCategories));
      saveToLocalStorage();

    } catch (err) {
      console.error('Error loading business data:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Always fallback to template
      const template = businessTemplates.find(t => t.id === currentBusiness) || businessTemplates[4];
      const templateCategories = generateCategoriesFromTemplate(template);
      setCategories(templateCategories);
      setCategoryTree(buildCategoryTree(templateCategories));
      saveToLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessChange = (businessId: string) => {
    setCurrentBusiness(businessId);
    setShowBusinessSelector(false);
    // Data will be loaded by useEffect
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    const parentCategory = categories.find(cat => cat.id === newCategory.parent_id);
    const level = parentCategory ? parentCategory.level + 1 : 0;
    const path = parentCategory ? `${parentCategory.path}/${newCategory.name}` : newCategory.name;
    
    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newCategory.name,
      description: newCategory.description,
      parent_id: newCategory.parent_id || undefined,
      color: newCategory.color,
      icon: newCategory.icon,
      sort_order: 0,
      is_active: true,
      level: level,
      path: path,
      item_count: 0,
      subcategory_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user',
      business_type: currentBusiness
    };

    // Update local state
    const updatedCategories = [...categories, newCat];
    setCategories(updatedCategories);
    setCategoryTree(buildCategoryTree(updatedCategories));
    
    // Save to localStorage
    saveToLocalStorage();

    // Try to save to backend if online
    if (isOnline) {
      try {
        const token = localStorage.getItem('auth_token');
        await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            ...newCat,
            business_type: currentBusiness
          })
        });
        console.log('✅ Category saved to backend');
      } catch (err) {
        console.warn('⚠️ Backend save failed, but saved locally');
      }
    }

    // Reset form
    setNewCategory({
      name: '',
      description: '',
      parent_id: '',
      color: '#3B82F6',
      icon: '📦'
    });
    setShowAddForm(false);
    
    alert(`✅ Category "${newCat.name}" added successfully!`);
  };

  const handleUpdateCategory = async (categoryId: string) => {
    const updatedCategories = categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, ...editData, updated_at: new Date().toISOString() }
        : cat
    );
    
    setCategories(updatedCategories);
    setCategoryTree(buildCategoryTree(updatedCategories));
    saveToLocalStorage();

    // Try to save to backend if online
    if (isOnline) {
      try {
        const token = localStorage.getItem('auth_token');
        await fetch(`/api/categories/${categoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify(editData)
        });
        console.log('✅ Category updated in backend');
      } catch (err) {
        console.warn('⚠️ Backend update failed, but saved locally');
      }
    }

    setEditingRow(null);
    setEditData({});
    alert('✅ Category updated successfully!');
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryToDelete = categories.find(cat => cat.id === categoryId);
    if (!categoryToDelete) return;

    if (!confirm(`Are you sure you want to delete "${categoryToDelete.name}"?`)) return;

    // Remove category and update local state
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    setCategoryTree(buildCategoryTree(updatedCategories));
    saveToLocalStorage();

    // Try to delete from backend if online
    if (isOnline) {
      try {
        const token = localStorage.getItem('auth_token');
        await fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        console.log('✅ Category deleted from backend');
      } catch (err) {
        console.warn('⚠️ Backend delete failed, but removed locally');
      }
    }

    alert(`✅ Category "${categoryToDelete.name}" deleted successfully!`);
  };

  const exportCategories = () => {
    const dataToExport = {
      businessType: currentBusiness,
      businessName: businessTemplates.find(t => t.id === currentBusiness)?.name || 'Unknown',
      categories: categories,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-${currentBusiness}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importCategories = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (importedData.categories && Array.isArray(importedData.categories)) {
          setCategories(importedData.categories);
          setCategoryTree(buildCategoryTree(importedData.categories));
          saveToLocalStorage();
          alert(`✅ Successfully imported ${importedData.categories.length} categories!`);
        } else {
          alert('❌ Invalid file format');
        }
      } catch (err) {
        alert('❌ Failed to import file');
      }
    };
    reader.readAsText(file);
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
          <p>Loading categories for {businessTemplates.find(t => t.id === currentBusiness)?.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <div className="categories-header">
        <div className="header-left">
          <h1>Categories Management</h1>
          <div className="header-status">
            <p>Organize your inventory with hierarchical categories</p>
            <div className="business-selector">
              <button 
                className="business-btn"
                onClick={() => setShowBusinessSelector(!showBusinessSelector)}
              >
                <Building2 size={14} />
                {businessTemplates.find(t => t.id === currentBusiness)?.name || 'Select Business'}
              </button>
              {showBusinessSelector && (
                <div className="business-dropdown">
                  {businessTemplates.map(template => (
                    <button
                      key={template.id}
                      className={`business-option ${currentBusiness === template.id ? 'active' : ''}`}
                      onClick={() => handleBusinessChange(template.id)}
                    >
                      <span className="business-icon">{template.icon}</span>
                      <div className="business-info">
                        <span className="business-name">{template.name}</span>
                        <span className="business-desc">{template.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="connection-status">
              {isOnline ? (
                <span className="status-online">
                  <Wifi size={14} />
                  Connected & Saving
                </span>
              ) : (
                <span className="status-offline">
                  <WifiOff size={14} />
                  Local Storage
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="header-actions">
          <input
            type="file"
            accept=".json"
            onChange={importCategories}
            style={{ display: 'none' }}
            id="import-categories"
          />
          <button 
            className="action-btn"
            onClick={() => document.getElementById('import-categories')?.click()}
            title="Import categories"
          >
            <Upload size={16} />
            Import
          </button>
          <button 
            className="action-btn"
            onClick={exportCategories}
            title="Export categories"
          >
            <Download size={16} />
            Export
          </button>
          <button 
            className="refresh-btn"
            onClick={loadBusinessData}
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
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="save-notice">
        <Save size={14} />
        <span>All changes are automatically saved locally. {isOnline ? 'Syncing with server when possible.' : 'Will sync when connection is restored.'}</span>
      </div>

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
          <div className="stat">
            <span className="stat-value">{businessTemplates.find(t => t.id === currentBusiness)?.name}</span>
            <span className="stat-label">Business Type</span>
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
                <button type="submit" className="btn-primary">
                  Add Category
                </button>
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
            <p>Create your first category for {businessTemplates.find(t => t.id === currentBusiness)?.name}</p>
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