// Shared types for Supplier Ordering System

export interface OrderTemplateItem {
  id: string
  productName: string
  defaultPackageSize: string
  defaultQuantity: number
  unit: string
  lastPrice: number
  averageMonthlyUsage: number
  category: string
  essential: boolean
}

export interface ContactInfo {
  rep: string
  email: string
  phone: string
}

export interface APIIntegration {
  enabled: boolean
  type?: string
  credentials?: any
}

export interface SupplierOrderTemplate {
  id?: string
  supplierId: string
  supplierName: string
  items: OrderTemplateItem[]
  notes: string
  preferredDeliveryDays: string[]
  minimumOrderValue: number
  contactInfo: ContactInfo
  lastOrderDate?: string
  apiIntegration?: APIIntegration
}

export interface SmartOrderSuggestion {
  itemId: string
  productName: string
  suggestedQuantity: number
  reason: string
  confidence: number
  currentStock: number
  averageUsage: number
  trendDirection: 'up' | 'down' | 'stable'
}

export interface BatchOrder {
  suppliers: string[]
  orderDate: string
  deliveryDate: string
  items: { [supplierId: string]: OrderTemplateItem[] }
  totalValue: number
  status: 'draft' | 'sent' | 'confirmed' | 'delivered'
}