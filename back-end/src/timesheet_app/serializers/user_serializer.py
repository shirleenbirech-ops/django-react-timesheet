from django.contrib.auth.models import User
from rest_framework import serializers
from ..models import UserRole

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']


    def get_role(self, obj) :
        try:
            return obj.userrole.role
        except UserRole.DoesNotExist:
            return None    
