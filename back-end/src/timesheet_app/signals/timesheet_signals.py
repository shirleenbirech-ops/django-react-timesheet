from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import timedelta, date
from timesheet_app.models.timesheet_model import Timesheet
from timesheet_app.utils.performance_calculator import (
    calculate_employee_performance,
    calculate_task_efficiency,
    calculate_project_performance
)
from datetime import date


@receiver(post_save, sender=Timesheet)
def update_performance_on_approval(sender, instance, **kwargs):
    if instance.approval_status == "Approved":
        user = instance.user
        week_start = instance.week_start_date

        # Recalculate employee performance
        calculate_employee_performance(user, week_start)

        # Recalculate task + project metrics
        for log in instance.daily_logs.all():
            for task_entry in log.task_entries.select_related("task", "daily_log"):
                task = task_entry.task
                project = task.project
                calculate_task_efficiency(task)
                calculate_project_performance(project)
