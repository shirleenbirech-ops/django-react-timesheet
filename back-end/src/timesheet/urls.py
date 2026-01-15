from django.contrib import admin
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path , include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/project/' , include("timesheet_app.urls.project_urls")),
    path('api/auth/' , include("timesheet_app.urls.auth_urls")),
    path('api/timesheet/' , include("timesheet_app.urls.timesheet_urls")),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/leave/', include("timesheet_app.urls.leave_urls")),
    path('api/task/', include("timesheet_app.urls.task_urls")),
    path('api/performance/', include("timesheet_app.urls.performance_urls")),
    path('api/template/', include("timesheet_app.urls.template_urls"))
]
