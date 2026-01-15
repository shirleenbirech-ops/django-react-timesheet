from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    project_name = models.CharField(max_length=100)
    description = models.TextField(max_length=255)
    start_date = models.DateField(null=True, blank=True)
    is_internal = models.BooleanField(default=False)
    is_billable = models.BooleanField(default=True)
    end_date = models.DateField(null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)

   
    budget = models.FloatField(default=0.0)
    completed_hours = models.FloatField(default=0.0)
    outstanding_hours = models.FloatField(default=0.0, null=True, blank=True)
    estimated_completion_time = models.DateField(null=True, blank=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_projects')
    hourly_rate = models.FloatField(default=50.0, help_text="Rate per hour for cost estimation")


    def __str__(self):
        return self.project_name
