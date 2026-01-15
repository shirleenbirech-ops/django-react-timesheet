from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from datetime import timedelta, date
from rest_framework.permissions import IsAuthenticated
from rest_framework.status import HTTP_200_OK, HTTP_404_NOT_FOUND
from timesheet_app.models import Project, Task
from django.contrib.auth.models import User
from django.utils.timezone import now
from timesheet_app.models import UserRole
from timesheet_app.utils.performance_calculator import calculate_employee_snapshot
from rest_framework.permissions import IsAuthenticated, IsManager, IsAdmin, IsEmployee
from timesheet_app.models.performance_model import (
    ProjectPerformance,
    EmployeePerformance,
    TaskEfficiency
)
from timesheet_app.serializers.performance_serializer import ProjectPerformanceSerializer, TaskEfficiencySerializer, EmployeePerformanceSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsManager])
def get_project_performance(request, project_id):
    try:
        project = Project.objects.get(id=project_id)

        #  Ensure manager owns this project
        if project.manager != request.user and not request.user.is_staff:
            return Response({"detail": "Access denied."}, status=403)

        perf = ProjectPerformance.objects.get(project=project)
        serializer = ProjectPerformanceSerializer(perf)
        return Response({
            "message": "Project performance retrieved successfully.",
            "data": serializer.data
        }, status=HTTP_200_OK)
    except (Project.DoesNotExist, ProjectPerformance.DoesNotExist):
        return Response({
            "message": "Project performance not found.",
            "data": {}
        }, status=HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_employee_performance(request, user_id, week_start):
    try:
        from django.contrib.auth.models import User
        from timesheet_app.models import UserRole

        target_user = User.objects.get(id=user_id)
        perf = EmployeePerformance.objects.get(user=target_user, week_start_date=week_start)

        #  Allow if current user is the target user
        if request.user == target_user:
            pass
        # Allow if manager of the employee
        elif hasattr(target_user, 'userrole') and target_user.userrole.manager == request.user:
            pass
        # Allow staff
        elif request.user.is_staff:
            pass
        else:
            return Response({"detail": "Access denied."}, status=403)

        serializer = EmployeePerformanceSerializer(perf)
        return Response({
            "message": "Employee performance retrieved successfully.",
            "data": serializer.data
        }, status=HTTP_200_OK)
    except (EmployeePerformance.DoesNotExist, User.DoesNotExist):
        return Response({
            "message": "Employee performance not found.",
            "data": {}
        }, status=HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_task_efficiency(request, task_id):
    try:
        eff = TaskEfficiency.objects.get(task__id=task_id)
        task = eff.task
        project = task.project

        is_assigned = task.assigned_to == request.user
        is_manager = project.manager == request.user
        is_staff = request.user.is_staff
        is_teammate = Task.objects.filter(id=task.id, assigned_to__userrole__manager=request.user).exists()

        if not (is_assigned or is_manager or is_teammate or is_staff):
            return Response({"detail": "Access denied."}, status=403)

        serializer = TaskEfficiencySerializer(eff)
        return Response({"message": "Task efficiency retrieved.", "data": serializer.data}, status=200)
    except TaskEfficiency.DoesNotExist:
        return Response({"message": "Task efficiency not found."}, status=404)


    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_task_efficiency_for_project(request, project_id):
    from timesheet_app.models.performance_model import TaskEfficiency
    from timesheet_app.serializers.performance_serializer import TaskEfficiencySerializer

    try:
        project = Project.objects.get(id=project_id)

        if project.manager != request.user and not request.user.is_staff:
            return Response({"detail": "Access denied."}, status=403)

        # Get all tasks in this project
        tasks = Task.objects.filter(project=project)

        # Fetch efficiencies for those tasks
        efficiencies = TaskEfficiency.objects.filter(task__in=tasks).select_related("task")

        serializer = TaskEfficiencySerializer(efficiencies, many=True)

        return Response({
            "message": f"Task performance report for project: {project.project_name}",
            "project_id": project_id,
            "total_tasks": tasks.count(),
            "data": serializer.data
        }, status=200)

    except Project.DoesNotExist:
        return Response({"message": "Project not found."}, status=404)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_employee_snapshot(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"message": "User not found."}, status=HTTP_404_NOT_FOUND)

    is_self = request.user.id == user.id
    is_admin = request.user.is_staff

   
    try:
        is_manager = hasattr(user, 'userrole') and user.userrole.manager_id == request.user.id
    except AttributeError:
        is_manager = False

    if not (is_self or is_admin or is_manager):
        return Response({"detail": "Access denied."}, status=403)

    snapshot = calculate_employee_snapshot(user)
    return Response({
        "message": "Employee snapshot retrieved successfully.",
        "data": snapshot
    }, status=HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_task_efficiency(request):
    user = request.user

    # Get all tasks assigned to the user
    tasks = Task.objects.filter(assigned_to=user)

    if not tasks.exists():
        return Response({
            "message": "No tasks assigned to this user.",
            "data": []
        }, status=200)

    # Get TaskEfficiency objects for those tasks
    efficiencies = TaskEfficiency.objects.filter(task__in=tasks).select_related("task", "task__project")
    serializer = TaskEfficiencySerializer(efficiencies, many=True)

    return Response({
        "message": "Task efficiencies fetched for user.",
        "data": serializer.data
    }, status=200)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsManager])
def get_managed_projects(request):
    projects = Project.objects.filter(manager=request.user)
    data = [{"id": p.id, "project_name": p.project_name} for p in projects]
    return Response({"message": "Managed projects retrieved", "data": data}, status=200)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsManager])
def get_project_employees(request, project_id):
    try:
        project = Project.objects.get(id=project_id)

        if project.manager != request.user and not request.user.is_staff:
            return Response({"detail": "Access denied."}, status=403)

        tasks = Task.objects.filter(project=project, assigned_to__isnull=False)
        user_ids = tasks.values_list("assigned_to_id", flat=True).distinct()
        users = User.objects.filter(id__in=user_ids)

        data = [{"id": u.id, "username": u.username} for u in users]

        return Response({"message": "Project employees retrieved", "data": data}, status=200)

    except Project.DoesNotExist:
        return Response({"message": "Project not found."}, status=404)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsManager])
def get_employee_tasks_for_project(request, project_id, employee_id):
    try:
        project = Project.objects.get(id=project_id)
        if project.manager != request.user and not request.user.is_staff:
            return Response({"detail": "Access denied."}, status=403)

        tasks = Task.objects.filter(project=project, assigned_to__id=employee_id)
        efficiencies = TaskEfficiency.objects.filter(task__in=tasks).select_related("task")
        serializer = TaskEfficiencySerializer(efficiencies, many=True)

        return Response({
            "message": "Employee tasks in project retrieved.",
            "data": serializer.data
        }, status=200)
    except Project.DoesNotExist:
        return Response({"message": "Project not found."}, status=404)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_performance_snapshot_summary(request):
    user = request.user
    role = getattr(user, 'userrole', None)

    summary = []

    # === Manager or Admin Overview ===
    if user.is_staff or (role and role.role == "manager"):
        # 1. Over Budget Projects
        over_budget_count = ProjectPerformance.objects.filter(over_budget=True, project__manager=user).count()
        summary.append({
            "id": "budget",
            "label": "Over Budget Projects",
            "stat": f"{over_budget_count} projects",
            "updated": "Today"
        })

        # 2. Stalled Tasks
        stalled_projects = ProjectPerformance.objects.filter(
            stalled_tasks_count__gt=3,
            project__manager=user
        ).count()
        summary.append({
            "id": "stalls",
            "label": "Projects with Stalled Tasks",
            "stat": f"{stalled_projects} projects",
            "updated": "Today"
        })

        # 3. Team Velocity (average tasks/week)
        recent_perfs = EmployeePerformance.objects.filter(
            user__userrole__manager=user,
            week_start_date__gte=now().date() - timedelta(weeks=4)
        )
        avg_velocity = round(sum(p.average_task_per_day * 5 for p in recent_perfs) / (recent_perfs.count() or 1), 1)
        summary.append({
            "id": "velocity",
            "label": "Avg Team Velocity",
            "stat": f"{avg_velocity} tasks/wk",
            "updated": "This Week"
        })

        # 4. Underutilized Employees
        underutilized = recent_perfs.filter(utilization_rate__lt=30).values('user').distinct().count()
        summary.append({
            "id": "utilization",
            "label": "Underutilized Employees",
            "stat": f"{underutilized} team members",
            "updated": "This Week"
        })

    # === Employee Overview ===
    elif role and role.role == "employee":
        from timesheet_app.utils.performance_calculator import calculate_employee_snapshot
        snapshot = calculate_employee_snapshot(user)
        summary = [
            {
                "id": "personal_utilization",
                "label": "Your Utilization Rate",
                "stat": f"{snapshot['utilization_rate']}%",
                "updated": "This Week"
            },
            {
                "id": "context_switch",
                "label": "Context Switches",
                "stat": f"{snapshot['context_switch_count']} switches",
                "updated": "This Week"
            },
            {
                "id": "avg_tasks",
                "label": "Avg Tasks Per Day",
                "stat": f"{snapshot['average_task_per_day']} tasks",
                "updated": "This Week"
            }
        ]

    return Response({"message": "Snapshot summary loaded", "data": summary}, status=HTTP_200_OK)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsManager])
def get_managed_employees(request):
    try:
        # All users whose manager is the currently logged-in manager
        users = User.objects.filter(userrole__manager=request.user)
        data = [{"id": u.id, "username": u.username} for u in users]
        return Response({"message": "Managed employees retrieved", "data": data}, status=200)
    except Exception as e:
        return Response({"message": "Failed to fetch employees", "error": str(e)}, status=500)
    
api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_employee_task_efficiency(request, employee_id):
    try:
        user = User.objects.get(id=employee_id)
    except User.DoesNotExist:
        return Response({"message": "User not found."}, status=404)

    tasks = Task.objects.filter(assigned_to=user)

    if not tasks.exists():
        return Response({"message": "No tasks assigned to this user.", "data": []}, status=200)

    efficiencies = TaskEfficiency.objects.filter(task__in=tasks).select_related("task", "task__project")
    serializer = TaskEfficiencySerializer(efficiencies, many=True)

    return Response({"message": "Task efficiencies retrieved.", "data": serializer.data}, status=200)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_employee_weeks(request, employee_id):
    from timesheet_app.models import Timesheet
    from django.db.models import F

    weeks = (
        Timesheet.objects.filter(user_id=employee_id)
        .values_list("week_start_date", flat=True)
        .order_by("-week_start_date")
        .distinct()
    )

    return Response({"data": sorted(list(weeks), reverse=True)}, status=200)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_employee_info(request, employee_id):
    try:
        user = User.objects.get(id=employee_id)
        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email
        })
    except User.DoesNotExist:
        return Response({"error": "Employee not found."}, status=404)

