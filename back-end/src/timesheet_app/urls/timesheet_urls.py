from django.urls import path
from ..views.timesheet_view import create_timesheet, update_timesheet , list_all_timesheets , get_by_id, delete_all_timesheets,get_work_hours,get_timesheet_by_manager, manager_approve_timesheet, manager_reject_timesheet, get_all_timesheets, check_timesheet_for_week, delete_all_timesheets, delete_employee_timesheets, compare_timesheet_history


urlpatterns = [
    path('create' , create_timesheet , name='create_timesheet'),
    path('update/<str:pk>' , update_timesheet , name='update_timesheet'),
    path('list' , list_all_timesheets , name='list_all_timesheets'),
    path('get/<str:pk>' , get_by_id , name='get_by_id'),
    path('delete-all', delete_all_timesheets, name='delete_all_timesheets'),
    path("work-hours", get_work_hours, name="get_work_hours"),
    path("all", get_all_timesheets, name="get_all_timesheets"),
   
    path("manager/<str:pk>", get_timesheet_by_manager, name="get_timesheet_by_manager"),
    path("manager/<str:pk>/approve", manager_approve_timesheet, name="manager_approve_timesheet"),
    path("manager/<str:pk>/reject", manager_reject_timesheet, name="manager_reject_timesheet"),
    path("check", check_timesheet_for_week, name="check_timesheet_for_week"),
    path("delete_all", delete_all_timesheets,name="delete_all_timesheets" ),
    path("manager_delete_all", delete_employee_timesheets, name="delete_employee_timesheets"),
    path("manager/<str:pk>/compare", compare_timesheet_history, name="compare_timesheet_history"),
    



]