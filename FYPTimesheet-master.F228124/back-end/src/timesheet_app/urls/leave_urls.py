from django.urls import path
from timesheet_app.views.leave_view import request_leave, track_leave_requests, manage_leave_request, view_all_leave_requests,get_leave_snapshot, get_manager_leave_snapshot

urlpatterns = [
    path('request', request_leave, name="request_leave"),  # 
    path('track', track_leave_requests, name="track_leave"),  # 
    path('manage/<int:leave_id>', manage_leave_request, name="manage_leave"),
    path('manage/all', view_all_leave_requests, name="view_all_leave_requests"),  
    path('get_leave_snapshot', get_leave_snapshot, name="get_leave_snapshot"),
    path('get_manager_leave_snapshot', get_manager_leave_snapshot, name="get_manager_leave_snapshot"), 

]
       
