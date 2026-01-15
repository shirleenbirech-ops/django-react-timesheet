from tokenize import TokenError
from django.contrib.auth import authenticate , logout
from rest_framework.decorators import api_view
from..models import UserRole
from django.contrib.auth.hashers import check_password
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from ..serializers.user_serializer import UserSerializer
from ..serializers.login_serializer import LoginSerializer
from rest_framework.status import  HTTP_400_BAD_REQUEST , HTTP_201_CREATED , HTTP_200_OK , HTTP_401_UNAUTHORIZED
from rest_framework_simplejwt.tokens import RefreshToken , AccessToken
from ..utils.constants import USER_REGISTERED_MESSAGE , USER_LOGGEDIN_MESSAGE , INVAID_CREDENTIALS_MESSAGE , USER_LOGGEDOUT_MESSAGE , REFRESH_TOKEN_REQUIRED_MESSAGE



def get_tokens_for_user(user):
    refresh =  RefreshToken.for_user(user)
    refresh["role"] = user.userrole.role if hasattr(user, "userrole") else "employee"
    refresh.access_token["role"] = refresh["role"]
    return {

        'refresh' : str (refresh),
        'access' : str(refresh.access_token), 

 
    }


@api_view(['POST'])
def refresh_access_token(request):
    refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')

    if not refresh_token:
        return Response({"detail": "Refresh token missing"}, status=HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token)
        user_id = refresh["user_id"] 
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

       
        tokens = get_tokens_for_user(user)

        return Response({ "access": tokens['access'] }, status=HTTP_200_OK)

    except TokenError:
        return Response({"detail": "Invalid or expired refresh token"}, status=HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_logged_in_user(request):
    user = request.user

    try:
        role = user.userrole.role
    except UserRole.DoesNotExist:
        role = "employee"

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": role,
        "first_name":user.first_name, 
    }, status=HTTP_200_OK)



@api_view(['POST'])
def register_user(request):
    response = None
    
    serializer = UserSerializer(data = request.data)
    
    if serializer.is_valid(): 
        user = serializer.save()
        user.set_password(serializer.validated_data['password'])
        user.save()
        
        response_data = {
            "message": USER_REGISTERED_MESSAGE ,
            "data" : serializer.data
        }
        
        response = Response( response_data , status= HTTP_201_CREATED)
    else:
        response = Response(serializer.errors , status= HTTP_400_BAD_REQUEST) 
    
    return response
    

@api_view(['POST'])
def login_user(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response({"message": INVAID_CREDENTIALS_MESSAGE}, status=HTTP_400_BAD_REQUEST)

    tokens = get_tokens_for_user(user)

    try:
        role = user.userrole.role
    except UserRole.DoesNotExist:
        role = "employee"

   
    response = Response({
        'message': f"Welcome, {user.username}",
        'access': tokens["access"],  
        'refresh': tokens["refresh"],
        'user': {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role
        }
    })

    response.set_cookie(
        key='refresh_token',
        value=tokens['refresh'],
        httponly=True,         
        secure=False,          
        
        max_age=7 * 24 * 60 * 60,
        domain="localhost",
        samesite = 'None'
    )

    return response



@api_view(['POST'])
def logout_user(request):
    response = None
    
    refresh_token = request.data.get('refresh_token')  

    if not refresh_token:
        response = Response({"message": "Refresh token is required."}, status=HTTP_401_UNAUTHORIZED)

    try:
        RefreshToken(refresh_token).blacklist()
        response = Response({"message": "User logged out successfully."}, status=HTTP_200_OK)
    except Exception as e:
        response = Response({"error": str(e)}, status=HTTP_401_UNAUTHORIZED)

    return response