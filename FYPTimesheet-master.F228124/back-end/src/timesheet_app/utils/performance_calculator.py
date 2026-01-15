from datetime import timedelta, date
from django.db.models import Sum, Count, Q
from django.utils import timezone


from timesheet_app.models import Timesheet
from timesheet_app.models import Project, Task
from timesheet_app.models  import ProjectPerformance, TaskEfficiency, EmployeePerformance

def calculate_project_performance(project: Project):
    tasks = project.tasks.all()
    logged_hours = tasks.aggregate(total=Sum("logged_hours"))["total"] or 0.0
    completed = tasks.filter(status="Completed").count()
    remaining = tasks.exclude(status="Completed").count()
    total_tasks = completed + remaining

    # === Basic Metrics ===
    avg_task_duration = logged_hours / completed if completed else 0.0
    progress_pct = (completed / total_tasks) * 100 if total_tasks else 0.0
    budget_used = logged_hours * project.hourly_rate
    budget_remaining = max(project.budget - budget_used, 0.0)

    # === Timeline-Based Checks ===
    today = date.today()
    project_days_total = (project.end_date - project.start_date).days if project.start_date and project.end_date else 0
    project_days_elapsed = (today - project.start_date).days if project.start_date else 0
    progress_expected = (project_days_elapsed / project_days_total) * 100 if project_days_total else 0.0
    on_track = progress_pct >= progress_expected if project_days_total else None

    # === Velocity Metrics ===
    recent_weeks = 4
    recent_tasks = tasks.filter(status="Completed", completed_on__gte=today - timedelta(weeks=recent_weeks))
    tasks_per_week = recent_tasks.count() / recent_weeks if recent_tasks.exists() else 0.0

    # === Forecasting ===
    weeks_left = (project.end_date - today).days / 7 if project.end_date else 0
    # Default burn rate is hourly_rate * 40 if insufficient progress (less than 5%)
    burn_rate = (budget_used / progress_pct) if progress_pct > 5 else (project.hourly_rate * 40)
    forecasted_burn = burn_rate * 100 if progress_pct > 5 else burn_rate * weeks_left
    budget_deviation = forecasted_burn - project.budget if progress_pct > 0 else 0.0
    expected_burn = project.budget * (project_days_elapsed / project_days_total) if project_days_total else 0.0

    # === Risk & Load Metrics ===
    stalled_tasks = tasks.filter(updated_at__lte=today - timedelta(days=14), status__in=["Not Started", "In Progress"]).count()
    user_ids = tasks.values_list("assigned_to", flat=True).distinct()
    multi_project_load = (
        Task.objects.filter(assigned_to__in=user_ids)
        .exclude(project=project)
        .values("project")
        .distinct()
        .count()
    )

    # === Save Performance Stats ===
    perf, _ = ProjectPerformance.objects.get_or_create(project=project)
    perf.total_logged_hours = logged_hours
    perf.average_task_duration = avg_task_duration
    perf.tasks_completed = completed
    perf.tasks_remaining = remaining
    perf.progress_percentage = progress_pct
    perf.on_track = on_track
    perf.budget_warning = budget_used > expected_burn
    perf.project_budget = project.budget
    perf.budget_utilized = budget_used
    perf.budget_remaining = budget_remaining
    perf.over_budget = budget_remaining <= 0
    perf.tasks_per_week = tasks_per_week
    perf.forecasted_budget_burn = forecasted_burn
    perf.budget_deviation = budget_deviation
    perf.multi_project_load = multi_project_load
    perf.stalled_tasks_count = stalled_tasks
    perf.save()


def calculate_task_efficiency(task: Task):
    eff, _ = TaskEfficiency.objects.get_or_create(task=task)

    eff.estimated_hours = task.estimated_hours
    eff.actual_hours = task.logged_hours
    eff.efficiency_ratio = round((task.estimated_hours / task.logged_hours) * 100, 2) if task.logged_hours > 0 else 0.0


    # Overdue / On-Time
    if task.due_date:
        today = timezone.now().date()
        eff.overdue = task.status != "Completed" and today > task.due_date
        eff.on_time = task.status == "Completed" and today <= task.due_date

    # Completion time
    if task.status == "Completed" and task.completed_on and task.created:
        eff.completion_time = (task.completed_on - task.created.date()).days

    eff.save()


def calculate_employee_performance(user, week_start_date):
    week_end_date = week_start_date + timedelta(days=6)
    timesheets = Timesheet.objects.filter(user=user, week_start_date=week_start_date)

    total = 0.0
    productive = 0.0
    admin = 0.0
    task_count = 0
    unique_tasks = set()
    project_hours = {}

    for timesheet in timesheets:
        for log in timesheet.daily_logs.all():
            for entry in log.task_entries.select_related("task", "task__project"):
                duration = entry.duration
                task = entry.task
                project_id = task.project_id

                total += duration
                task_count += 1
                unique_tasks.add((log.date, task.id))

                # Categorize time
                if task.category in ["Admin", "Training", "Meeting", "Research"]:
                    admin += duration
                else:
                    productive += duration

                # Project time allocation
                project_hours[project_id] = project_hours.get(project_id, 0.0) + duration

    utilization = round((productive / 40.0) * 100, 2) if total > 0 else 0
    context_switch = len(set(date for date, _ in unique_tasks))
    overutilized = productive > 45
    underutilized = productive < 30
    balanced = not overutilized and not underutilized

    # Multi-project load
    multi_project_load = len(project_hours)

    # High Utilization Weeks
    high_weeks = EmployeePerformance.objects.filter(user=user, productive_hours__gt=45).count()

    # Utilization trend: compare with previous week
    previous_week = week_start_date - timedelta(days=7)
    try:
        last_week = EmployeePerformance.objects.get(user=user, week_start_date=previous_week)
        trend = utilization - last_week.utilization_rate
    except EmployeePerformance.DoesNotExist:
        trend = 0.0

    perf, _ = EmployeePerformance.objects.get_or_create(user=user, week_start_date=week_start_date)
    perf.total_hours = total
    perf.productive_hours = productive
    perf.admin_hours = admin
    perf.utilization_rate = utilization
    perf.overutilized = overutilized
    perf.underutilized = underutilized
    perf.balanced = balanced
    perf.context_switch_count = context_switch
    perf.average_task_per_day = round(task_count / 5, 2) if task_count else 0
    perf.project_time_allocation = project_hours
    perf.multi_project_load = multi_project_load
    perf.high_utilization_weeks = high_weeks
    perf.utilization_trend = trend
    perf.save()

def calculate_employee_snapshot(user):
    timesheets = Timesheet.objects.filter(user=user)

    total = 0.0
    productive = 0.0
    admin = 0.0
    context_switch_days = set()
    task_count = 0
    project_hours = {}

    for ts in timesheets:
        for log in ts.daily_logs.all():
            for entry in log.task_entries.select_related("task", "task__project"):
                duration = entry.duration
                task = entry.task
                project_id = task.project_id

                total += duration
                task_count += 1
                context_switch_days.add(log.date)

                if task.category in ["Admin", "Training", "Meeting", "Research"]:
                    admin += duration
                else:
                    productive += duration

                project_hours[project_id] = project_hours.get(project_id, 0) + duration

    utilization = round((productive / total) * 100, 2) if total else 0.0
    overutilized = productive > 45
    underutilized = productive < 30
    balanced = not overutilized and not underutilized

    return {
        "total_hours": total,
        "productive_hours": productive,
        "admin_hours": admin,
        "utilization_rate": utilization,
        "average_task_per_day": round(task_count / len(timesheets), 2) if timesheets else 0.0,
        "context_switch_count": len(context_switch_days),
        "multi_project_load": len(project_hours),
        "overutilized": overutilized,
        "underutilized": underutilized,
        "balanced": balanced,
        "project_time_allocation": project_hours,
    }



