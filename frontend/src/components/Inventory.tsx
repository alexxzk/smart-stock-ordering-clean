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
  phone_model_id: string;
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

// Utility functions for number handling
const formatPrice = (price: any): string => {
  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  return numPrice.toFixed(2);
};

const formatStock = (stock: any): number => {
  return typeof stock === 'number' ? stock : parseInt(stock) || 0;
};

const validatePrice = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
};

const validateStock = (value: string): boolean => {
  const num = parseInt(value);
  return !isNaN(num) && num >= 0 && Number.isInteger(parseFloat(value));
};

// Stock level utilities
const getStockLevel = (stock: number) => {
  if (stock === 0) return 'out-of-stock';
  if (stock <= 5) return 'critical';
  if (stock <= 10) return 'low';
  if (stock <= 20) return 'medium';
  return 'good';
};

const getStockWarning = (stock: number) => {
  const level = getStockLevel(stock);
  switch (level) {
    case 'out-of-stock':
      return { message: 'Out of Stock', color: '#dc2626', icon: '⚠️' };
    case 'critical':
      return { message: `Only ${stock} left!`, color: '#dc2626', icon: '🚨' };
    case 'low':
      return { message: `Low Stock (${stock})`, color: '#f59e0b', icon: '⚠️' };
    case 'medium':
      return { message: `Medium Stock (${stock})`, color: '#3b82f6', icon: '📦' };
    default:
      return { message: `${stock} in stock`, color: '#10b981', icon: '✅' };
  }
};

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
    phone_model_id: '',
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

  const createDefaultCategories = (): Category[] => {
    const defaultCategories: Category[] = [
      // Main Categories
      {
        id: 'tempered-glass',
        name: 'Tempered Glass',
        level: 0,
        path: 'Tempered Glass',
        business_type: currentBusiness
      },
      {
        id: 'phone-cases',
        name: 'Phone Cases',
        level: 0,
        path: 'Phone Cases',
        business_type: currentBusiness
      },
      
      // Apple Brand
      {
        id: 'apple',
        name: 'Apple',
        parent_id: 'tempered-glass',
        level: 1,
        path: 'Tempered Glass/Apple',
        business_type: currentBusiness
      },
      
      // iPhone Models
      {
        id: 'iphone-15-pro-max',
        name: 'iPhone 15 Pro Max',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 15 Pro Max',
        business_type: currentBusiness
      },
      {
        id: 'iphone-15-pro',
        name: 'iPhone 15 Pro',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 15 Pro',
        business_type: currentBusiness
      },
      {
        id: 'iphone-15-plus',
        name: 'iPhone 15 Plus',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 15 Plus',
        business_type: currentBusiness
      },
      {
        id: 'iphone-15',
        name: 'iPhone 15',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 15',
        business_type: currentBusiness
      },
      {
        id: 'iphone-14-pro-max',
        name: 'iPhone 14 Pro Max',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 14 Pro Max',
        business_type: currentBusiness
      },
      {
        id: 'iphone-14-pro',
        name: 'iPhone 14 Pro',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 14 Pro',
        business_type: currentBusiness
      },
      {
        id: 'iphone-14-plus',
        name: 'iPhone 14 Plus',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 14 Plus',
        business_type: currentBusiness
      },
      {
        id: 'iphone-14',
        name: 'iPhone 14',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 14',
        business_type: currentBusiness
      },
      {
        id: 'iphone-13-pro-max',
        name: 'iPhone 13 Pro Max',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 13 Pro Max',
        business_type: currentBusiness
      },
      {
        id: 'iphone-13-pro',
        name: 'iPhone 13 Pro',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 13 Pro',
        business_type: currentBusiness
      },
      {
        id: 'iphone-13',
        name: 'iPhone 13',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 13',
        business_type: currentBusiness
      },
      {
        id: 'iphone-12-pro-max',
        name: 'iPhone 12 Pro Max',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 12 Pro Max',
        business_type: currentBusiness
      },
      {
        id: 'iphone-12-pro',
        name: 'iPhone 12 Pro',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 12 Pro',
        business_type: currentBusiness
      },
      {
        id: 'iphone-12',
        name: 'iPhone 12',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 12',
        business_type: currentBusiness
      },
      
      // Samsung Brand
      {
        id: 'samsung',
        name: 'Samsung',
        parent_id: 'tempered-glass',
        level: 1,
        path: 'Tempered Glass/Samsung',
        business_type: currentBusiness
      },
      
      // Samsung Galaxy Models
      {
        id: 'galaxy-s24-ultra',
        name: 'Galaxy S24 Ultra',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S24 Ultra',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s24-plus',
        name: 'Galaxy S24+',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S24+',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s24',
        name: 'Galaxy S24',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S24',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s23-ultra',
        name: 'Galaxy S23 Ultra',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S23 Ultra',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s23-plus',
        name: 'Galaxy S23+',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S23+',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s23',
        name: 'Galaxy S23',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S23',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s22-ultra',
        name: 'Galaxy S22 Ultra',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S22 Ultra',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s22-plus',
        name: 'Galaxy S22+',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S22+',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s22',
        name: 'Galaxy S22',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S22',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-note-20-ultra',
        name: 'Galaxy Note 20 Ultra',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Note 20 Ultra',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-z-fold-5',
        name: 'Galaxy Z Fold 5',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Fold 5',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-z-flip-5',
        name: 'Galaxy Z Flip 5',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Flip 5',
        business_type: currentBusiness
      },
      
      // Google Pixel
      {
        id: 'google-pixel',
        name: 'Google Pixel',
        parent_id: 'tempered-glass',
        level: 1,
        path: 'Tempered Glass/Google Pixel',
        business_type: currentBusiness
      },
      {
        id: 'pixel-8-pro',
        name: 'Pixel 8 Pro',
        parent_id: 'google-pixel',
        level: 2,
        path: 'Tempered Glass/Google Pixel/Pixel 8 Pro',
        business_type: currentBusiness
      },
      {
        id: 'pixel-8',
        name: 'Pixel 8',
        parent_id: 'google-pixel',
        level: 2,
        path: 'Tempered Glass/Google Pixel/Pixel 8',
        business_type: currentBusiness
      },
      {
        id: 'pixel-7-pro',
        name: 'Pixel 7 Pro',
        parent_id: 'google-pixel',
        level: 2,
        path: 'Tempered Glass/Google Pixel/Pixel 7 Pro',
        business_type: currentBusiness
      },
      {
        id: 'pixel-7',
        name: 'Pixel 7',
        parent_id: 'google-pixel',
        level: 2,
        path: 'Tempered Glass/Google Pixel/Pixel 7',
        business_type: currentBusiness
      }
    ];

    // Save these default categories to localStorage
    try {
      const dataToSave = {
        categories: defaultCategories,
        currentBusiness: currentBusiness,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(`categories_${currentBusiness}`, JSON.stringify(dataToSave));
      console.log('✅ Created default categories');
    } catch (err) {
      console.error('Failed to save default categories:', err);
    }

    return defaultCategories;
  };

  const loadCategoriesFromStorage = (): Category[] => {
    try {
      const saved = localStorage.getItem(`categories_${currentBusiness}`);
      if (saved) {
        const data = JSON.parse(saved);
        const categories = data.categories || [];
        if (categories.length > 0) {
          return categories;
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
    
    // If no categories found, create default ones for the business
    return createDefaultCategories();
  };

  const loadProductsFromStorage = (): Product[] => {
    try {
      const saved = localStorage.getItem(`products_${currentBusiness}`);
      if (saved) {
        const data = JSON.parse(saved);
        const products = data.products || [];
        
        // Ensure price and stock_quantity are numbers
        return products.map((product: any) => ({
          ...product,
          price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
          stock_quantity: typeof product.stock_quantity === 'number' ? product.stock_quantity : parseInt(product.stock_quantity) || 0
        }));
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
    
    if (!formData.name || !formData.category_id || !formData.subcategory_id || !formData.phone_model_id || !formData.brand || !formData.type) {
      alert('Please fill in all required fields (Category, Brand, Phone Model, Product Brand, and Type)');
      return;
    }

    // Validate numeric fields using utility functions
    const priceStr = formData.price.toString();
    const stockStr = formData.stock_quantity.toString();

    if (!validatePrice(priceStr)) {
      alert('Please enter a valid price (must be a positive number)');
      return;
    }

    if (!validateStock(stockStr)) {
      alert('Please enter a valid stock quantity (must be a positive whole number)');
      return;
    }

    const price = parseFloat(priceStr);
    const stockQuantity = parseInt(stockStr);

    const category = categories.find(cat => cat.id === formData.category_id);
    const subcategory = categories.find(cat => cat.id === formData.subcategory_id);
    const phoneModel = categories.find(cat => cat.id === formData.phone_model_id);

    const newProduct: Product = {
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      category_id: formData.phone_model_id, // Use phone model as the most specific category
      category_name: `${subcategory?.name || ''} ${phoneModel?.name || ''}`.trim(),
      subcategory_id: formData.subcategory_id || undefined,
      subcategory_name: phoneModel?.name || '',
      brand: formData.brand,
      type: formData.type,
      thickness: formData.thickness || undefined,
      has_glue: formData.has_glue,
      price: price, // Ensure it's a number
      stock_quantity: stockQuantity, // Ensure it's a number
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
      phone_model_id: '',
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

    // Validate numeric fields using utility functions
    let processedValue = value;
    if (field === 'price') {
      if (!validatePrice(value)) {
        alert('Please enter a valid price (must be a positive number)');
        return;
      }
      processedValue = parseFloat(value);
    } else if (field === 'stock_quantity') {
      if (!validateStock(value)) {
        alert('Please enter a valid stock quantity (must be a positive whole number)');
        return;
      }
      processedValue = parseInt(value);
    }

    const updatedProducts = products.map(product => 
      selectedProducts.has(product.id)
        ? { ...product, [field]: processedValue, updated_at: new Date().toISOString() }
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

  const getPhoneModels = (brandId: string) => {
    return categories.filter(cat => cat.parent_id === brandId);
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
          // Validate and clean imported data
          const cleanedProducts = importedData.products.map((product: any) => ({
            ...product,
            price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
            stock_quantity: typeof product.stock_quantity === 'number' ? product.stock_quantity : parseInt(product.stock_quantity) || 0,
            updated_at: new Date().toISOString() // Update timestamp on import
          }));
          
          setProducts(cleanedProducts);
          saveProductsToStorage(cleanedProducts);
          alert(`✅ Successfully imported ${cleanedProducts.length} products!`);
        } else {
          alert('❌ Invalid file format - missing products array');
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('❌ Failed to import file - invalid JSON format');
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
             <button onClick={() => {
               const newType = prompt('Enter new type:');
               if (newType && newType.trim()) {
                 handleBulkUpdate('type', newType.trim());
               }
             }}>
               Update Type
             </button>
             <button onClick={() => {
               const newPrice = prompt('Enter new price (numbers only):');
               if (newPrice !== null && newPrice.trim()) {
                 handleBulkUpdate('price', newPrice.trim());
               }
             }}>
               Update Price
             </button>
             <button onClick={() => {
               const newStock = prompt('Enter new stock quantity (whole numbers only):');
               if (newStock !== null && newStock.trim()) {
                 handleBulkUpdate('stock_quantity', newStock.trim());
               }
             }}>
               Update Stock
             </button>
           </div>
        </div>
      )}

      {/* Stock Warnings Summary */}
      {products.length > 0 && (
        <div className="stock-warnings-summary">
          <h3>
            <AlertCircle size={18} />
            Stock Alerts
          </h3>
          <div className="warning-stats">
            <div className="warning-stat critical">
              <span className="count">{products.filter(p => getStockLevel(formatStock(p.stock_quantity)) === 'critical').length}</span>
              <span className="label">Critical (≤5)</span>
            </div>
            <div className="warning-stat low">
              <span className="count">{products.filter(p => getStockLevel(formatStock(p.stock_quantity)) === 'low').length}</span>
              <span className="label">Low (≤10)</span>
            </div>
            <div className="warning-stat out">
              <span className="count">{products.filter(p => getStockLevel(formatStock(p.stock_quantity)) === 'out-of-stock').length}</span>
              <span className="label">Out of Stock</span>
            </div>
            <div className="warning-stat good">
              <span className="count">{products.filter(p => getStockLevel(formatStock(p.stock_quantity)) === 'good').length}</span>
              <span className="label">Well Stocked</span>
            </div>
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
                           <span>${formatPrice(product.price)}</span>
                         </div>
                         <div className="product-stock-container">
                           <div 
                             className={`product-stock stock-${getStockLevel(formatStock(product.stock_quantity))}`}
                             style={{ color: getStockWarning(formatStock(product.stock_quantity)).color }}
                           >
                             <span className="stock-icon">{getStockWarning(formatStock(product.stock_quantity)).icon}</span>
                             <span>{getStockWarning(formatStock(product.stock_quantity)).message}</span>
                           </div>
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
               <div className="form-header-actions">
                 <button 
                   type="button"
                   onClick={loadData}
                   className="refresh-categories-btn"
                   title="Refresh categories"
                 >
                   <RefreshCw size={14} />
                   Refresh Categories
                 </button>
                 <button onClick={() => setShowAddForm(false)}>×</button>
               </div>
             </div>
             
             {categories.length === 0 && (
               <div className="category-help">
                 <AlertCircle size={16} />
                 <div>
                   <p><strong>No categories found!</strong></p>
                   <p>Go to <strong>Categories</strong> page first to create product categories, or click "Refresh Categories" if you just created some.</p>
                 </div>
               </div>
             )}
             
             {categories.length > 0 && (
               <div className="category-info">
                 <Package size={16} />
                 <span>
                   {categories.length} categories loaded • 
                   {categories.filter(cat => cat.level === 0).length} main • 
                   {categories.filter(cat => cat.level === 1).length} brands • 
                   {categories.filter(cat => cat.level === 2).length} phone models
                 </span>
               </div>
             )}
            
            <form onSubmit={handleAddProduct}>
              <div className="form-section">
                <h4>Basic Information</h4>
                                 <div className="form-row">
                   <div className="form-group">
                     <label>Category *</label>
                     <select
                       value={formData.category_id}
                       onChange={(e) => setFormData({...formData, category_id: e.target.value, subcategory_id: '', phone_model_id: ''})}
                       required
                     >
                       <option value="">Select Category</option>
                       {categories.filter(cat => cat.level === 0).map(cat => (
                         <option key={cat.id} value={cat.id}>{cat.name}</option>
                       ))}
                       {categories.filter(cat => cat.level === 0).length === 0 && (
                         <option disabled>No categories available - create some in Categories page</option>
                       )}
                     </select>
                   </div>
                   <div className="form-group">
                     <label>Brand *</label>
                     <select
                       value={formData.subcategory_id}
                       onChange={(e) => setFormData({...formData, subcategory_id: e.target.value, phone_model_id: ''})}
                       disabled={!formData.category_id}
                       required
                     >
                       <option value="">Select Brand</option>
                       {getSubcategories(formData.category_id).map(cat => (
                         <option key={cat.id} value={cat.id}>{cat.name}</option>
                       ))}
                       {formData.category_id && getSubcategories(formData.category_id).length === 0 && (
                         <option disabled>No brands available</option>
                       )}
                     </select>
                   </div>
                 </div>
                 
                 <div className="form-row">
                   <div className="form-group">
                     <label>Phone Model *</label>
                     <select
                       value={formData.phone_model_id}
                       onChange={(e) => setFormData({...formData, phone_model_id: e.target.value})}
                       disabled={!formData.subcategory_id}
                       required
                     >
                       <option value="">Select Phone Model</option>
                       {getPhoneModels(formData.subcategory_id).map(cat => (
                         <option key={cat.id} value={cat.id}>{cat.name}</option>
                       ))}
                       {formData.subcategory_id && getPhoneModels(formData.subcategory_id).length === 0 && (
                         <option disabled>No phone models available for this brand</option>
                       )}
                     </select>
                   </div>
                   <div className="form-group">
                     <label>Quick Stock Check</label>
                     <div className="stock-level-indicator">
                       <div className={`stock-level stock-${getStockLevel(formData.stock_quantity)}`}>
                         <span className="stock-icon">{getStockWarning(formData.stock_quantity).icon}</span>
                         <span>{getStockWarning(formData.stock_quantity).message}</span>
                       </div>
                     </div>
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
                       <label>Price * ($)</label>
                       <input
                         type="number"
                         step="0.01"
                         min="0"
                         value={formData.price || ''}
                         onChange={(e) => {
                           const value = e.target.value;
                           // Allow empty string or valid numbers
                           if (value === '' || validatePrice(value)) {
                             setFormData({...formData, price: value === '' ? 0 : parseFloat(value)});
                           }
                         }}
                         onBlur={(e) => {
                           // Ensure we have a valid number on blur
                           const value = e.target.value;
                           if (value !== '' && !validatePrice(value)) {
                             setFormData({...formData, price: 0});
                           }
                         }}
                         placeholder="0.00"
                         required
                       />
                     </div>
                                        <div className="form-group">
                       <label>Stock Quantity *</label>
                       <input
                         type="number"
                         min="0"
                         step="1"
                         value={formData.stock_quantity || ''}
                         onChange={(e) => {
                           const value = e.target.value;
                           // Allow empty string or valid whole numbers
                           if (value === '' || validateStock(value)) {
                             setFormData({...formData, stock_quantity: value === '' ? 0 : parseInt(value)});
                           }
                         }}
                         onBlur={(e) => {
                           // Ensure we have a valid number on blur
                           const value = e.target.value;
                           if (value !== '' && !validateStock(value)) {
                             setFormData({...formData, stock_quantity: 0});
                           }
                         }}
                         placeholder="0"
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
                 <button 
                   type="submit" 
                   className="btn-primary"
                   disabled={!formData.category_id || !formData.subcategory_id || !formData.phone_model_id || categories.length === 0}
                 >
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