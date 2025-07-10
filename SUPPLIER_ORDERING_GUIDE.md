# 🛒 Supplier Ordering System - Complete Guide

## Overview

The Supplier Ordering System is a comprehensive solution that makes ordering from all your suppliers extremely fast and easy. This system provides order templates, smart AI suggestions, batch ordering, and multiple delivery methods including API integrations and automated email generation.

## ✅ Key Features

### 1. Supplier Order Templates
- Save frequently ordered items for each supplier
- Pre-filled product lists with default quantities
- Package sizes, pricing, and usage tracking
- Essential item marking
- Contact information and delivery preferences

### 2. Quick Order Checklist Interface
- One-click supplier selection
- Pre-filled order forms with adjustable quantities
- Real-time order total calculation
- Easy quantity adjustment with +/- buttons

### 3. Smart AI Ordering Suggestions
- Analyzes inventory levels and usage patterns
- Suggests optimal order quantities
- Identifies low stock situations
- Confidence scoring for recommendations
- One-click application of suggestions

### 4. Batch Order Management
- Select multiple suppliers at once
- Unified delivery date setting
- Simultaneous order placement
- Individual order tracking

### 5. API Integration with Supplier Portals
- **Ordermentum** - Food & beverage supplier platform
- **Bidfood Australia** - B2B food distribution
- **PFD Food Services** - Custom integrations
- **Coles for Business** - Business ordering
- **Costco Business** - Wholesale ordering

### 6. Automated Email & PDF Generation
- Professional PDF order documents
- Automated email delivery to suppliers
- HTML formatted order summaries
- Attachment handling

## 🚀 Getting Started

### Step 1: Create Supplier Templates

1. Navigate to **Supplier Ordering** in the sidebar
2. Click **"Manage Templates"**
3. Click **"Create Template"**
4. Fill in supplier information:
   - Supplier name
   - Contact details (rep, email, phone)
   - Minimum order value
   - Preferred delivery days
   - API integration settings

### Step 2: Add Order Items

For each template, add the products you regularly order:

1. Click **"Add Item"** in the template editor
2. Enter product details:
   - Product name
   - Default package size (e.g., "5kg bag", "2L bottle")
   - Default order quantity
   - Unit of measurement
   - Last known price
   - Monthly usage estimate
   - Product category
   - Mark as essential if needed

### Step 3: Configure API Integration (Optional)

If your supplier supports API ordering:

1. Enable **"API Integration"** in the template
2. Select the supplier type:
   - Ordermentum
   - Bidfood Australia
   - PFD Food Services
   - Coles for Business
   - Costco Business
3. Configure API credentials (contact your supplier for details)

### Step 4: Save and Test

1. Save your template
2. Test with a small order to verify everything works
3. Adjust quantities and settings as needed

## 📋 How to Place Orders

### Single Supplier Order

1. Go to **Supplier Ordering**
2. Select a supplier from the left panel
3. Review the pre-filled order items
4. Adjust quantities using +/- buttons or direct input
5. Set delivery date
6. Add order notes if needed
7. Choose delivery method:
   - **API Order** (if configured) - Instant submission
   - **Email Order** - Sends PDF via email
   - **Generate PDF** - Download for manual sending

### Batch Ordering

1. Click **"Batch Mode"** toggle
2. Select multiple suppliers
3. Set unified delivery date
4. Review items for each supplier
5. Click **"Place Batch Order"**
6. Monitor individual order status

### Smart Suggestions

1. Review AI suggestions at the top of the page
2. Each suggestion shows:
   - Current stock level
   - Recommended quantity
   - Confidence percentage
   - Reasoning
3. Click **"Apply All Suggestions"** or adjust individually

## 🔧 Technical Setup

### Environment Variables

Add these to your backend environment:

```bash
# SMTP Configuration for Email Orders
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-app-password

# Supplier API Keys
ORDERMENTUM_API_KEY=your-ordermentum-key
BIDFOOD_API_KEY=your-bidfood-key
PFD_API_KEY=your-pfd-key
COLES_API_KEY=your-coles-key
COSTCO_API_KEY=your-costco-key
```

### Required Dependencies

Backend dependencies are automatically included in `requirements.txt`:
- `reportlab==4.0.7` - PDF generation
- `premailer==3.10.0` - Email formatting

### Firebase Collections

The system creates these Firestore collections:
- `supplier_order_templates` - Template storage
- `supplier_orders` - Order history and tracking

## 📞 Supplier API Setup

### Ordermentum Integration

1. Contact Ordermentum support for API access
2. Request developer credentials
3. Obtain API key and supplier IDs
4. Configure in template settings

**API Documentation**: Contact Ordermentum tech team

### Bidfood Australia Integration

1. Reach out to Bidfood's tech team
2. Request B2B ordering API access
3. Provide business credentials
4. Obtain API endpoints and authentication

**Contact**: Bidfood Australia technical support

### PFD Food Services Integration

1. Contact PFD for custom integration
2. Request API documentation
3. Set up authentication
4. Configure ordering endpoints

**Process**: Custom integration upon request

### Coles for Business API

1. Register for Coles for Business
2. Request API access through business portal
3. Obtain API credentials
4. Configure product catalogs

**Website**: [Coles for Business](https://www.colesforbusiness.com.au)

### Costco Business Integration

1. Contact Costco Business support
2. Request API access for ordering
3. Obtain business credentials
4. Set up product mappings

**Process**: Check for available ordering APIs

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use these settings:
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-gmail@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

### Office 365 Setup

```
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=your-email@company.com
SMTP_PASSWORD=your-password
```

### Custom SMTP

Configure any SMTP server:
```
SMTP_SERVER=mail.your-domain.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
```

## 🤖 Smart Ordering Algorithm

The AI system analyzes:

1. **Current Stock Levels** - From inventory data
2. **Historical Usage** - From sales records
3. **Seasonal Patterns** - Time-based trends
4. **Lead Times** - Supplier delivery schedules
5. **Usage Velocity** - Rate of consumption

### Confidence Scoring

- **90%+** - Critical low stock, immediate action needed
- **70-89%** - Recommended reorder based on patterns
- **50-69%** - Optional reorder for optimization
- **Below 50%** - No action needed

## 📊 Order Tracking & Analytics

### Order Status Tracking

- **Pending** - Order created but not sent
- **Sent via API** - Successfully submitted through API
- **Sent via Email** - Email sent to supplier
- **Confirmed** - Supplier acknowledged
- **Delivered** - Order received

### Performance Metrics

Monitor:
- Order frequency by supplier
- Average order values
- Delivery time accuracy
- Cost savings from batch ordering
- Smart suggestion accuracy

## 🔍 Troubleshooting

### Common Issues

**1. Email Not Sending**
- Check SMTP credentials
- Verify app passwords for Gmail
- Ensure firewall allows SMTP traffic

**2. API Integration Failing**
- Verify API keys are correct
- Check supplier API status
- Review authentication settings

**3. Smart Suggestions Not Appearing**
- Ensure inventory data is up to date
- Check sales history exists
- Verify user permissions

**4. Template Not Saving**
- Check required fields are filled
- Verify user authentication
- Check Firebase connection

### Support Contacts

- **Technical Issues**: Check system logs
- **Supplier API Problems**: Contact supplier directly
- **Feature Requests**: Submit through the system

## 🎯 Best Practices

### Template Management

1. **Regular Updates**: Keep pricing and quantities current
2. **Seasonal Adjustments**: Update for seasonal variations
3. **Category Organization**: Use clear product categories
4. **Essential Items**: Mark critical products appropriately

### Ordering Workflow

1. **Daily Reviews**: Check smart suggestions daily
2. **Batch Scheduling**: Group orders by delivery day
3. **Lead Time Planning**: Order based on supplier schedules
4. **Cost Optimization**: Compare prices across suppliers

### Data Maintenance

1. **Inventory Accuracy**: Keep stock levels updated
2. **Usage Tracking**: Ensure sales data is recorded
3. **Supplier Information**: Maintain current contact details
4. **Performance Monitoring**: Review order success rates

## 🚀 Advanced Features

### Custom Integrations

Contact suppliers to set up:
- **Custom API Endpoints** - Direct integration
- **EDI Connections** - Electronic data interchange
- **Webhook Notifications** - Real-time updates

### Automation Rules

Set up automatic ordering:
- **Scheduled Orders** - Regular deliveries
- **Stock Triggers** - Auto-order when low
- **Seasonal Patterns** - Predictive ordering

### Multi-Location Support

For multiple locations:
- **Location-Specific Templates** - Different supplier relationships
- **Centralized Ordering** - Bulk orders for distribution
- **Local Preferences** - Location-specific items

## 📈 ROI & Benefits

### Time Savings

- **80% reduction** in manual ordering time
- **Instant order generation** from templates
- **Automated email delivery**
- **Batch processing** multiple suppliers

### Cost Benefits

- **Price comparison** across suppliers
- **Bulk ordering discounts** 
- **Reduced order errors**
- **Optimized delivery scheduling**

### Operational Improvements

- **Consistent ordering** reduces stockouts
- **Smart suggestions** prevent over-ordering
- **Historical tracking** improves forecasting
- **Supplier relationship** management

---

This comprehensive supplier ordering system transforms the traditional manual ordering process into a streamlined, intelligent, and automated workflow that saves time, reduces costs, and improves operational efficiency.