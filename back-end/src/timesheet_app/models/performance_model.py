from django.db import models
from django.contrib.auth.models import User
from timesheet_app.models import Project, Task


class ProjectPerformance(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="performance")

    total_logged_hours = models.FloatField(default=0.0)
    progress_percentage = models.FloatField(default=0.0)

    budget_utilized = models.FloatField(default=0.0)
    budget_remaining = models.FloatField(default=0.0)
    over_budget = models.BooleanField(default=False)
    project_budget = models.FloatField(null=True, blank=True)

    average_task_duration = models.FloatField(default=0.0)
    tasks_completed = models.IntegerField(default=0)
    tasks_remaining = models.IntegerField(default=0)

    last_updated = models.DateTimeField(auto_now=True)
    
    tasks_per_week = models.FloatField(default=0.0, help_text="Average tasks completed per week")
    multi_project_load = models.IntegerField(default=0, help_text="Number of users assigned to other projects")
    forecasted_budget_burn = models.FloatField(default=0.0, help_text="Predicted budget usage based on current burn rate")
    budget_deviation = models.FloatField(default=0.0, help_text="Difference between projected and actual budget usage")
    high_utilization_streak = models.BooleanField(default=False)
    stalled_tasks_count = models.IntegerField(default=0)


    def __str__(self):
        return f"Performance: {self.project.project_name}"


class EmployeePerformance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="performance_metrics")
    week_start_date = models.DateField()

    total_hours = models.FloatField(default=0.0)
    productive_hours = models.FloatField(default=0.0)
    admin_hours = models.FloatField(default=0.0)

    utilization_rate = models.FloatField(default=0.0)
    overutilized = models.BooleanField(default=False)
    underutilized = models.BooleanField(default=False)
    balanced = models.BooleanField(default=True)

    context_switch_count = models.IntegerField(default=0)
    average_task_per_day = models.FloatField(default=0.0)

    last_updated = models.DateTimeField(auto_now=True)
   
    utilization_trend = models.FloatField(default=0.0, help_text="Change from previous week's utilization (%)")
    project_time_allocation = models.JSONField(default=dict, blank=True, help_text="Breakdown of time per project (project_id: hours)")

    multi_project_load = models.IntegerField(default=0, help_text="How many active projects is this user working on?")
    high_utilization_weeks = models.IntegerField(default=0, help_text="Consecutive weeks above 45 productive hours")


    class Meta:
        unique_together = ("user", "week_start_date")

    def __str__(self):
        return f"{self.user.username} - {self.week_start_date}"


class TaskEfficiency(models.Model):
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='efficiency')

    estimated_hours = models.FloatField(default=0.0)
    actual_hours = models.FloatField(default=0.0)
    efficiency_ratio = models.FloatField(default=0.0)
    completion_time = models.FloatField(default=0.0, help_text="How long this task took to complete (in days)")


    overdue = models.BooleanField(default=False)
    on_time = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.task.name} efficiency"
