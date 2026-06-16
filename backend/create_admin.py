import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

username = 'bhumi'
email = 'bhumiagarwal130@gmail.com'
password = os.environ.get('ADMIN_PASSWORD')

if not password:
    print("ERROR: ADMIN_PASSWORD env var not set!")
else:
    user, created = User.objects.get_or_create(username=username, defaults={'email': email})
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f"{'Created' if created else 'Updated'} superuser successfully!")