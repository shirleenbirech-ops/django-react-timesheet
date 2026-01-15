from django.db import models
from django.contrib.auth.models import User
from datetime import datetime, date
from .project_model import Project
from .task_model import Task

class Timesheet(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="timesheets")
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="managed_timesheets")
    projects = models.ManyToManyField(Project)
    week_start_date = models.DateField()
    total_hours = models.FloatField(default=0.0)
    overtime_hours = models.FloatField(default=0.0)
    approval_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    rejection_reason = models.TextField(blank=True, null=True)

    def update_hours(self):
        total = 0.0
        overtime = 0.0

        for log in self.daily_logs.all():
            for task_entry in log.task_entries.all():
                total += task_entry.duration

        regular = min(total, 40.0)
        overtime = max(total - 40.0, 0.0)

        self.total_hours = total
        self.overtime_hours = overtime
        self.save()

    def __str__(self):
        return f"{self.user.username} - {self.week_start_date}"


class DailyLog(models.Model):
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name="daily_logs")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.timesheet.user.username} - {self.date}"


class TaskEntry(models.Model):
    daily_log = models.ForeignKey(DailyLog, on_delete=models.CASCADE, related_name="task_entries")
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    duration = models.FloatField(help_text="Hours spent on the task (e.g., 2.5 for 2h30m)")

    def __str__(self):
        return f"{self.task.name} - {self.duration}h"
