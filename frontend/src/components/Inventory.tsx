import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Package,
  Tag,
  DollarSign,
  Download,
  Upload,
  Grid,
  List,
  CheckSquare,
  X,
  RefreshCw,
  AlertCircle,
  Smartphone,
  Shield,
  Layers,
  Droplets
} from 'lucide-react';
import './Inventory.css';

interface Product {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  subcategory_id?: string;
  subcategory_name?: string;
  brand: string;
  type: string;
  thickness?: string;
  has_glue?: boolean;
  price: number;
  stock_quantity: number;
  sku?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  business_type: string;
  specifications: { [key: string]: string };
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  level: number;
  path: string;
  business_type: string;
  children?: Category[];
}

interface ProductFormData {
  name: string;
  category_id: string;
  subcategory_id: string;
  brand: string;
  type: string;
  thickness: string;
  has_glue: boolean;
  price: number;
  stock_quantity: number;
  sku: string;
  description: string;
  specifications: { [key: string]: string };
  tags: string[];
}

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBusiness] = useState<string>('general');
  
  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category_id: '',
    subcategory_id: '',
    brand: '',
    type: '',
    thickness: '',
    has_glue: false,
    price: 0,
    stock_quantity: 0,
    sku: '',
    description: '',
    specifications: {},
    tags: []
  });

  // Predefined options for tempered glass business
  const glassTypes = ['Clear', 'Full Coverage', 'Privacy', 'Anti-Glare', 'Blue Light', 'Matte'];
  const thicknessOptions = ['0.26mm', '0.33mm', '0.5mm', '0.7mm', '1.0mm'];
  const brands = ['Apple', 'Samsung', 'Google Pixel', 'OnePlus', 'Xiaomi', 'Huawei', 'Other'];

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load categories from localStorage (using the same system as Categories.tsx)
      const categoriesData = loadCategoriesFromStorage();
      setCategories(categoriesData);
      
      // Load products from localStorage
      const productsData = loadProductsFromStorage();
      setProducts(productsData);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesFromStorage = (): Category[] => {
    try {
      const saved = localStorage.getItem(`categories_${currentBusiness}`);
      if (saved) {
        const data = JSON.parse(saved);
        return data.categories || [];
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
    return [];
  };

  const loadProductsFromStorage = (): Product[] => {
    try {
      const saved = localStorage.getItem(`products_${currentBusiness}`);
      if (saved) {
        const data = JSON.parse(saved);
        return data.products || [];
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
    return [];
  };

  const saveProductsToStorage = (productsToSave: Product[]) => {
    try {
      const dataToSave = {
        products: productsToSave,
        business_type: currentBusiness,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(`products_${currentBusiness}`, JSON.stringify(dataToSave));
      console.log('✅ Products saved to localStorage');
    } catch (err) {
      console.error('Failed to save products:', err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || !formData.brand || !formData.type) {
      alert('Please fill in all required fields');
      return;
    }

    const category = categories.find(cat => cat.id === formData.category_id);
    const subcategory = categories.find(cat => cat.id === formData.subcategory_id);

    const newProduct: Product = {
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      category_id: formData.category_id,
      category_name: category?.name || '',
      subcategory_id: formData.subcategory_id || undefined,
      subcategory_name: subcategory?.name || '',
      brand: formData.brand,
      type: formData.type,
      thickness: formData.thickness || undefined,
      has_glue: formData.has_glue,
      price: formData.price,
      stock_quantity: formData.stock_quantity,
      sku: formData.sku || `${formData.brand}-${formData.type}-${Date.now()}`,
      description: formData.description,
      image_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      business_type: currentBusiness,
      specifications: {
        ...formData.specifications,
        ...(formData.thickness && { thickness: formData.thickness }),
        ...(formData.has_glue !== undefined && { has_glue: formData.has_glue ? 'Yes' : 'No' })
      },
      tags: formData.tags
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    saveProductsToStorage(updatedProducts);

    // Reset form
    setFormData({
      name: '',
      category_id: '',
      subcategory_id: '',
      brand: '',
      type: '',
      thickness: '',
      has_glue: false,
      price: 0,
      stock_quantity: 0,
      sku: '',
      description: '',
      specifications: {},
      tags: []
    });
    setShowAddForm(false);
    
    alert(`✅ Product "${newProduct.name}" added successfully!`);
  };



  const handleDeleteProduct = (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;

    if (!confirm(`Are you sure you want to delete "${productToDelete.name}"?`)) return;

    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    saveProductsToStorage(updatedProducts);
    
    alert(`✅ Product "${productToDelete.name}" deleted successfully!`);
  };

  const handleBulkUpdate = (field: string, value: any) => {
    if (selectedProducts.size === 0) {
      alert('Please select products to update');
      return;
    }

    const updatedProducts = products.map(product => 
      selectedProducts.has(product.id)
        ? { ...product, [field]: value, updated_at: new Date().toISOString() }
        : product
    );
    setProducts(updatedProducts);
    saveProductsToStorage(updatedProducts);
    setSelectedProducts(new Set());
    setBulkEditMode(false);
    
    alert(`✅ Updated ${selectedProducts.size} products!`);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBrand = !filterBrand || product.brand === filterBrand;
    const matchesType = !filterType || product.type === filterType;
    const matchesCategory = !filterCategory || product.category_id === filterCategory;

    return matchesSearch && matchesBrand && matchesType && matchesCategory;
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const key = `${product.category_name}/${product.subcategory_name || 'Uncategorized'}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(product);
    return acc;
  }, {} as { [key: string]: Product[] });

  const uniqueBrands = [...new Set(products.map(p => p.brand))];
  const uniqueTypes = [...new Set(products.map(p => p.type))];

  const getSubcategories = (categoryId: string) => {
    return categories.filter(cat => cat.parent_id === categoryId);
  };

  const generateProductName = () => {
    if (formData.brand && formData.type) {
      const parts = [formData.brand, formData.type];
      if (formData.thickness) parts.push(formData.thickness);
      setFormData(prev => ({ ...prev, name: parts.join(' ') }));
    }
  };

  const exportProducts = () => {
    const dataToExport = {
      businessType: currentBusiness,
      products: products,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${currentBusiness}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importProducts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (importedData.products && Array.isArray(importedData.products)) {
          setProducts(importedData.products);
          saveProductsToStorage(importedData.products);
          alert(`✅ Successfully imported ${importedData.products.length} products!`);
        } else {
          alert('❌ Invalid file format');
        }
      } catch (err) {
        alert('❌ Failed to import file');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <RefreshCw className="spinning" size={24} />
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="header-left">
          <h1>Inventory Management</h1>
          <p>Manage your products by categories and specifications</p>
        </div>
        <div className="header-actions">
          <input
            type="file"
            accept=".json"
            onChange={importProducts}
            style={{ display: 'none' }}
            id="import-products"
          />
          <button 
            className="action-btn"
            onClick={() => document.getElementById('import-products')?.click()}
            title="Import products"
          >
            <Upload size={16} />
            Import
          </button>
          <button 
            className="action-btn"
            onClick={exportProducts}
            title="Export products"
          >
            <Download size={16} />
            Export
          </button>
          <button 
            className="refresh-btn"
            onClick={loadData}
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
            Add New Product
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

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-section">
          <div className="search-input-container">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search products, brands, types, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
        
        <div className="view-actions">
          <div className="view-mode-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
          <button 
            className={`bulk-edit-btn ${bulkEditMode ? 'active' : ''}`}
            onClick={() => setBulkEditMode(!bulkEditMode)}
          >
            <CheckSquare size={16} />
            Bulk Edit
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Brand</label>
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
              <option value="">All Brands</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button 
            className="clear-filters-btn"
            onClick={() => {
              setFilterBrand('');
              setFilterType('');
              setFilterCategory('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Bulk Edit Panel */}
      {bulkEditMode && selectedProducts.size > 0 && (
        <div className="bulk-edit-panel">
          <div className="bulk-edit-header">
            <span>{selectedProducts.size} products selected</span>
            <button onClick={() => setSelectedProducts(new Set())}>
              <X size={16} />
            </button>
          </div>
          <div className="bulk-edit-actions">
            <button onClick={() => handleBulkUpdate('type', prompt('Enter new type:'))}>
              Update Type
            </button>
            <button onClick={() => handleBulkUpdate('price', parseFloat(prompt('Enter new price:') || '0'))}>
              Update Price
            </button>
            <button onClick={() => handleBulkUpdate('stock_quantity', parseInt(prompt('Enter new stock:') || '0'))}>
              Update Stock
            </button>
          </div>
        </div>
      )}

      {/* Products Display */}
      <div className="products-section">
        {Object.keys(groupedProducts).length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>No Products Yet</h3>
            <p>Add your first product to get started with inventory management</p>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([categoryPath, categoryProducts]) => (
            <div key={categoryPath} className="category-section">
              <div className="category-header">
                <h3>{categoryPath}</h3>
                <span className="product-count">{categoryProducts.length} products</span>
              </div>
              
              <div className={`products-grid ${viewMode}`}>
                {categoryProducts.map(product => (
                  <div key={product.id} className="product-card">
                    {bulkEditMode && (
                      <div className="product-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedProducts);
                            if (e.target.checked) {
                              newSelected.add(product.id);
                            } else {
                              newSelected.delete(product.id);
                            }
                            setSelectedProducts(newSelected);
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="product-header">
                      <div className="product-brand">
                        <Smartphone size={16} />
                        {product.brand}
                      </div>
                                             <div className="product-actions">
                         <button 
                           className="delete-btn"
                           onClick={() => handleDeleteProduct(product.id)}
                         >
                           <Trash2 size={14} />
                         </button>
                       </div>
                    </div>
                    
                    <div className="product-info">
                      <h4 className="product-name">{product.name}</h4>
                      <div className="product-specs">
                        <div className="spec-item">
                          <Shield size={14} />
                          <span>{product.type}</span>
                        </div>
                        {product.thickness && (
                          <div className="spec-item">
                            <Layers size={14} />
                            <span>{product.thickness}</span>
                          </div>
                        )}
                        {product.has_glue !== undefined && (
                          <div className="spec-item">
                            <Droplets size={14} />
                            <span>{product.has_glue ? 'With Glue' : 'No Glue'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="product-footer">
                      <div className="product-price">
                        <DollarSign size={16} />
                        <span>${product.price.toFixed(2)}</span>
                      </div>
                      <div className="product-stock">
                        <Package size={16} />
                        <span>{product.stock_quantity} in stock</span>
                      </div>
                    </div>
                    
                    {product.sku && (
                      <div className="product-sku">
                        <Tag size={12} />
                        <span>{product.sku}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="add-form-overlay">
          <div className="add-form">
            <div className="form-header">
              <h3>Add New Product</h3>
              <button onClick={() => setShowAddForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddProduct}>
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value, subcategory_id: ''})}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.filter(cat => cat.level === 0).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Subcategory</label>
                    <select
                      value={formData.subcategory_id}
                      onChange={(e) => setFormData({...formData, subcategory_id: e.target.value})}
                      disabled={!formData.category_id}
                    >
                      <option value="">Select Subcategory</option>
                      {getSubcategories(formData.category_id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Brand *</label>
                    <select
                      value={formData.brand}
                      onChange={(e) => {
                        setFormData({...formData, brand: e.target.value});
                        setTimeout(generateProductName, 100);
                      }}
                      required
                    >
                      <option value="">Select Brand</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        setFormData({...formData, type: e.target.value});
                        setTimeout(generateProductName, 100);
                      }}
                      required
                    >
                      <option value="">Select Type</option>
                      {glassTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Specifications</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Thickness</label>
                    <select
                      value={formData.thickness}
                      onChange={(e) => {
                        setFormData({...formData, thickness: e.target.value});
                        setTimeout(generateProductName, 100);
                      }}
                    >
                      <option value="">Select Thickness</option>
                      {thicknessOptions.map(thickness => (
                        <option key={thickness} value={thickness}>{thickness}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Glue Option</label>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="has_glue"
                        checked={formData.has_glue}
                        onChange={(e) => setFormData({...formData, has_glue: e.target.checked})}
                      />
                      <label htmlFor="has_glue">Has Glue (for Samsung)</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Product Details</h4>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Auto-generated from brand and type"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    placeholder="Auto-generated if left empty"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    placeholder="Additional product details..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;