from rest_framework import serializers
from .models import CustomUser

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'name', 'preferred_language']
        extra_kwargs = {
            'name': {'required': False},
            'preferred_language': {'required': False},
        }

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', ''),
            preferred_language=validated_data.get('preferred_language', 'en')
        )
        return user