# models.py
from django.db import models
from django.contrib.auth.models import User

class TimesheetTemplate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    daily_logs = models.JSONField()

    def __str__(self):
        return f"{self.name} ({self.user.username})"
