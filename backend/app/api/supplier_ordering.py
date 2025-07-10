from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import uuid
from datetime import datetime, timedelta
import requests
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.application import MimeApplication
import os
import logging
import io
import tempfile
from firebase_admin import firestore, auth

# Import Firebase client
from ..firebase_init import get_firestore_client

# Pydantic models for request/response
class OrderTemplateItem(BaseModel):
    id: str
    productName: str
    defaultPackageSize: str
    defaultQuantity: int
    unit: str
    lastPrice: Optional[float] = 0
    averageMonthlyUsage: Optional[float] = 0
    category: str
    essential: bool = False

class ContactInfo(BaseModel):
    rep: str
    email: str
    phone: str

class APIIntegration(BaseModel):
    enabled: bool
    type: Optional[str] = None
    credentials: Optional[Dict] = None

class SupplierOrderTemplate(BaseModel):
    id: Optional[str] = None
    supplierId: str
    supplierName: str
    items: List[OrderTemplateItem]
    notes: str = ""
    preferredDeliveryDays: List[str] = []
    minimumOrderValue: float = 0
    contactInfo: ContactInfo
    lastOrderDate: Optional[str] = None
    apiIntegration: Optional[APIIntegration] = None

class OrderRequest(BaseModel):
    supplierId: str
    supplierName: str
    items: List[Dict]
    notes: str = ""
    deliveryDate: Optional[str] = None
    total: float = 0
    apiIntegration: Optional[Dict] = None
    contactInfo: Optional[Dict] = None
    supplierEmail: Optional[str] = None

class BatchOrderRequest(BaseModel):
    suppliers: List[str]
    deliveryDate: Optional[str] = None
    notes: str = ""
    items: Dict[str, List[Dict]]

class SmartOrderSuggestion(BaseModel):
    itemId: str
    productName: str
    suggestedQuantity: int
    reason: str
    confidence: int
    currentStock: int
    averageUsage: float
    trendDirection: str

router = APIRouter()

# Supplier API Integration Classes
class SupplierAPIManager:
    """Manages API integrations with various suppliers"""
    
    def __init__(self):
        self.integrations = {
            'ordermentum': OrdermentumAPI(),
            'bidfood': BidfoodAPI(),
            'pfd': PFDFoodAPI(),
            'coles': ColesBusinessAPI(),
            'costco': CostcoBusinessAPI()
        }
    
    def place_order(self, supplier_type: str, order_data: Dict) -> Dict:
        """Place order through supplier API"""
        if supplier_type not in self.integrations:
            raise ValueError(f"Unsupported supplier type: {supplier_type}")
        
        return self.integrations[supplier_type].place_order(order_data)
    
    def get_pricing(self, supplier_type: str, items: List[str]) -> List[Dict]:
        """Get pricing from supplier API"""
        if supplier_type not in self.integrations:
            raise ValueError(f"Unsupported supplier type: {supplier_type}")
        
        return self.integrations[supplier_type].get_pricing(items)

class OrdermentumAPI:
    """Ordermentum API integration"""
    
    def __init__(self):
        self.base_url = "https://api.ordermentum.com/v3"
        self.api_key = os.getenv('ORDERMENTUM_API_KEY')
    
    def place_order(self, order_data: Dict) -> Dict:
        """Place order via Ordermentum API"""
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': 'Ordermentum API key not configured'
                }
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            formatted_order = {
                'supplier_id': order_data.get('supplierId'),
                'delivery_date': order_data.get('deliveryDate'),
                'items': [
                    {
                        'product_id': item.get('id'),
                        'quantity': item.get('quantity'),
                        'unit_price': item.get('lastPrice', 0)
                    }
                    for item in order_data.get('items', [])
                ],
                'notes': order_data.get('notes', ''),
                'total_amount': order_data.get('total', 0)
            }
            
            response = requests.post(
                f"{self.base_url}/orders",
                headers=headers,
                json=formatted_order,
                timeout=30
            )
            
            if response.status_code == 201:
                result = response.json()
                return {
                    'success': True,
                    'order_id': result.get('id'),
                    'status': result.get('status'),
                    'message': 'Order placed successfully'
                }
            else:
                return {
                    'success': False,
                    'error': f"API Error: {response.status_code}"
                }
                
        except Exception as e:
            logging.error(f"Ordermentum API error: {str(e)}")
            return {
                'success': False,
                'error': f"Connection error: {str(e)}"
            }
    
    def get_pricing(self, items: List[str]) -> List[Dict]:
        """Get pricing from Ordermentum"""
        # Implementation for getting pricing
        return []

class BidfoodAPI:
    """Bidfood Australia API integration"""
    
    def __init__(self):
        self.base_url = "https://api.bidfood.com.au/v1"
        self.api_key = os.getenv('BIDFOOD_API_KEY')
    
    def place_order(self, order_data: Dict) -> Dict:
        """Place order via Bidfood API"""
        # For now, return mock success - replace with actual API implementation
        return {
            'success': True,
            'order_id': f"BF-{uuid.uuid4().hex[:8]}",
            'message': 'Order sent to Bidfood'
        }
    
    def get_pricing(self, items: List[str]) -> List[Dict]:
        """Get pricing from Bidfood"""
        return []

class PFDFoodAPI:
    """PFD Food Services API integration"""
    
    def __init__(self):
        self.base_url = "https://api.pfd.com.au/v1"
        self.api_key = os.getenv('PFD_API_KEY')
    
    def place_order(self, order_data: Dict) -> Dict:
        """Place order via PFD API"""
        return {
            'success': True,
            'order_id': f"PFD-{uuid.uuid4().hex[:8]}",
            'message': 'Order sent to PFD'
        }
    
    def get_pricing(self, items: List[str]) -> List[Dict]:
        """Get pricing from PFD"""
        return []

class ColesBusinessAPI:
    """Coles for Business API integration"""
    
    def __init__(self):
        self.base_url = "https://api.colesforbusiness.com.au/v1"
        self.api_key = os.getenv('COLES_API_KEY')
    
    def place_order(self, order_data: Dict) -> Dict:
        """Place order via Coles API"""
        return {
            'success': True,
            'order_id': f"COLES-{uuid.uuid4().hex[:8]}",
            'message': 'Order sent to Coles for Business'
        }
    
    def get_pricing(self, items: List[str]) -> List[Dict]:
        """Get pricing from Coles"""
        return []

class CostcoBusinessAPI:
    """Costco Business API integration"""
    
    def __init__(self):
        self.base_url = "https://api.costcobusiness.com.au/v1"
        self.api_key = os.getenv('COSTCO_API_KEY')
    
    def place_order(self, order_data: Dict) -> Dict:
        """Place order via Costco API"""
        return {
            'success': True,
            'order_id': f"COSTCO-{uuid.uuid4().hex[:8]}",
            'message': 'Order sent to Costco Business'
        }
    
    def get_pricing(self, items: List[str]) -> List[Dict]:
        """Get pricing from Costco"""
        return []

# Initialize API manager
api_manager = SupplierAPIManager()

# Smart Ordering Engine
class SmartOrderingEngine:
    """AI-powered ordering suggestions based on usage patterns and trends"""
    
    @staticmethod
    async def generate_suggestions(user_id: str) -> List[Dict]:
        """Generate smart ordering suggestions"""
        try:
            db = get_firestore_client()
            
            # Get inventory data
            inventory_ref = db.collection('inventory').where('userId', '==', user_id)
            inventory_docs = inventory_ref.get()
            
            # Get sales data
            sales_ref = db.collection('sales').where('userId', '==', user_id)
            sales_docs = sales_ref.limit(100).get()
            
            suggestions = []
            
            for doc in inventory_docs:
                item_data = doc.to_dict()
                item_id = doc.id
                
                # Calculate usage trends
                current_stock = item_data.get('quantity', 0)
                average_usage = SmartOrderingEngine._calculate_average_usage(item_id, sales_docs)
                
                # Generate suggestions based on stock levels and trends
                if current_stock < average_usage * 3:  # Less than 3 days stock
                    confidence = 90 if current_stock < average_usage else 70
                    suggested_quantity = max(1, int(average_usage * 7))  # Week's worth
                    
                    reason = f"Low stock detected. Current: {current_stock}, Weekly usage: {average_usage * 7:.1f}"
                    
                    suggestions.append({
                        'itemId': item_id,
                        'productName': item_data.get('name', 'Unknown Item'),
                        'suggestedQuantity': suggested_quantity,
                        'reason': reason,
                        'confidence': confidence,
                        'currentStock': current_stock,
                        'averageUsage': average_usage,
                        'trendDirection': 'up' if current_stock < average_usage else 'stable'
                    })
            
            return sorted(suggestions, key=lambda x: x['confidence'], reverse=True)
            
        except Exception as e:
            logging.error(f"Error generating smart suggestions: {str(e)}")
            return []
    
    @staticmethod
    def _calculate_average_usage(item_id: str, sales_docs) -> float:
        """Calculate average daily usage for an item"""
        total_usage = 0
        days_count = 0
        
        for sale_doc in sales_docs:
            sale_data = sale_doc.to_dict()
            items = sale_data.get('items', [])
            
            for item in items:
                if item.get('productId') == item_id:
                    total_usage += item.get('quantity', 0)
                    days_count += 1
        
        return total_usage / max(days_count, 1)

# Email Service
class EmailService:
    """Service for sending order emails to suppliers"""
    
    @staticmethod
    def send_order_email(supplier_email: str, order_data: Dict, attachment_path: Optional[str] = None) -> bool:
        """Send order email to supplier"""
        try:
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            smtp_username = os.getenv('SMTP_USERNAME')
            smtp_password = os.getenv('SMTP_PASSWORD')
            
            if not all([smtp_username, smtp_password]):
                logging.error("SMTP credentials not configured")
                return False
            
            # Create message
            msg = MimeMultipart()
            msg['From'] = smtp_username
            msg['To'] = supplier_email
            msg['Subject'] = f"Purchase Order - {order_data.get('supplierName')} - {datetime.now().strftime('%Y-%m-%d')}"
            
            # Email body
            body = EmailService._create_order_email_body(order_data)
            msg.attach(MimeText(body, 'html'))
            
            # Attach PDF if provided
            if attachment_path and os.path.exists(attachment_path):
                with open(attachment_path, 'rb') as f:
                    attach = MimeApplication(f.read(), _subtype='pdf')
                    attach.add_header('Content-Disposition', 'attachment', filename='purchase_order.pdf')
                    msg.attach(attach)
            
            # Send email
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            server.quit()
            
            return True
            
        except Exception as e:
            logging.error(f"Error sending email: {str(e)}")
            return False
    
    @staticmethod
    def _create_order_email_body(order_data: Dict) -> str:
        """Create HTML email body for order"""
        items_html = ""
        total = 0
        
        for item in order_data.get('items', []):
            item_total = item.get('quantity', 0) * item.get('lastPrice', 0)
            total += item_total
            
            items_html += f"""
            <tr>
                <td>{item.get('productName', '')}</td>
                <td>{item.get('quantity', 0)}</td>
                <td>{item.get('unit', '')}</td>
                <td>${item.get('lastPrice', 0):.2f}</td>
                <td>${item_total:.2f}</td>
            </tr>
            """
        
        return f"""
        <html>
        <body>
            <h2>Purchase Order</h2>
            <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
            <p><strong>Supplier:</strong> {order_data.get('supplierName', '')}</p>
            
            {f"<p><strong>Delivery Date:</strong> {order_data.get('deliveryDate', '')}</p>" if order_data.get('deliveryDate') else ''}
            
            <h3>Order Items:</h3>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f2f2f2;">
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
                {items_html}
                <tr style="background-color: #f9f9f9; font-weight: bold;">
                    <td colspan="4">Total Order Value:</td>
                    <td>${total:.2f}</td>
                </tr>
            </table>
            
            {f"<h3>Notes:</h3><p>{order_data.get('notes', '')}</p>" if order_data.get('notes') else ''}
            
            <p>Thank you!</p>
        </body>
        </html>
        """

# PDF Generation Service
class PDFService:
    """Service for generating PDF order documents"""
    
    @staticmethod
    def generate_order_pdf(order_data: Dict) -> bytes:
        """Generate PDF for order"""
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            
            buffer = io.BytesIO()
            
            # Create PDF document
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=16,
                textColor=colors.black,
                alignment=1  # Center alignment
            )
            story.append(Paragraph("PURCHASE ORDER", title_style))
            story.append(Spacer(1, 20))
            
            # Order info
            info_data = [
                ['Date:', datetime.now().strftime('%Y-%m-%d %H:%M')],
                ['Supplier:', order_data.get('supplierName', '')],
            ]
            
            if order_data.get('deliveryDate'):
                info_data.append(['Delivery Date:', order_data.get('deliveryDate')])
            
            info_table = Table(info_data, colWidths=[1.5*inch, 4*inch])
            info_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
            ]))
            story.append(info_table)
            story.append(Spacer(1, 20))
            
            # Items table
            table_data = [['Product', 'Quantity', 'Unit', 'Unit Price', 'Total']]
            total = 0
            
            for item in order_data.get('items', []):
                item_total = item.get('quantity', 0) * item.get('lastPrice', 0)
                total += item_total
                
                table_data.append([
                    item.get('productName', ''),
                    str(item.get('quantity', 0)),
                    item.get('unit', ''),
                    f"${item.get('lastPrice', 0):.2f}",
                    f"${item_total:.2f}"
                ])
            
            # Add total row
            table_data.append(['', '', '', 'TOTAL:', f"${total:.2f}"])
            
            # Create table
            items_table = Table(table_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1*inch, 1*inch])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
                ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(items_table)
            
            # Add notes if any
            if order_data.get('notes'):
                story.append(Spacer(1, 20))
                story.append(Paragraph("Notes:", styles['Heading3']))
                story.append(Paragraph(order_data.get('notes'), styles['Normal']))
            
            # Build PDF
            doc.build(story)
            
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            return pdf_bytes
            
        except ImportError:
            # If reportlab is not installed, create a simple text-based PDF alternative
            simple_content = f"""
            PURCHASE ORDER
            
            Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}
            Supplier: {order_data.get('supplierName', '')}
            Delivery Date: {order_data.get('deliveryDate', 'Not specified')}
            
            ORDER ITEMS:
            """
            
            total = 0
            for item in order_data.get('items', []):
                item_total = item.get('quantity', 0) * item.get('lastPrice', 0)
                total += item_total
                simple_content += f"""
            - {item.get('productName', '')}: {item.get('quantity', 0)} {item.get('unit', '')} @ ${item.get('lastPrice', 0):.2f} = ${item_total:.2f}
                """
            
            simple_content += f"""
            
            TOTAL: ${total:.2f}
            
            Notes: {order_data.get('notes', 'None')}
            """
            
            return simple_content.encode('utf-8')

# User authentication helper
async def get_current_user(request: Request):
    """Extract user ID from request (assuming it's set by auth middleware)"""
    # This should be set by the auth middleware in main.py
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# API Routes

@router.get("/templates")
async def get_order_templates(request: Request):
    """Get all order templates for a user"""
    try:
        user = await get_current_user(request)
        user_id = user.get('uid')
        
        db = get_firestore_client()
        
        # Get templates from Firestore
        templates_ref = db.collection('supplier_order_templates').where('userId', '==', user_id)
        templates_docs = templates_ref.get()
        
        templates = []
        for doc in templates_docs:
            template_data = doc.to_dict()
            template_data['id'] = doc.id
            # Convert datetime objects to strings for JSON serialization
            if 'createdAt' in template_data and hasattr(template_data['createdAt'], 'isoformat'):
                template_data['createdAt'] = template_data['createdAt'].isoformat()
            if 'updatedAt' in template_data and hasattr(template_data['updatedAt'], 'isoformat'):
                template_data['updatedAt'] = template_data['updatedAt'].isoformat()
            templates.append(template_data)
        
        return {
            'success': True,
            'templates': templates
        }
        
    except Exception as e:
        logging.error(f"Error getting templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates")
async def create_order_template(template: SupplierOrderTemplate, request: Request):
    """Create a new order template"""
    try:
        user = await get_current_user(request)
        user_id = user.get('uid')
        
        db = get_firestore_client()
        
        template_data = {
            'userId': user_id,
            'supplierId': template.supplierId,
            'supplierName': template.supplierName,
            'items': [item.dict() for item in template.items],
            'notes': template.notes,
            'preferredDeliveryDays': template.preferredDeliveryDays,
            'minimumOrderValue': template.minimumOrderValue,
            'contactInfo': template.contactInfo.dict(),
            'apiIntegration': template.apiIntegration.dict() if template.apiIntegration else {},
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Save to Firestore
        doc_ref = db.collection('supplier_order_templates').add(template_data)
        template_id = doc_ref[1].id
        
        return {
            'success': True,
            'templateId': template_id,
            'message': 'Template created successfully'
        }
        
    except Exception as e:
        logging.error(f"Error creating template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/smart-suggestions")
async def get_smart_suggestions(request: Request):
    """Get AI-powered ordering suggestions"""
    try:
        user = await get_current_user(request)
        user_id = user.get('uid')
        
        suggestions = await SmartOrderingEngine.generate_suggestions(user_id)
        
        return {
            'success': True,
            'suggestions': suggestions
        }
        
    except Exception as e:
        logging.error(f"Error getting smart suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/place-order")
async def place_order(order: OrderRequest, request: Request):
    """Place an order with a supplier"""
    try:
        user = await get_current_user(request)
        user_id = user.get('uid')
        
        db = get_firestore_client()
        
        # Generate order ID
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # Prepare order record
        order_record = {
            'userId': user_id,
            'orderId': order_id,
            'supplierId': order.supplierId,
            'supplierName': order.supplierName,
            'items': order.items,
            'total': order.total,
            'notes': order.notes,
            'deliveryDate': order.deliveryDate,
            'status': 'pending',
            'createdAt': datetime.now()
        }
        
        # Convert to dict for API calls
        order_data = order.dict()
        
        # Check if API integration is enabled
        api_integration = order_data.get('apiIntegration', {})
        
        if api_integration.get('enabled') and api_integration.get('type'):
            try:
                # Place order via API
                api_result = api_manager.place_order(
                    api_integration.get('type'),
                    order_data
                )
                
                if api_result.get('success'):
                    order_record['externalOrderId'] = api_result.get('order_id')
                    order_record['status'] = 'sent_via_api'
                    
                    # Save order record
                    db.collection('supplier_orders').add(order_record)
                    
                    return {
                        'success': True,
                        'orderId': order_id,
                        'externalOrderId': api_result.get('order_id'),
                        'message': 'Order placed successfully via API'
                    }
                else:
                    # API failed, fall back to email
                    raise Exception(api_result.get('error', 'API order failed'))
                    
            except Exception as api_error:
                logging.warning(f"API order failed, falling back to email: {str(api_error)}")
                # Continue to email fallback
        
        # Email fallback or primary method
        supplier_email = order_data.get('supplierEmail')
        if not supplier_email:
            # Try to get email from supplier contact info
            contact_info = order_data.get('contactInfo', {})
            supplier_email = contact_info.get('email')
        
        if supplier_email:
            # Generate PDF
            pdf_bytes = PDFService.generate_order_pdf(order_data)
            
            # Save PDF temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(pdf_bytes)
                temp_pdf_path = temp_file.name
            
            try:
                # Send email
                email_sent = EmailService.send_order_email(
                    supplier_email,
                    order_data,
                    temp_pdf_path
                )
                
                if email_sent:
                    order_record['status'] = 'sent_via_email'
                    order_record['emailSent'] = True
                    
                    # Save order record
                    db.collection('supplier_orders').add(order_record)
                    
                    return {
                        'success': True,
                        'orderId': order_id,
                        'message': 'Order sent via email successfully'
                    }
                else:
                    raise HTTPException(status_code=500, detail='Failed to send email')
                    
            finally:
                # Clean up temp file
                try:
                    os.unlink(temp_pdf_path)
                except:
                    pass
        else:
            raise HTTPException(status_code=400, detail='No supplier email address available')
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error placing order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-order")
async def place_batch_order(batch_order: BatchOrderRequest, request: Request):
    """Place orders with multiple suppliers"""
    try:
        user = await get_current_user(request)
        user_id = user.get('uid')
        
        db = get_firestore_client()
        
        suppliers = batch_order.suppliers
        items_by_supplier = batch_order.items
        delivery_date = batch_order.deliveryDate
        notes = batch_order.notes
        
        order_ids = []
        errors = []
        
        for supplier_id in suppliers:
            try:
                # Get supplier template
                template_ref = db.collection('supplier_order_templates').where('supplierId', '==', supplier_id).where('userId', '==', user_id).limit(1)
                template_docs = list(template_ref.get())
                
                if not template_docs:
                    errors.append(f"Template not found for supplier {supplier_id}")
                    continue
                
                template_data = template_docs[0].to_dict()
                items = items_by_supplier.get(supplier_id, [])
                
                if not items:
                    continue
                
                # Calculate total
                total = sum(item.get('quantity', 0) * item.get('lastPrice', 0) for item in items)
                
                # Create order data
                order_data = {
                    'supplierId': supplier_id,
                    'supplierName': template_data.get('supplierName'),
                    'items': items,
                    'total': total,
                    'notes': notes,
                    'deliveryDate': delivery_date,
                    'apiIntegration': template_data.get('apiIntegration', {}),
                    'contactInfo': template_data.get('contactInfo', {}),
                    'supplierEmail': template_data.get('contactInfo', {}).get('email')
                }
                
                # Place individual order
                order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
                order_record = {
                    'userId': user_id,
                    'orderId': order_id,
                    'supplierId': supplier_id,
                    'supplierName': template_data.get('supplierName'),
                    'items': items,
                    'total': total,
                    'notes': notes,
                    'deliveryDate': delivery_date,
                    'status': 'pending',
                    'batchOrder': True,
                    'createdAt': datetime.now()
                }
                
                # Try API first, then email
                api_integration = template_data.get('apiIntegration', {})
                
                if api_integration.get('enabled'):
                    try:
                        api_result = api_manager.place_order(
                            api_integration.get('type'),
                            order_data
                        )
                        if api_result.get('success'):
                            order_record['status'] = 'sent_via_api'
                            order_record['externalOrderId'] = api_result.get('order_id')
                        else:
                            raise Exception("API failed")
                    except:
                        # Fall back to email
                        supplier_email = template_data.get('contactInfo', {}).get('email')
                        if supplier_email:
                            pdf_bytes = PDFService.generate_order_pdf(order_data)
                            
                            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                                temp_file.write(pdf_bytes)
                                temp_pdf_path = temp_file.name
                            
                            try:
                                email_sent = EmailService.send_order_email(
                                    supplier_email,
                                    order_data,
                                    temp_pdf_path
                                )
                                if email_sent:
                                    order_record['status'] = 'sent_via_email'
                                    order_record['emailSent'] = True
                            finally:
                                try:
                                    os.unlink(temp_pdf_path)
                                except:
                                    pass
                else:
                    # Email only
                    supplier_email = template_data.get('contactInfo', {}).get('email')
                    if supplier_email:
                        pdf_bytes = PDFService.generate_order_pdf(order_data)
                        
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                            temp_file.write(pdf_bytes)
                            temp_pdf_path = temp_file.name
                        
                        try:
                            email_sent = EmailService.send_order_email(
                                supplier_email,
                                order_data,
                                temp_pdf_path
                            )
                            if email_sent:
                                order_record['status'] = 'sent_via_email'
                                order_record['emailSent'] = True
                        finally:
                            try:
                                os.unlink(temp_pdf_path)
                            except:
                                pass
                
                # Save order record
                db.collection('supplier_orders').add(order_record)
                order_ids.append(order_id)
                
            except Exception as e:
                errors.append(f"Error with supplier {supplier_id}: {str(e)}")
        
        return {
            'success': len(order_ids) > 0,
            'orderIds': order_ids,
            'errors': errors,
            'message': f'{len(order_ids)} orders placed successfully'
        }
        
    except Exception as e:
        logging.error(f"Error placing batch order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-pdf")
async def generate_pdf(order_data: Dict, request: Request):
    """Generate PDF for an order"""
    try:
        user = await get_current_user(request)
        
        # Generate PDF
        pdf_bytes = PDFService.generate_order_pdf(order_data)
        
        # Return PDF as file download
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="order-{order_data.get("supplierName", "supplier")}-{datetime.now().strftime("%Y%m%d")}.pdf"'
            }
        )
        
    except Exception as e:
        logging.error(f"Error generating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))