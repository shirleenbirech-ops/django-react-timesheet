# urls.py
from django.urls import path
from timesheet_app.views.timesheettemplate_view import create_template, list_templates, load_template, delete_template
urlpatterns = [
    path('create', create_template),
    path('list',list_templates),
    path('load/<int:template_id>',load_template),
    path('<int:template_id>/delete', delete_template),
]
