from django.db import models
from django.contrib.auth.models import User

class LeaveRequest(models.Model):
    id = models.AutoField(primary_key=True)  # ✅ Auto-incrementing ID instead of UUID
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    LEAVE_TYPES = [
        ('sick', 'Sick Leave'),
        ('vacation', 'Vacation Leave'),
        ('unpaid', 'Unpaid Leave'),
        ('other', 'Other')
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ]

    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    manager_comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.leave_type} ({self.status})"



       