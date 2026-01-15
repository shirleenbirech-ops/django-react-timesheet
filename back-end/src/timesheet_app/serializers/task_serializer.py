from rest_framework import serializers
from timesheet_app.models.task_model import Task

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id',
            'name',
            'description',
            'status',
            'estimated_hours',
            'logged_hours',
            'project',
            'project_name',
            'assigned_to',
            'assigned_to_name',
            'requires_assignment'
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}"
        return None
