from django.contrib.auth.models import User
from django.db import models

class UserRole(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="userrole")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    manager = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="managed_employees"
    )


    def __str__(self):
        return f"{self.user.username} - {self.role}"
