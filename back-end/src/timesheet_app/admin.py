from django.contrib import admin
from .models.project_model import Project
from .models.task_model import Task
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserRole


class CustomUserAdmin(UserAdmin):
    list_display = ('id', 'username', 'email', 'user_id')

    def user_id(self, obj):
        return obj.id
    user_id.short_description = 'User ID'

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Project)
admin.site.register(UserRole)
admin.site.register(Task) 
