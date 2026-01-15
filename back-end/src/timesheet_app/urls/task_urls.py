from django.urls import path
from ..views.task_view import (
    create_task,
    update_task,
    get_task,
    list_tasks,
    delete_task,
    assign_task,
    get_assigned_tasks
)

urlpatterns = [
    path('create', create_task, name='create_task'),
    path('update/<str:pk>', update_task, name='update_task'),
    path('list', list_tasks, name='list_tasks'),
    path('get_task/<str:pk>', get_task, name='get_task'),
    path('delete/<str:pk>', delete_task, name='delete_task'),
    path('assign/<str:pk>', assign_task, name='assign_task'),  
    path('get_assigned_tasks', get_assigned_tasks, name='get_assigned_tasks')
]
