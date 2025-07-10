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

  // Predefined options for different business types
  const glassTypes = ['Clear', 'Full Coverage', 'Privacy', 'Anti-Glare', 'Blue Light', 'Matte'];
  const thicknessOptions = ['0.26mm', '0.33mm', '0.5mm', '0.7mm', '1.0mm'];
  const brands = ['Apple', 'Samsung', 'Google Pixel', 'OnePlus', 'Xiaomi', 'Huawei', 'Other'];
  
  // Restaurant ingredient options
  const restaurantTypes = ['Fresh', 'Frozen', 'Canned', 'Dried', 'Organic', 'Premium', 'Standard'];
  const measurementUnits = ['kg', 'lbs', 'liters', 'gallons', 'pieces', 'boxes', 'cases', 'bottles'];
  const restaurantBrands = ['Local Supplier', 'Sysco', 'US Foods', 'Gordon Food Service', 'Costco', 'Restaurant Depot', 'Other'];

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
      
      // iPhone Models - Latest to Oldest
      // iPhone 16 Series (2024)
      {
        id: 'iphone-16-pro-max',
        name: 'iPhone 16 Pro Max',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 16 Pro Max',
        business_type: currentBusiness
      },
      {
        id: 'iphone-16-pro',
        name: 'iPhone 16 Pro',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 16 Pro',
        business_type: currentBusiness
      },
      {
        id: 'iphone-16-plus',
        name: 'iPhone 16 Plus',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 16 Plus',
        business_type: currentBusiness
      },
      {
        id: 'iphone-16',
        name: 'iPhone 16',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 16',
        business_type: currentBusiness
      },
      
      // iPhone 15 Series (2023)
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
      
      // iPhone 14 Series (2022)
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
      
      // iPhone 13 Series (2021)
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
        id: 'iphone-13-mini',
        name: 'iPhone 13 Mini',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 13 Mini',
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
      
      // iPhone 12 Series (2020)
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
        id: 'iphone-12-mini',
        name: 'iPhone 12 Mini',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 12 Mini',
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
      
      // iPhone 11 Series (2019)
      {
        id: 'iphone-11-pro-max',
        name: 'iPhone 11 Pro Max',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 11 Pro Max',
        business_type: currentBusiness
      },
      {
        id: 'iphone-11-pro',
        name: 'iPhone 11 Pro',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 11 Pro',
        business_type: currentBusiness
      },
      {
        id: 'iphone-11',
        name: 'iPhone 11',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 11',
        business_type: currentBusiness
      },
      
      // iPhone XS/XR Series (2018)
      {
        id: 'iphone-xs-max',
        name: 'iPhone XS Max',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone XS Max',
        business_type: currentBusiness
      },
      {
        id: 'iphone-xs',
        name: 'iPhone XS',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone XS',
        business_type: currentBusiness
      },
      {
        id: 'iphone-xr',
        name: 'iPhone XR',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone XR',
        business_type: currentBusiness
      },
      
      // iPhone X (2017)
      {
        id: 'iphone-x',
        name: 'iPhone X',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone X',
        business_type: currentBusiness
      },
      
      // iPhone 8 Series (2017)
      {
        id: 'iphone-8-plus',
        name: 'iPhone 8 Plus',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 8 Plus',
        business_type: currentBusiness
      },
      {
        id: 'iphone-8',
        name: 'iPhone 8',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 8',
        business_type: currentBusiness
      },
      
      // iPhone 7 Series (2016)
      {
        id: 'iphone-7-plus',
        name: 'iPhone 7 Plus',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 7 Plus',
        business_type: currentBusiness
      },
      {
        id: 'iphone-7',
        name: 'iPhone 7',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 7',
        business_type: currentBusiness
      },
      
      // iPhone SE Models
      {
        id: 'iphone-se-2022',
        name: 'iPhone SE (2022)',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone SE (2022)',
        business_type: currentBusiness
      },
      {
        id: 'iphone-se-2020',
        name: 'iPhone SE (2020)',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone SE (2020)',
        business_type: currentBusiness
      },
      
      // iPhone 6s Series (2015)
      {
        id: 'iphone-6s-plus',
        name: 'iPhone 6s Plus',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 6s Plus',
        business_type: currentBusiness
      },
      {
        id: 'iphone-6s',
        name: 'iPhone 6s',
        parent_id: 'apple',
        level: 2,
        path: 'Tempered Glass/Apple/iPhone 6s',
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
      
      // Samsung Galaxy Models - Latest to Oldest
      
      // Galaxy S24 Series (2024)
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
      
      // Galaxy S23 Series (2023)
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
        id: 'galaxy-s23-fe',
        name: 'Galaxy S23 FE',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S23 FE',
        business_type: currentBusiness
      },
      
      // Galaxy S22 Series (2022)
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
      
      // Galaxy S21 Series (2021)
      {
        id: 'galaxy-s21-ultra',
        name: 'Galaxy S21 Ultra',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S21 Ultra',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s21-plus',
        name: 'Galaxy S21+',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S21+',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s21',
        name: 'Galaxy S21',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S21',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s21-fe',
        name: 'Galaxy S21 FE',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S21 FE',
        business_type: currentBusiness
      },
      
      // Galaxy S20 Series (2020)
      {
        id: 'galaxy-s20-ultra',
        name: 'Galaxy S20 Ultra',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S20 Ultra',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s20-plus',
        name: 'Galaxy S20+',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S20+',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s20',
        name: 'Galaxy S20',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S20',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s20-fe',
        name: 'Galaxy S20 FE',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S20 FE',
        business_type: currentBusiness
      },
      
      // Galaxy Note Series
      {
        id: 'galaxy-note-20-ultra',
        name: 'Galaxy Note 20 Ultra',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Note 20 Ultra',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-note-20',
        name: 'Galaxy Note 20',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Note 20',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-note-10-plus',
        name: 'Galaxy Note 10+',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Note 10+',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-note-10',
        name: 'Galaxy Note 10',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Note 10',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-note-9',
        name: 'Galaxy Note 9',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Note 9',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-note-8',
        name: 'Galaxy Note 8',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Note 8',
        business_type: currentBusiness
      },
      
      // Galaxy Z Fold Series
      {
        id: 'galaxy-z-fold-6',
        name: 'Galaxy Z Fold 6',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Fold 6',
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
        id: 'galaxy-z-fold-4',
        name: 'Galaxy Z Fold 4',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Fold 4',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-z-fold-3',
        name: 'Galaxy Z Fold 3',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Fold 3',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-z-fold-2',
        name: 'Galaxy Z Fold 2',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Fold 2',
        business_type: currentBusiness
      },
      
      // Galaxy Z Flip Series
      {
        id: 'galaxy-z-flip-6',
        name: 'Galaxy Z Flip 6',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Flip 6',
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
      {
        id: 'galaxy-z-flip-4',
        name: 'Galaxy Z Flip 4',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Flip 4',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-z-flip-3',
        name: 'Galaxy Z Flip 3',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Flip 3',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-z-flip',
        name: 'Galaxy Z Flip',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy Z Flip',
        business_type: currentBusiness
      },
      
      // Galaxy A Series (Popular Models)
      {
        id: 'galaxy-a55',
        name: 'Galaxy A55',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A55',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a54',
        name: 'Galaxy A54',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A54',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a53',
        name: 'Galaxy A53',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A53',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a52',
        name: 'Galaxy A52',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A52',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a51',
        name: 'Galaxy A51',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A51',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a50',
        name: 'Galaxy A50',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A50',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a35',
        name: 'Galaxy A35',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A35',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a34',
        name: 'Galaxy A34',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A34',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a33',
        name: 'Galaxy A33',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A33',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a32',
        name: 'Galaxy A32',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A32',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a25',
        name: 'Galaxy A25',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A25',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a24',
        name: 'Galaxy A24',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A24',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a23',
        name: 'Galaxy A23',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A23',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a22',
        name: 'Galaxy A22',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A22',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a15',
        name: 'Galaxy A15',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A15',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a14',
        name: 'Galaxy A14',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A14',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a13',
        name: 'Galaxy A13',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A13',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-a12',
        name: 'Galaxy A12',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy A12',
        business_type: currentBusiness
      },
      
      // Galaxy S10 Series (2019)
      {
        id: 'galaxy-s10-plus',
        name: 'Galaxy S10+',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S10+',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s10',
        name: 'Galaxy S10',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S10',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s10e',
        name: 'Galaxy S10e',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S10e',
        business_type: currentBusiness
      },
      
      // Galaxy S9 Series (2018)
      {
        id: 'galaxy-s9-plus',
        name: 'Galaxy S9+',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S9+',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s9',
        name: 'Galaxy S9',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S9',
        business_type: currentBusiness
      },
      
      // Galaxy S8 Series (2017)
      {
        id: 'galaxy-s8-plus',
        name: 'Galaxy S8+',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S8+',
        business_type: currentBusiness
      },
      {
        id: 'galaxy-s8',
        name: 'Galaxy S8',
        parent_id: 'samsung',
        level: 2,
        path: 'Tempered Glass/Samsung/Galaxy S8',
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
      },
      
      // ==============================================
      // RESTAURANT INGREDIENTS SYSTEM
      // ==============================================
      
      // Main Restaurant Ingredients Category
      {
        id: 'restaurant-ingredients',
        name: 'Restaurant Ingredients',
        level: 0,
        path: 'Restaurant Ingredients',
        business_type: currentBusiness
      },
      
      // ==============================================
      // FRUITS & VEGETABLES
      // ==============================================
      {
        id: 'fruits-vegetables',
        name: 'Fruits & Vegetables',
        parent_id: 'restaurant-ingredients',
        level: 1,
        path: 'Restaurant Ingredients/Fruits & Vegetables',
        business_type: currentBusiness
      },
      
      // Fresh Fruits
      {
        id: 'apples',
        name: 'Apples',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Apples',
        business_type: currentBusiness
      },
      {
        id: 'bananas',
        name: 'Bananas',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Bananas',
        business_type: currentBusiness
      },
      {
        id: 'oranges',
        name: 'Oranges',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Oranges',
        business_type: currentBusiness
      },
      {
        id: 'lemons',
        name: 'Lemons',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Lemons',
        business_type: currentBusiness
      },
      {
        id: 'limes',
        name: 'Limes',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Limes',
        business_type: currentBusiness
      },
      {
        id: 'strawberries',
        name: 'Strawberries',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Strawberries',
        business_type: currentBusiness
      },
      {
        id: 'blueberries',
        name: 'Blueberries',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Blueberries',
        business_type: currentBusiness
      },
      {
        id: 'grapes',
        name: 'Grapes',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Grapes',
        business_type: currentBusiness
      },
      {
        id: 'pineapple',
        name: 'Pineapple',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Pineapple',
        business_type: currentBusiness
      },
      {
        id: 'avocado',
        name: 'Avocado',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Avocado',
        business_type: currentBusiness
      },
      
      // Fresh Vegetables
      {
        id: 'tomatoes',
        name: 'Tomatoes',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Tomatoes',
        business_type: currentBusiness
      },
      {
        id: 'onions',
        name: 'Onions',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Onions',
        business_type: currentBusiness
      },
      {
        id: 'garlic',
        name: 'Garlic',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Garlic',
        business_type: currentBusiness
      },
      {
        id: 'potatoes',
        name: 'Potatoes',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Potatoes',
        business_type: currentBusiness
      },
      {
        id: 'carrots',
        name: 'Carrots',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Carrots',
        business_type: currentBusiness
      },
      {
        id: 'celery',
        name: 'Celery',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Celery',
        business_type: currentBusiness
      },
      {
        id: 'lettuce',
        name: 'Lettuce',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Lettuce',
        business_type: currentBusiness
      },
      {
        id: 'spinach',
        name: 'Spinach',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Spinach',
        business_type: currentBusiness
      },
      {
        id: 'bell-peppers',
        name: 'Bell Peppers',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Bell Peppers',
        business_type: currentBusiness
      },
      {
        id: 'cucumbers',
        name: 'Cucumbers',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Cucumbers',
        business_type: currentBusiness
      },
      {
        id: 'mushrooms',
        name: 'Mushrooms',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Mushrooms',
        business_type: currentBusiness
      },
      {
        id: 'broccoli',
        name: 'Broccoli',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Broccoli',
        business_type: currentBusiness
      },
      {
        id: 'cauliflower',
        name: 'Cauliflower',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Cauliflower',
        business_type: currentBusiness
      },
      
      // Herbs & Spices
      {
        id: 'basil',
        name: 'Fresh Basil',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Fresh Basil',
        business_type: currentBusiness
      },
      {
        id: 'parsley',
        name: 'Fresh Parsley',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Fresh Parsley',
        business_type: currentBusiness
      },
      {
        id: 'cilantro',
        name: 'Fresh Cilantro',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Fresh Cilantro',
        business_type: currentBusiness
      },
      {
        id: 'thyme',
        name: 'Fresh Thyme',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Fresh Thyme',
        business_type: currentBusiness
      },
      {
        id: 'rosemary',
        name: 'Fresh Rosemary',
        parent_id: 'fruits-vegetables',
        level: 2,
        path: 'Restaurant Ingredients/Fruits & Vegetables/Fresh Rosemary',
        business_type: currentBusiness
      },
      
      // ==============================================
      // DRY FOODS & PANTRY
      // ==============================================
      {
        id: 'dry-foods',
        name: 'Dry Foods & Pantry',
        parent_id: 'restaurant-ingredients',
        level: 1,
        path: 'Restaurant Ingredients/Dry Foods & Pantry',
        business_type: currentBusiness
      },
      
      // Grains & Rice
      {
        id: 'white-rice',
        name: 'White Rice',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/White Rice',
        business_type: currentBusiness
      },
      {
        id: 'brown-rice',
        name: 'Brown Rice',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Brown Rice',
        business_type: currentBusiness
      },
      {
        id: 'quinoa',
        name: 'Quinoa',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Quinoa',
        business_type: currentBusiness
      },
      {
        id: 'pasta-spaghetti',
        name: 'Spaghetti Pasta',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Spaghetti Pasta',
        business_type: currentBusiness
      },
      {
        id: 'pasta-penne',
        name: 'Penne Pasta',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Penne Pasta',
        business_type: currentBusiness
      },
      {
        id: 'pasta-fettuccine',
        name: 'Fettuccine Pasta',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Fettuccine Pasta',
        business_type: currentBusiness
      },
      {
        id: 'all-purpose-flour',
        name: 'All-Purpose Flour',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/All-Purpose Flour',
        business_type: currentBusiness
      },
      {
        id: 'bread-flour',
        name: 'Bread Flour',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Bread Flour',
        business_type: currentBusiness
      },
      {
        id: 'sugar',
        name: 'Sugar',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Sugar',
        business_type: currentBusiness
      },
      {
        id: 'salt',
        name: 'Salt',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Salt',
        business_type: currentBusiness
      },
      {
        id: 'black-pepper',
        name: 'Black Pepper',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Black Pepper',
        business_type: currentBusiness
      },
      {
        id: 'olive-oil',
        name: 'Olive Oil',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Olive Oil',
        business_type: currentBusiness
      },
      {
        id: 'vegetable-oil',
        name: 'Vegetable Oil',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Vegetable Oil',
        business_type: currentBusiness
      },
      {
        id: 'canned-tomatoes',
        name: 'Canned Tomatoes',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Canned Tomatoes',
        business_type: currentBusiness
      },
      {
        id: 'tomato-paste',
        name: 'Tomato Paste',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Tomato Paste',
        business_type: currentBusiness
      },
      {
        id: 'chicken-stock',
        name: 'Chicken Stock',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Chicken Stock',
        business_type: currentBusiness
      },
      {
        id: 'vegetable-stock',
        name: 'Vegetable Stock',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Vegetable Stock',
        business_type: currentBusiness
      },
      {
        id: 'dried-oregano',
        name: 'Dried Oregano',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Dried Oregano',
        business_type: currentBusiness
      },
      {
        id: 'dried-basil',
        name: 'Dried Basil',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Dried Basil',
        business_type: currentBusiness
      },
      {
        id: 'paprika',
        name: 'Paprika',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Paprika',
        business_type: currentBusiness
      },
      {
        id: 'cumin',
        name: 'Cumin',
        parent_id: 'dry-foods',
        level: 2,
        path: 'Restaurant Ingredients/Dry Foods & Pantry/Cumin',
        business_type: currentBusiness
      },
      
      // ==============================================
      // MEATS & SEAFOOD
      // ==============================================
      {
        id: 'meats-seafood',
        name: 'Meats & Seafood',
        parent_id: 'restaurant-ingredients',
        level: 1,
        path: 'Restaurant Ingredients/Meats & Seafood',
        business_type: currentBusiness
      },
      
      // Fresh Meats
      {
        id: 'chicken-breast',
        name: 'Chicken Breast',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Chicken Breast',
        business_type: currentBusiness
      },
      {
        id: 'chicken-thighs',
        name: 'Chicken Thighs',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Chicken Thighs',
        business_type: currentBusiness
      },
      {
        id: 'ground-beef',
        name: 'Ground Beef',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Ground Beef',
        business_type: currentBusiness
      },
      {
        id: 'beef-steak',
        name: 'Beef Steak',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Beef Steak',
        business_type: currentBusiness
      },
      {
        id: 'pork-chops',
        name: 'Pork Chops',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Pork Chops',
        business_type: currentBusiness
      },
      {
        id: 'bacon',
        name: 'Bacon',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Bacon',
        business_type: currentBusiness
      },
      {
        id: 'italian-sausage',
        name: 'Italian Sausage',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Italian Sausage',
        business_type: currentBusiness
      },
      {
        id: 'lamb-chops',
        name: 'Lamb Chops',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Lamb Chops',
        business_type: currentBusiness
      },
      
      // Seafood
      {
        id: 'salmon-fillet',
        name: 'Salmon Fillet',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Salmon Fillet',
        business_type: currentBusiness
      },
      {
        id: 'shrimp',
        name: 'Shrimp',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Shrimp',
        business_type: currentBusiness
      },
      {
        id: 'cod-fillet',
        name: 'Cod Fillet',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Cod Fillet',
        business_type: currentBusiness
      },
      {
        id: 'tuna-steak',
        name: 'Tuna Steak',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Tuna Steak',
        business_type: currentBusiness
      },
      {
        id: 'crab-meat',
        name: 'Crab Meat',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Crab Meat',
        business_type: currentBusiness
      },
      {
        id: 'lobster-tail',
        name: 'Lobster Tail',
        parent_id: 'meats-seafood',
        level: 2,
        path: 'Restaurant Ingredients/Meats & Seafood/Lobster Tail',
        business_type: currentBusiness
      },
      
      // ==============================================
      // DAIRY & EGGS
      // ==============================================
      {
        id: 'dairy-eggs',
        name: 'Dairy & Eggs',
        parent_id: 'restaurant-ingredients',
        level: 1,
        path: 'Restaurant Ingredients/Dairy & Eggs',
        business_type: currentBusiness
      },
      
      // Milk Products
      {
        id: 'whole-milk',
        name: 'Whole Milk',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Whole Milk',
        business_type: currentBusiness
      },
      {
        id: 'heavy-cream',
        name: 'Heavy Cream',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Heavy Cream',
        business_type: currentBusiness
      },
      {
        id: 'sour-cream',
        name: 'Sour Cream',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Sour Cream',
        business_type: currentBusiness
      },
      {
        id: 'butter',
        name: 'Butter',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Butter',
        business_type: currentBusiness
      },
      
      // Cheese
      {
        id: 'mozzarella-cheese',
        name: 'Mozzarella Cheese',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Mozzarella Cheese',
        business_type: currentBusiness
      },
      {
        id: 'cheddar-cheese',
        name: 'Cheddar Cheese',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Cheddar Cheese',
        business_type: currentBusiness
      },
      {
        id: 'parmesan-cheese',
        name: 'Parmesan Cheese',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Parmesan Cheese',
        business_type: currentBusiness
      },
      {
        id: 'cream-cheese',
        name: 'Cream Cheese',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Cream Cheese',
        business_type: currentBusiness
      },
      {
        id: 'feta-cheese',
        name: 'Feta Cheese',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Feta Cheese',
        business_type: currentBusiness
      },
      
      // Eggs
      {
        id: 'large-eggs',
        name: 'Large Eggs',
        parent_id: 'dairy-eggs',
        level: 2,
        path: 'Restaurant Ingredients/Dairy & Eggs/Large Eggs',
        business_type: currentBusiness
      },
      
      // ==============================================
      // BEVERAGES
      // ==============================================
      {
        id: 'beverages',
        name: 'Beverages',
        parent_id: 'restaurant-ingredients',
        level: 1,
        path: 'Restaurant Ingredients/Beverages',
        business_type: currentBusiness
      },
      
      // Coffee & Tea
      {
        id: 'coffee-beans',
        name: 'Coffee Beans',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Coffee Beans',
        business_type: currentBusiness
      },
      {
        id: 'ground-coffee',
        name: 'Ground Coffee',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Ground Coffee',
        business_type: currentBusiness
      },
      {
        id: 'black-tea',
        name: 'Black Tea',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Black Tea',
        business_type: currentBusiness
      },
      {
        id: 'green-tea',
        name: 'Green Tea',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Green Tea',
        business_type: currentBusiness
      },
      {
        id: 'herbal-tea',
        name: 'Herbal Tea',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Herbal Tea',
        business_type: currentBusiness
      },
      
      // Soft Drinks & Juices
      {
        id: 'coca-cola',
        name: 'Coca Cola',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Coca Cola',
        business_type: currentBusiness
      },
      {
        id: 'orange-juice',
        name: 'Orange Juice',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Orange Juice',
        business_type: currentBusiness
      },
      {
        id: 'apple-juice',
        name: 'Apple Juice',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Apple Juice',
        business_type: currentBusiness
      },
      {
        id: 'sparkling-water',
        name: 'Sparkling Water',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Sparkling Water',
        business_type: currentBusiness
      },
      {
        id: 'still-water',
        name: 'Still Water',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Still Water',
        business_type: currentBusiness
      },
      
      // Alcoholic Beverages
      {
        id: 'red-wine',
        name: 'Red Wine',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Red Wine',
        business_type: currentBusiness
      },
      {
        id: 'white-wine',
        name: 'White Wine',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/White Wine',
        business_type: currentBusiness
      },
      {
        id: 'beer',
        name: 'Beer',
        parent_id: 'beverages',
        level: 2,
        path: 'Restaurant Ingredients/Beverages/Beer',
        business_type: currentBusiness
      },
      
      // ==============================================
      // CLEANING & SUPPLIES
      // ==============================================
      {
        id: 'cleaning-supplies',
        name: 'Cleaning & Supplies',
        parent_id: 'restaurant-ingredients',
        level: 1,
        path: 'Restaurant Ingredients/Cleaning & Supplies',
        business_type: currentBusiness
      },
      
      // Kitchen Cleaning
      {
        id: 'dish-soap',
        name: 'Dish Soap',
        parent_id: 'cleaning-supplies',
        level: 2,
        path: 'Restaurant Ingredients/Cleaning & Supplies/Dish Soap',
        business_type: currentBusiness
      },
      {
        id: 'all-purpose-cleaner',
        name: 'All-Purpose Cleaner',
        parent_id: 'cleaning-supplies',
        level: 2,
        path: 'Restaurant Ingredients/Cleaning & Supplies/All-Purpose Cleaner',
        business_type: currentBusiness
      },
      {
        id: 'sanitizer',
        name: 'Food Safe Sanitizer',
        parent_id: 'cleaning-supplies',
        level: 2,
        path: 'Restaurant Ingredients/Cleaning & Supplies/Food Safe Sanitizer',
        business_type: currentBusiness
      },
      {
        id: 'paper-towels',
        name: 'Paper Towels',
        parent_id: 'cleaning-supplies',
        level: 2,
        path: 'Restaurant Ingredients/Cleaning & Supplies/Paper Towels',
        business_type: currentBusiness
      },
      {
        id: 'aluminum-foil',
        name: 'Aluminum Foil',
        parent_id: 'cleaning-supplies',
        level: 2,
        path: 'Restaurant Ingredients/Cleaning & Supplies/Aluminum Foil',
        business_type: currentBusiness
      },
      {
        id: 'plastic-wrap',
        name: 'Plastic Wrap',
        parent_id: 'cleaning-supplies',
        level: 2,
        path: 'Restaurant Ingredients/Cleaning & Supplies/Plastic Wrap',
        business_type: currentBusiness
      },
      {
        id: 'trash-bags',
        name: 'Trash Bags',
        parent_id: 'cleaning-supplies',
        level: 2,
        path: 'Restaurant Ingredients/Cleaning & Supplies/Trash Bags',
        business_type: currentBusiness
      },
      {
        id: 'disposable-gloves',
        name: 'Disposable Gloves',
        parent_id: 'cleaning-supplies',
        level: 2,
        path: 'Restaurant Ingredients/Cleaning & Supplies/Disposable Gloves',
        business_type: currentBusiness
      },
      {
        id: 'food-containers',
        name: 'Food Storage Containers',
        parent_id: 'cleaning-supplies',
        level: 2,
        path: 'Restaurant Ingredients/Cleaning & Supplies/Food Storage Containers',
        business_type: currentBusiness
      }
    ];

    // Save these default categories to localStorage
    try {
      const dataToSave = {
        categories: defaultCategories,
        currentBusiness: currentBusiness,
        lastSaved: new Date().toISOString(),
        version: '3.0' // Version includes comprehensive phone models + restaurant ingredients
      };
      localStorage.setItem(`categories_${currentBusiness}`, JSON.stringify(dataToSave));
      console.log('✅ Created default categories (v3.0 - Phone Models + Restaurant Ingredients)');
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
        const version = data.version || '1.0';
        
        // Check if we need to update to the new comprehensive system
        if (version !== '3.0') {
          console.log('🔄 Updating to comprehensive system (v3.0 - Phone Models + Restaurant Ingredients)...');
          return createDefaultCategories();
        }
        
        if (categories.length > 0) {
          console.log(`✅ Loaded ${categories.length} categories from storage (v${version})`);
          return categories;
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
    
    // If no categories found, create default ones for the business
    console.log('🔄 No categories found, creating defaults...');
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
                 <button 
                   type="button"
                   onClick={() => {
                     if (confirm('This will reset all categories to include comprehensive phone models + restaurant ingredients. Continue?')) {
                       localStorage.removeItem(`categories_${currentBusiness}`);
                       loadData();
                     }
                   }}
                   className="reset-categories-btn"
                   title="Reset to comprehensive categories"
                 >
                   <Package size={14} />
                   Reset Categories
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
                   {categories.filter(cat => cat.level === 1).length} subcategories • 
                   {categories.filter(cat => cat.level === 2).length} items
                 </span>
                 <div className="phone-models-info">
                   <Smartphone size={14} />
                   <span style={{ fontSize: '0.9em', color: '#666' }}>
                     ✨ Phone Models: iPhone 6s-16, Galaxy S8-S24, A-series, Note, Z-series
                   </span>
                 </div>
                 <div className="restaurant-ingredients-info">
                   <Package size={14} />
                   <span style={{ fontSize: '0.9em', color: '#666' }}>
                     🍽️ Restaurant Ingredients: Fruits & Vegetables, Dry Foods, Meats & Seafood, Dairy & Eggs, Beverages, Cleaning
                   </span>
                 </div>
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
                     <label>
                       {formData.category_id === 'restaurant-ingredients' ? 'Category *' : 'Brand *'}
                     </label>
                     <select
                       value={formData.subcategory_id}
                       onChange={(e) => setFormData({...formData, subcategory_id: e.target.value, phone_model_id: ''})}
                       disabled={!formData.category_id}
                       required
                     >
                       <option value="">
                         {formData.category_id === 'restaurant-ingredients' ? 'Select Category' : 'Select Brand'}
                       </option>
                       {getSubcategories(formData.category_id).map(cat => (
                         <option key={cat.id} value={cat.id}>{cat.name}</option>
                       ))}
                       {formData.category_id && getSubcategories(formData.category_id).length === 0 && (
                         <option disabled>
                           {formData.category_id === 'restaurant-ingredients' ? 'No categories available' : 'No brands available'}
                         </option>
                       )}
                     </select>
                   </div>
                 </div>
                 
                 <div className="form-row">
                   <div className="form-group">
                     <label>
                       {formData.category_id === 'restaurant-ingredients' ? 'Ingredient *' : 'Phone Model *'}
                     </label>
                     <select
                       value={formData.phone_model_id}
                       onChange={(e) => setFormData({...formData, phone_model_id: e.target.value})}
                       disabled={!formData.subcategory_id}
                       required
                     >
                       <option value="">
                         {formData.category_id === 'restaurant-ingredients' ? 'Select Ingredient' : 'Select Phone Model'}
                       </option>
                       {getPhoneModels(formData.subcategory_id).map(cat => (
                         <option key={cat.id} value={cat.id}>{cat.name}</option>
                       ))}
                       {formData.subcategory_id && getPhoneModels(formData.subcategory_id).length === 0 && (
                         <option disabled>
                           {formData.category_id === 'restaurant-ingredients' 
                             ? 'No ingredients available for this category' 
                             : 'No phone models available for this brand'
                           }
                         </option>
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
                    <label>
                      {formData.category_id === 'restaurant-ingredients' ? 'Supplier/Brand *' : 'Product Brand *'}
                    </label>
                    <select
                      value={formData.brand}
                      onChange={(e) => {
                        setFormData({...formData, brand: e.target.value});
                        setTimeout(generateProductName, 100);
                      }}
                      required
                    >
                      <option value="">
                        {formData.category_id === 'restaurant-ingredients' ? 'Select Supplier' : 'Select Brand'}
                      </option>
                      {formData.category_id === 'restaurant-ingredients' 
                        ? restaurantBrands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                          ))
                        : brands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                          ))
                      }
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
                      {formData.category_id === 'restaurant-ingredients' 
                        ? restaurantTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))
                        : glassTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))
                      }
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Specifications</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      {formData.category_id === 'restaurant-ingredients' ? 'Unit/Package' : 'Thickness'}
                    </label>
                    <select
                      value={formData.thickness}
                      onChange={(e) => {
                        setFormData({...formData, thickness: e.target.value});
                        setTimeout(generateProductName, 100);
                      }}
                    >
                      <option value="">
                        {formData.category_id === 'restaurant-ingredients' ? 'Select Unit' : 'Select Thickness'}
                      </option>
                      {formData.category_id === 'restaurant-ingredients' 
                        ? measurementUnits.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))
                        : thicknessOptions.map(thickness => (
                            <option key={thickness} value={thickness}>{thickness}</option>
                          ))
                      }
                    </select>
                  </div>
                  {formData.category_id !== 'restaurant-ingredients' && (
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
                  )}
                  {formData.category_id === 'restaurant-ingredients' && (
                    <div className="form-group">
                      <label>Expiry/Best By</label>
                      <input
                        type="date"
                        value={formData.specifications?.expiry_date || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          specifications: {...formData.specifications, expiry_date: e.target.value}
                        })}
                      />
                    </div>
                  )}
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