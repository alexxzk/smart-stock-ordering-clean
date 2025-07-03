# Firebase Configuration Debugging Guide

## Current Issue
Firebase config is not working, causing suppliers and inventory pages to fail loading.

## Debug Steps to Follow

### 1. ✅ Check Firebase Config Logging (COMPLETED)

**What was added:**
- Debug logging in `frontend/src/config/firebase.ts`
- Console logs to show Firebase config values
- Environment variables status check

**What to look for:**
After deploying, open your app and check the browser console for:
```
🔥 FIREBASE CONFIG: {
  apiKey: "AIzaSyCaFi..." (should show your actual API key)
  authDomain: "your-project.firebaseapp.com"
  projectId: "your-project-id"
  // ... other values
}

🌍 ENVIRONMENT VARIABLES CHECK: {
  VITE_FIREBASE_API_KEY: "SET" (should all be "SET")
  VITE_FIREBASE_AUTH_DOMAIN: "SET"
  // ... other values should all be "SET"
}
```

**If you see default/fallback values:** Your environment variables are NOT set correctly on Render.

### 2. 🔧 Check Render Environment Variables

**Go to your Render dashboard:**
1. Navigate to your frontend service
2. Click on "Environment" tab
3. Verify these variables are set:

```
VITE_FIREBASE_API_KEY=AIzaSyCaFitFM9ZbS2fjz0QJvocpGLUkzeF5AXI
VITE_FIREBASE_AUTH_DOMAIN=ordix-stock-ordering.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ordix-stock-ordering
VITE_FIREBASE_STORAGE_BUCKET=ordix-stock-ordering.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=758571654408
VITE_FIREBASE_APP_ID=1:758571654408:web:99d197679cab335a56e0bd
VITE_FIREBASE_MEASUREMENT_ID=G-JV7R4PZQHV
```

**Important:**
- No typos in variable names
- All values must be exactly as shown above
- After changing, redeploy your frontend

### 3. 🔥 Update Firestore Rules (TESTING RULES PROVIDED)

**Copy the testing rules from `firestore-testing.rules`:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**To apply in Firebase Console:**
1. Go to Firebase Console → Firestore Database → Rules
2. Replace current rules with the testing rules above
3. Click "Publish"

**⚠️ WARNING:** These are testing rules only. Revert to production rules after debugging.

### 4. 🌐 Check Authorized Domains

**In Firebase Console:**
1. Go to Authentication → Settings → Authorized domains
2. Make sure your Render domain is listed:
   - `your-app-name.onrender.com`
   - `localhost` (for local development)

**If missing:** Click "Add domain" and add your Render deployment URL.

### 5. 🔍 Check Backend CORS Settings

**Current CORS settings in `backend/app/main.py`:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # ← Add your Render domain here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Fix:** Add your Render frontend domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://your-frontend-app.onrender.com"  # ← Add this
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6. 📱 Browser Console Debugging

**What to check:**
1. Open your deployed app
2. Open Developer Tools (F12)
3. Go to Console tab
4. Look for:
   - Firebase config logs (🔥 FIREBASE CONFIG)
   - Environment variables status (🌍 ENVIRONMENT VARIABLES CHECK)
   - Any red error messages

**Common errors to look for:**
- `Firebase: Error (auth/invalid-api-key)`
- `Firestore: PERMISSION_DENIED`
- `CORS policy` errors
- `Network request failed`

## Troubleshooting Checklist

| ✅ | Step | Status | Action Required |
|---|------|--------|----------------|
| ☐ | Firebase config logs show real values | | Check console for 🔥 FIREBASE CONFIG |
| ☐ | All env vars show "SET" | | Fix Render environment variables |
| ☐ | Testing Firestore rules applied | | Apply rules from firestore-testing.rules |
| ☐ | Render domain in authorized domains | | Add domain in Firebase Console |
| ☐ | CORS includes Render domain | | Update main.py CORS settings |
| ☐ | No console errors | | Check browser console for errors |

## Next Steps

1. **Deploy with debugging logs**
2. **Check console output**
3. **Share console logs** (remove secrets)
4. **Apply fixes based on what you find**

## Testing Commands

**To test Firebase connection:**
```bash
# Test backend Firebase connection
curl https://your-backend.onrender.com/test-firestore

# Check if backend is running
curl https://your-backend.onrender.com/health
```

## After Debugging

**Once working:**
1. Remove debug console.log statements from firebase.ts
2. Revert to production Firestore rules
3. Ensure all environment variables are secure

---

**📞 Need Help?**
Share these details:
1. Console output from 🔥 FIREBASE CONFIG
2. Console output from 🌍 ENVIRONMENT VARIABLES CHECK
3. Any red error messages from browser console
4. Your Render frontend and backend URLs