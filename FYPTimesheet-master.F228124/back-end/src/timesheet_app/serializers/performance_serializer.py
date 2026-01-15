from rest_framework import serializers
from timesheet_app.models.performance_model import (
    ProjectPerformance,
    EmployeePerformance,
    TaskEfficiency
)


class ProjectPerformanceSerializer(serializers.ModelSerializer):
    risks = serializers.SerializerMethodField()

    class Meta:
        model = ProjectPerformance
        fields = '__all__'  # include all model fields
        

    def get_risks(self, obj):
        return {
            "over_budget": obj.over_budget,
            "budget_deviation": obj.budget_deviation,
            "forecasted_budget_burn": obj.forecasted_budget_burn,
            "stalled_tasks_count": obj.stalled_tasks_count,
            "tasks_per_week": obj.tasks_per_week,
            "multi_project_load": obj.multi_project_load
        }
class EmployeePerformanceSerializer(serializers.ModelSerializer):
    risk_summary = serializers.SerializerMethodField()

    class Meta:
        model = EmployeePerformance
        fields = '__all__'
        

    def get_risk_summary(self, obj):
        return {
            "overutilized": obj.overutilized,
            "underutilized": obj.underutilized,
            "balanced": obj.balanced,
            "context_switch_count": obj.context_switch_count,
            "high_utilization_weeks": obj.high_utilization_weeks,
            "multi_project_load": obj.multi_project_load,
            "utilization_trend": obj.utilization_trend
        }
class TaskEfficiencySerializer(serializers.ModelSerializer):
    task_name = serializers.CharField(source="task.name", read_only=True)
    project_name = serializers.CharField(source="task.project.project_name", read_only=True)
    
    on_time = serializers.BooleanField()
    overdue = serializers.BooleanField()
    efficiency_ratio = serializers.FloatField()
    completion_time = serializers.FloatField()

    class Meta:
        model = TaskEfficiency
        fields = [
            "id",
            "task_name",
            "project_name",
            "estimated_hours",
            "actual_hours",
            "on_time",
            "overdue",
            "efficiency_ratio",
            "completion_time",
        ]
