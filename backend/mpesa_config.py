# M-Pesa Daraja API Configuration
# Replace placeholder values with your actual Daraja API credentials

# Daraja API Credentials (Get from https://developer.safaricom.co.ke)
MPESA_CONSUMER_KEY = "YOUR_CONSUMER_KEY_HERE"
MPESA_CONSUMER_SECRET = "YOUR_CONSUMER_SECRET_HERE"
MPESA_PASSKEY = "YOUR_PASSKEY_HERE"

# M-Pesa Configuration
MPESA_SHORTCODE = "6013828"  # Your till number (PayBill number)
MPESA_CALLBACK_URL = "http://localhost:5000/mpesa-callback"  # For development
# For production, use: "https://yourdomain.com/mpesa-callback"

# Environment Configuration
MPESA_ENVIRONMENT = "sandbox"  # "sandbox" for testing, "production" for live

# API Endpoints
if MPESA_ENVIRONMENT == "production":
    MPESA_OAUTH_URL = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    MPESA_STK_URL = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
else:
    MPESA_OAUTH_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    MPESA_STK_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

# Transaction Details
TRANSACTION_TYPE = "CustomerPayBillOnline"
ACCOUNT_REFERENCE_PREFIX = "RHMS"
TRANSACTION_DESCRIPTION = "RHMS Rental Payment"

# Retry Configuration
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

# Logging
ENABLE_MPESA_LOGGING = True
