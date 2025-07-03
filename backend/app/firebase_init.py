import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv("config.env")

# Global variables
_db = None

def get_firestore_client():
    """Get Firestore client, initializing Firebase if needed"""
    global _db
    
    if _db is not None:
        return _db
    
    # Initialize Firebase if not already done
    if not firebase_admin._apps:
        try:
            # Check if we're in development mode
            dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
            
            if dev_mode:
                logger.warning("⚠️  Running in DEV_MODE - Firebase operations will be limited")
                # In development mode, return None to indicate Firebase is not available
                # This forces the application to handle the absence of Firebase gracefully
                return None
            
            # For production, require all Firebase environment variables
            firebase_private_key = os.getenv("FIREBASE_PRIVATE_KEY")
            firebase_project_id = os.getenv("FIREBASE_PROJECT_ID")
            firebase_client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
            
            if not all([firebase_private_key, firebase_project_id, firebase_client_email]):
                missing_vars = []
                if not firebase_private_key:
                    missing_vars.append("FIREBASE_PRIVATE_KEY")
                if not firebase_project_id:
                    missing_vars.append("FIREBASE_PROJECT_ID")
                if not firebase_client_email:
                    missing_vars.append("FIREBASE_CLIENT_EMAIL")
                
                logger.error(f"❌ Missing required Firebase environment variables: {', '.join(missing_vars)}")
                raise ValueError(f"Missing required Firebase environment variables: {', '.join(missing_vars)}")
            
            # Create credentials with proper validation
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": firebase_project_id,
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": firebase_private_key.replace("\\n", "\n") if firebase_private_key else "",
                "client_email": firebase_client_email,
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
            })
            
            firebase_admin.initialize_app(cred)
            logger.info("✅ Firebase initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Firebase initialization failed: {e}")
            # In production, we should fail hard rather than silently continue
            raise RuntimeError(f"Firebase initialization failed: {e}")
    
    # Initialize Firestore
    try:
        _db = firestore.client()
        logger.info("✅ Firestore initialized successfully")
        return _db
    except Exception as e:
        logger.error(f"❌ Firestore initialization failed: {e}")
        # Don't return None in production - let the application handle the error
        raise RuntimeError(f"Firestore initialization failed: {e}") 