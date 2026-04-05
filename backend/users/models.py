from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.
class CustomUser(AbstractUser):
    name = models.CharField(max_length=100, blank = True)
    preferred_language = models.CharField(
        max_length = 10,
        choices = [
            ('en', 'English'),
            ('hi', 'Hindi'),
            ('hinglish', 'Hinglish')
        ],
        default = 'en'
    )
    avatar_url = models.URLField(blank = True)
    is_public = models.BooleanField(default = False)
    bio = models.CharField(max_length = 140,blank = True)
    theme_color = models.CharField(max_length = 7, default = '#6366f1')
