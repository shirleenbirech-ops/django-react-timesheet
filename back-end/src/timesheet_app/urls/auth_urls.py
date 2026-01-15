from django.urls import path
from ..views.auth_view import register_user , login_user , logout_user, get_logged_in_user, refresh_access_token
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path('register' , register_user , name='register_user'),
    path('login' , login_user , name='login_user' ),
    path('logout' , logout_user , name='logout_user' ),
    path('loggedinuser', get_logged_in_user, name="loggedinuser"),
    path('refresh', refresh_access_token, name='refresh_token'),
    
    
]