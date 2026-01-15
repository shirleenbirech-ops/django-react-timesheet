from django.db import models
from django.contrib.auth.models import User
from .project_model import Project

class Task(models.Model):
    STATUS_CHOICES = [
        ('Not Started', 'Not Started'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_billable = models.BooleanField(default=True)
    category = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Optional, this is to help categorize the task"

    )
    requires_assignment = models.BooleanField(
        default=True,
        help_text="If True, this task must be explicitly assigned"
    )
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Not Started')
    estimated_hours = models.FloatField(default=0.0)
    logged_hours = models.FloatField(default=0.0)
    due_date = models.DateField(null=True, blank=True, help_text="Optional deadline for task")
    completed_on = models.DateField(null=True, blank=True, help_text="When the task was completed")
    created = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)



    def __str__(self):
        return f"{self.name} ({self.project.project_name})"
