from django.urls import path
from timesheet_app.views.performance_view import (
    get_project_performance,
    get_employee_performance,
    get_task_efficiency,
    get_task_efficiency_for_project,
    get_employee_snapshot, 
    get_user_task_efficiency,
    get_managed_projects,
    get_project_employees,
    get_employee_tasks_for_project,
    get_performance_snapshot_summary,
    get_managed_employees,
    get_employee_task_efficiency, 
    get_employee_info
)

urlpatterns = [
    path("projects/<int:project_id>", get_project_performance, name="get_project_performance"),
    path("employees/<int:user_id>/week/<str:week_start>", get_employee_performance, name="get_employee_performance"),
    path("tasks/<int:task_id>", get_task_efficiency, name="get_task_efficiency"),
    path("projects/<int:project_id>/tasks/efficiency", get_task_efficiency_for_project, name="get_project_task_efficiencies"),
    path("employees/<int:user_id>/snapshot", get_employee_snapshot, name="get_employee_snapshot"),
    path("employee/task_efficiency", get_user_task_efficiency,name="get_user_task_efficiency"), 
    path("projects/managed", get_managed_projects, name="get_managed_projects"),
    path("projects/<int:project_id>/employees", get_project_employees, name="get_project_employees"),
    path("projects/<int:project_id>/employees/<int:employee_id>/tasks",get_employee_tasks_for_project,name="get_employee_tasks_for_project"),
    path("snapshotsummary", get_performance_snapshot_summary, name="get_performance_snapshot_summary"),
    path("employees", get_managed_employees, name="get_managed_employees"),
    path("employees/<int:employee_id>/task_efficiency", get_employee_task_efficiency, name = "get_employee_task_efficiency"),
    path("employees/<int:employee_id>/info", get_employee_info, name="get_employee_info"),
  #

]
