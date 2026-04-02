# Production Configuration for Render
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'rhms_secret_key')
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'rhms')
    
    # Email Configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SENDER_EMAIL = os.environ.get('SENDER_EMAIL', '')
    SENDER_PASSWORD = os.environ.get('SENDER_PASSWORD', '')
    EMAIL_ENABLED = os.environ.get('EMAIL_ENABLED', 'True').lower() == 'true'
