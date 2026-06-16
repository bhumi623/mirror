import os
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        from django.contrib.sites.models import Site
        from allauth.socialaccount.models import SocialApp

        site, _ = Site.objects.update_or_create(
            id=1,
            defaults={
                'domain': 'mirror-1-dkmh.onrender.com',
                'name': 'Mirror'
            }
        )

        app, created = SocialApp.objects.get_or_create(
            provider='google',
            defaults={
                'name': 'Google',
                'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
                'secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
            }
        )
        app.sites.add(site)
        self.stdout.write('Done!')