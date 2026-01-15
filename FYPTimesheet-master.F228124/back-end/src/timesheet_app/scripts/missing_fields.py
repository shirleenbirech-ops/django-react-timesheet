from timesheet_app.models.project_model import Project
from django.utils import timezone
from datetime import timedelta, datetime
import random

from timesheet_app.utils.performance_calculator import calculate_project_performance


def seed_missing_project_fields():
    print("🔧 Seeding missing project fields...")

    projects = Project.objects.all()
    today = timezone.now().date()
    updated_count = 0

    for project in projects:
        updated = False

        
        if not project.start_date:
            project.start_date = today - timedelta(days=random.randint(30, 365))
            updated = True

      
        if not project.end_date:
            is_ongoing = random.choice([True, False])
            if is_ongoing:
                project.end_date = today + timedelta(days=random.randint(7, 60))
            else:
                end_date = project.start_date + timedelta(days=random.randint(30, 365))
                if end_date > today:
                    end_date = today - timedelta(days=random.randint(1, 10))
                project.end_date = end_date
            updated = True

      
        if (not project.completed_hours or project.completed_hours == 0.0) and \
           (not project.outstanding_hours or project.outstanding_hours == 0.0):

            total_hours = random.randint(100, 1000)

            if project.end_date < today:
                # Completed project
                project.completed_hours = float(total_hours)
                project.outstanding_hours = 0.0
            else:
                # Ongoing project
                completed = random.randint(10, total_hours - 10)
                project.completed_hours = float(completed)
                project.outstanding_hours = float(total_hours - completed)

            updated = True

        if updated:
            project.save()
            calculate_project_performance(project)
            updated_count += 1
            print(f" Updated project: {project.project_name} (ID: {project.id})")

    print(f"\n Total projects updated: {updated_count}")
    print("Field population complete.")
