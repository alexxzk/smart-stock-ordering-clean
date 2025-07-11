# 🚀 Render Deployment Guide

## 📋 **Overview**
Deploy your Smart Stock Ordering System to Render with:
- **Backend**: FastAPI on Render Web Service
- **Frontend**: React/Vite on Render Static Site
- **Database**: Firebase Firestore
- **Latest Features**: Supplier API integrations, PDF/email orders, setup wizard

---

## 🔧 **Prerequisites**
- ✅ **Latest code committed** to your GitHub repository
- ✅ **Branch**: `feature/supplier-api-integrations-complete`
- ✅ **Firebase project** set up with Firestore
- ✅ **Render account** (free tier available)

---

## 🏗️ **Step 1: Deploy Backend to Render**

### **1.1 Create Web Service**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository: `alexxzk/smart-stock-ordering-clean`
4. Select branch: `feature/supplier-api-integrations-complete`

### **1.2 Configure Backend Service**
```yaml
Name: smart-stock-ordering-backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT
Root Directory: backend
```

### **1.3 Set Environment Variables**
In Render dashboard, add these environment variables:

**Firebase Configuration:**
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_WEB_API_KEY=your-web-api-key
```

**App Configuration:**
```
DEV_MODE=false
PYTHON_VERSION=3.11.7
PIP_NO_CACHE_DIR=1
```

**Email Configuration (for order notifications):**
```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Supplier API Keys (optional):**
```
ORDERMENTUM_API_KEY=your-ordermentum-key
BIDFOOD_API_KEY=your-bidfood-key
PFD_API_KEY=your-pfd-key
COLES_API_KEY=your-coles-key
COSTCO_API_KEY=your-costco-key
```

### **1.4 Deploy Backend**
- Click **"Create Web Service"**
- Wait for deployment (5-10 minutes)
- Note your backend URL: `https://your-backend-name.onrender.com`

---

## 🎨 **Step 2: Deploy Frontend to Render**

### **2.1 Create Static Site**
1. Click **"New"** → **"Static Site"**
2. Connect same GitHub repository
3. Select branch: `feature/supplier-api-integrations-complete`

### **2.2 Configure Frontend Service**
```yaml
Name: smart-stock-frontend
Build Command: npm install && npm run build
Publish Directory: dist
Root Directory: frontend
```

### **2.3 Set Environment Variables**
Replace `your-backend-name` with your actual backend service name:

```
NODE_ENV=production
VITE_API_BASE_URL=https://your-backend-name.onrender.com
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### **2.4 Deploy Frontend**
- Click **"Create Static Site"**
- Wait for deployment (3-5 minutes)
- Note your frontend URL: `https://your-frontend-name.onrender.com`

---

## 🔄 **Step 3: Update CORS Configuration**

Your backend needs to allow requests from your frontend domain.

### **3.1 Update Backend CORS**
In your Render backend environment variables, add:
```
FRONTEND_URL=https://your-frontend-name.onrender.com
```

### **3.2 Restart Backend Service**
- Go to your backend service in Render
- Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## ✅ **Step 4: Test Your Deployment**

### **4.1 Test Backend**
Visit: `https://your-backend-name.onrender.com/health`
Should return: `{"status": "healthy"}`

### **4.2 Test Frontend**
Visit: `https://your-frontend-name.onrender.com`
Should show your Smart Stock Ordering System

### **4.3 Test New Features**
1. **Supplier Ordering**: Navigate to Supplier Ordering page
2. **Template Manager**: Try creating a supplier template
3. **Smart Suggestions**: Check for AI-powered suggestions
4. **PDF Generation**: Test order PDF generation
5. **Email Orders**: Test email functionality

---

## 📊 **Latest Features Included**

✅ **Supplier API Integrations**
- Ordermentum, Bidfood, PFD, Coles, Costco
- Email fallback ordering
- API credentials management

✅ **Setup Wizard & Templates**
- Supplier template manager
- Product categorization
- Delivery preferences

✅ **PDF/Email Order Sheets**
- Professional PDF generation
- HTML email templates
- SMTP integration

✅ **Smart Ordering Features**
- AI-powered suggestions
- Low stock detection
- Batch ordering capabilities

✅ **Modern Frontend**
- React + TypeScript
- Tailwind CSS styling
- Real-time calculations

---

## 🔧 **Quick Deploy Commands**

```bash
# 1. Commit latest changes
git add .
git commit -m "feat: latest supplier integrations ready for deployment"
git push origin feature/supplier-api-integrations-complete

# 2. Deploy backend on Render
# Use the configuration above

# 3. Deploy frontend on Render
# Use the configuration above

# 4. Test your deployment
curl https://your-backend-name.onrender.com/health
```

---

## 🆘 **Troubleshooting**

### **Common Issues:**

**1. Backend Not Starting**
- Check environment variables
- Verify requirements.txt
- Check build logs

**2. Frontend Build Fails**
- Check TypeScript errors
- Verify environment variables
- Check node version compatibility

**3. CORS Errors**
- Verify FRONTEND_URL in backend
- Check API_BASE_URL in frontend
- Restart both services

**4. Firebase Connection Issues**
- Verify Firebase credentials
- Check Firestore rules
- Test with `/test-firestore` endpoint

---

## 📞 **Support**

Your deployment URLs:
- **Backend**: `https://your-backend-name.onrender.com`
- **Frontend**: `https://your-frontend-name.onrender.com`
- **Health Check**: `https://your-backend-name.onrender.com/health`

**Branch**: `feature/supplier-api-integrations-complete`
**Latest Commit**: Contains all supplier API integrations and modern UI

---

## 🎯 **Next Steps**

1. **Custom Domain**: Add your own domain to Render
2. **SSL Certificate**: Automatically provided by Render
3. **Monitoring**: Set up Render monitoring
4. **Backup**: Regular Firebase backups
5. **Scaling**: Upgrade to paid plan for production

**Your Smart Stock Ordering System is ready for production! 🚀**