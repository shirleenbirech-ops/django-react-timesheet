from timesheet_app.models.timesheet_model import Timesheet, DailyLog, TaskEntry
from timesheet_app.models.task_model import Task
from timesheet_app.models.project_model import Project
from django.contrib.auth.models import User
from timesheet_app.utils.performance_calculator import (
    calculate_employee_performance,
    calculate_project_performance,
    calculate_task_efficiency,
)
from datetime import timedelta, date, datetime, time

import random


def seed_performance_data():
    print("🚀 Seeding manager performance data...")

    #  Step 1: Get existing users
    try:
        john = User.objects.get(username="JohnDoe")
    except User.DoesNotExist:
        print(" JohnDoe does not exist. Please create the user first.")
        return

    alice, _ = User.objects.get_or_create(username="AliceSmith", defaults={
        "first_name": "Alice", "last_name": "Smith", "email": "alice@example.com"
    })

    manager, _ = User.objects.get_or_create(username="Manager1", defaults={
        "first_name": "Manager", "last_name": "One", "email": "manager1@example.com", "is_staff": True
    })

   
    base_date = date.today() - timedelta(weeks=4)
    projects = [
        {
            "name": "WebRevamp",
            "budget": 20000,
            "hourly_rate": 100,
            "start": base_date,
            "end": base_date + timedelta(weeks=6),
        },
        {
            "name": "CloudProject",
            "budget": 40000,
            "hourly_rate": 125,
            "start": base_date,
            "end": base_date + timedelta(weeks=8),
        },
        {
            "name": "MobileAppSprint",
            "budget": 30000,
            "hourly_rate": 110,
            "start": base_date,
            "end": base_date + timedelta(weeks=5),
        },
    ]

    created_projects = []

    for proj in projects:
        p, _ = Project.objects.get_or_create(
            project_name=proj["name"],
            defaults={
                "budget": proj["budget"],
                "hourly_rate": proj["hourly_rate"],
                "start_date": proj["start"],
                "end_date": proj["end"],
                "manager": manager,
            }
        )
        created_projects.append(p)

    print(f"📁 Created or reused {len(created_projects)} projects.")

    
    for project in created_projects:
        for i in range(5):  # 5 tasks per project
            t, _ = Task.objects.get_or_create(
                project=project,
                name=f"{project.project_name}_Task_{i+1}",
                defaults={
                    "status": random.choice(["Completed", "In Progress", "Not Started"]),
                    "estimated_hours": random.randint(4, 10),
                    "due_date": project.end_date - timedelta(days=random.randint(1, 15)),
                    "assigned_to": random.choice([john, alice]),
                    "created": datetime.now() - timedelta(days=random.randint(10, 25)),
                }
            )
            if t.status == "Completed":
                t.completed_on = date.today() - timedelta(days=random.randint(0, 14))
                t.logged_hours = random.uniform(3.5, 12.0)
                t.save()

            calculate_task_efficiency(t)

    print("Tasks created and efficiencies calculated.")


    employees = [john, alice]
    for user in employees:
        for week in range(4):
            week_start = base_date + timedelta(weeks=week)
            ts, created = Timesheet.objects.get_or_create(user=user, week_start_date=week_start)
            if created:
                for i in range(5):  # 5 working days
                    log = DailyLog.objects.create(  timesheet=ts, date=week_start + timedelta(days=i), start_time=time(9, 0), end_time=time(17, 0))
                    for _ in range(2):  # 2 tasks per day
                        task = Task.objects.filter(assigned_to=user).order_by("?").first()
                        if not task:
                            continue
                        hours = random.uniform(3, 8)
                        task.logged_hours += hours
                        task.save()
                        TaskEntry.objects.create(daily_log=log, task=task, duration=hours)
            ts.update_hours()
            calculate_employee_performance(user, week_start)

    print("Timesheets and performance generated for users.")

   
    for project in created_projects:
        calculate_project_performance(project)

    print(" Project performance recalculated.")
    print(" Seed complete — check your dashboard!")

