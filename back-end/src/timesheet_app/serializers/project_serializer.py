from rest_framework import serializers
from ..models.project_model import Project

class ProjectSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id',
            'project_name',
            'description',
            'start_date',
            'end_date',
            'budget',
            'completed_hours',
            'outstanding_hours',
            'estimated_completion_time',
            'manager',
            'manager_name'
        ]

    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}"
        return None
