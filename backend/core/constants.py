# Centralized domain and service URLs.
from decouple import config

API_HOST = config('BACKEND_HOST', default='mirror-backend-jnw6.onrender.com')
APP_URL = config('FRONTEND_URL', default='https://mirror-delta-vert.vercel.app')
ML_URL = config('ML_SERVICE_URL', default='http://localhost:8001')
SITE_URL = config('BACKEND_URL', default=f'https://{API_HOST}')

DEV_HOSTS = ['localhost', '127.0.0.1']
DEV_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
