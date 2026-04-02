# Production Configuration for Render with PostgreSQL
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'rhms_secret_key')
    
    # PostgreSQL Configuration
    POSTGRES_HOST = os.environ.get('POSTGRES_HOST', 'localhost')
    POSTGRES_USER = os.environ.get('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD', '')
    POSTGRES_DB = os.environ.get('POSTGRES_DB', 'rhms')
    
    # Email Configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SENDER_EMAIL = os.environ.get('SENDER_EMAIL', '')
    SENDER_PASSWORD = os.environ.get('SENDER_PASSWORD', '')
    EMAIL_ENABLED = os.environ.get('EMAIL_ENABLED', 'True').lower() == 'true'
