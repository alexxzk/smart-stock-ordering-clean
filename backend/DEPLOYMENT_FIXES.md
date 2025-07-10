# Deployment Fixes and Troubleshooting

## ✅ Python Version and Package Compatibility Issues Fixed

### Problem
- Deployment was failing with `Cannot import 'setuptools.build_meta'` error
- Using Python 3.13.4 which is too new for many packages
- Old package versions (pandas 1.5.3, numpy 1.24.3) don't have Python 3.13 wheels

### Solution Applied
1. **Updated Python Version**: Changed to Python 3.11 (more stable)
2. **Updated Package Versions**: All packages updated to versions with Python 3.11+ support
3. **Added Build Dependencies**: Added setuptools, wheel, pip to requirements
4. **Improved Build Process**: Enhanced build commands and scripts

## 📝 Updated Files

### requirements.txt
- Added build dependencies (setuptools, wheel, pip)
- Updated all packages to newer versions with Python 3.11+ support
- Used >= version ranges for better compatibility

### requirements-stable.txt
- Alternative with pinned stable versions
- Use this if the main requirements.txt still has issues

### Python Version Files
- `runtime.txt`: python-3.11
- `.python-version`: 3.11
- `render.yaml`: PYTHON_VERSION: 3.11

### Build Configuration
- `pyproject.toml`: Added for proper build system configuration
- `build.sh`: Updated to install setuptools first
- `render.yaml`: Enhanced build command

## 🚀 Deployment Options

### Option 1: Use Updated requirements.txt
```bash
pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
```

### Option 2: Use Stable requirements.txt
```bash
pip install -r requirements-stable.txt
```

### Option 3: Use pyproject.toml
```bash
pip install -e .
```

## 🔧 Environment Variables Required

Make sure these are set in your deployment platform:

```bash
# Firebase (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

# App Configuration (Required)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration (Required)
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:5173
```

## 🆘 If Still Having Issues

### Alternative Build Commands
1. `pip install --no-cache-dir -r requirements-stable.txt`
2. `pip install --force-reinstall -r requirements.txt`
3. `pip install setuptools==69.5.1 wheel==0.43.0 && pip install -r requirements.txt`

### Python Version Alternatives
If Python 3.11 still has issues, try:
- Python 3.10: Update all version files to 3.10
- Python 3.12: Update all version files to 3.12

### Package-Specific Issues
- **Prophet**: May need additional system dependencies
- **Pandas/Numpy**: Try installing separately first
- **Firebase**: Ensure credentials are properly formatted

## 📊 Deployment Platforms

### Render
- Uses `render.yaml` configuration
- Set environment variables in dashboard
- Build command: `pip install --upgrade pip setuptools wheel && pip install -r requirements.txt`

### Railway
- Uses `railway.json` configuration
- Automatically detects Python version from runtime.txt
- Set environment variables in Railway dashboard

### Heroku
- Uses `Procfile` and `runtime.txt`
- Use `heroku config:set` for environment variables

## ✅ Verification Steps

After deployment:
1. Check `/health` endpoint
2. Verify Firebase connection
3. Test API endpoints
4. Check logs for any warnings