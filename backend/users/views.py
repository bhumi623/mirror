from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view,permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import RegisterSerializer
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
# Create your views here.
@api_view(['POST'])
def register_view(request):
    serializer = RegisterSerializer(data = request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'message': 'User created successfully'},
            status = status.HTTP_201_CREATED
    )
    return Response(
        serializer.errors, 
        status = status.HTTP_400_BAD_REQUEST
    )
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'name': user.name,
        'preferred_language': user.preferred_language,
        'is_public': user.is_public,
        'bio': user.bio,
    })
# Tolerates minor clock drift and logs detailed token validation errors.
class TolerantGoogleAdapter(GoogleOAuth2Adapter):
    def _decode_id_token(self, app, id_token):
        import jwt
        orig_decode = jwt.decode
        jwt.decode = lambda *a, **k: orig_decode(*a, **{**k, 'leeway': 600})
        try:
            return super()._decode_id_token(app, id_token)
        except Exception as err:
            print(f"[Google OAuth Error] Token verification failed: {repr(err)}")
            if hasattr(err, '__cause__') and err.__cause__:
                print(f"[Google OAuth Root Cause]: {repr(err.__cause__)}")
            raise err
        finally:
            jwt.decode = orig_decode

class GoogleLogin(SocialLoginView):
    adapter_class = TolerantGoogleAdapter
    callback_url = 'postmessage'
    client_class = OAuth2Client