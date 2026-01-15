from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsManager, IsAdmin, IsEmployee
from rest_framework.status import HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_200_OK, HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND
from django.shortcuts import get_object_or_404
from datetime import timedelta, datetime
from timesheet_app.models import UserRole

from django.db.models import Sum
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


from timesheet_app.serializers.timesheet_serializer import TimesheetSerializer, DailyLogSerializer, TaskEntrySerializer, ProjectSerializer
from timesheet_app.models.timesheet_model import Timesheet, DailyLog, TaskEntry,  Project, Task
from timesheet_app.utils.constants import (
    PERMISSION_DENIED_MESSAGE,
    TIMESHEET_CREATED_SUCCESS_MESSAGE,
    TIMESHEET_UPDATE_SUCCESS_MESSAGE,
    ALL_TIMESHEETS_FETCHED_SUCCESS_MESSAGE,
    TIMESHEET_FETCHED_SUCCESS_MESSAGE
)

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsEmployee])
def create_timesheet(request):
    serializer = TimesheetSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        timesheet = serializer.save()

        
        task_ids = []
        for log in request.data.get("daily_logs", []):
            for entry in log.get("task_entries", []):
                task_ids.append(entry.get("task_id"))

        project_ids = Task.objects.filter(id__in=task_ids).values_list("project_id", flat=True).distinct()
        timesheet.projects.set(Project.objects.filter(id__in=project_ids))

        timesheet.update_hours()


        return Response({
            "message": TIMESHEET_CREATED_SUCCESS_MESSAGE,
            "data": TimesheetSerializer(timesheet).data
        }, status=HTTP_201_CREATED)

    return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)



@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsEmployee])
def update_timesheet(request, pk):
    try:
        timesheet = Timesheet.objects.get(id=pk, user=request.user)
    except Timesheet.DoesNotExist:
        return Response({"error": "Timesheet not found."}, status=HTTP_404_NOT_FOUND)

    serializer = TimesheetSerializer(timesheet, data=request.data, context={'request': request})
    if serializer.is_valid():
      

        # Save new content
        serializer.save()

        return Response({"message": "Timesheet updated successfully."}, status=HTTP_200_OK)
    else:
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)



@api_view(["GET"])
@permission_classes([IsAuthenticated, IsEmployee])
def list_all_timesheets(request):
    timesheets = Timesheet.objects.filter(user=request.user).prefetch_related(
        "daily_logs", "projects", "user__userrole__manager"
    )
    serializer = TimesheetSerializer(timesheets, many=True)

    return Response({
        "message": "Timesheets have been fetched correctly",
        "data": serializer.data
    }, status=HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_by_id(request, pk):
    timesheet = get_object_or_404(Timesheet, id=pk)


    if timesheet.user == request.user:
        pass

    
    elif hasattr(timesheet.user, "userrole") and timesheet.user.userrole.manager == request.user:
        pass

    else:
        return Response({"message": PERMISSION_DENIED_MESSAGE}, status=HTTP_403_FORBIDDEN)

    serializer = TimesheetSerializer(timesheet)
    return Response({
        "message": "Timesheet fetched successfully.",
        "data": serializer.data
    }, status=HTTP_200_OK)



@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_all_timesheets(request):
    Timesheet.objects.filter(user=request.user).delete()
    return Response({"message": "All timesheets deleted successfully"}, status=HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_timesheet_for_week(request):
    week_start = request.GET.get("week_start")

    if not week_start:
        return Response({"error": "week_start query parameter is required (format YYYY-MM-DD)"}, status=HTTP_400_BAD_REQUEST)

    try:
        week_start_date = datetime.strptime(week_start, "%Y-%m-%d").date()
    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=HTTP_400_BAD_REQUEST)

    timesheet = Timesheet.objects.filter(user=request.user, week_start_date=week_start_date).first()
    if not timesheet:
        return Response({"exists": False}, status=HTTP_200_OK)

    # Serialize full timesheet instead of entries
    serializer = TimesheetSerializer(timesheet)
    return Response({
        "exists": True,
        "status" : timesheet.approval_status,
        "entries": serializer.data["daily_logs"]
    }, status=HTTP_200_OK)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_work_hours(request):
    week_start = request.GET.get("week_start")

    if not week_start:
        return Response({"error": "week_start parameter is required"}, status=HTTP_400_BAD_REQUEST)

    timesheet = Timesheet.objects.filter(user=request.user, week_start_date=week_start).first()
    if not timesheet:
        return Response({"error": "No timesheet found for this week"}, status=HTTP_400_BAD_REQUEST)

    total_hours = TaskEntry.objects.filter(daily_log__timesheet=timesheet).aggregate(Sum("duration"))["duration__sum"] or 0
    
    overtime_hours = timesheet.overtime_hours

    return Response({
        "week_start_date": week_start,
        "total_hours": total_hours,
        "overtime_hours": overtime_hours,
    }, status=HTTP_200_OK)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsManager])
def manager_approve_timesheet(request, pk):
    timesheet = get_object_or_404(Timesheet, id=pk)

    if timesheet.approval_status != "Pending":
        return Response({"error": "This timesheet has already been processed."}, status=HTTP_400_BAD_REQUEST)

    timesheet.approval_status = "Approved"
    timesheet.manager = request.user
    timesheet.rejection_reason = None
    timesheet.save()

   


    return Response({"message": "Timesheet approved successfully."}, status=HTTP_200_OK)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsManager])
def manager_reject_timesheet(request, pk):
    timesheet = get_object_or_404(Timesheet, id=pk)

    if timesheet.approval_status != "Pending":
        return Response({"error": "This timesheet has already been processed."}, status=HTTP_400_BAD_REQUEST)

    rejection_reason = request.data.get("rejection_reason", "").strip()
    if not rejection_reason:
        return Response({"error": "A rejection reason is required."}, status=HTTP_400_BAD_REQUEST)

    timesheet.approval_status = "Rejected"
    timesheet.manager = request.user
    timesheet.rejection_reason = rejection_reason
    timesheet.save() 

   

    return Response({"message": "Timesheet rejected successfully."}, status=HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsManager])
def get_all_timesheets(request):
    managed_employees = UserRole.objects.filter(manager=request.user).values_list("user", flat=True)
    timesheets = Timesheet.objects.filter(user__in=managed_employees).order_by("-week_start_date")

    if not timesheets.exists():
        return Response({"message": "No timesheets found for your team.", "data": []}, status=HTTP_200_OK)

    serializer = TimesheetSerializer(timesheets, many=True)
    return Response({
        "message": "All timesheets fetched successfully.",
        "data": serializer.data
    }, status=HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsManager])
def get_timesheet_by_manager(request, pk):
    timesheet = get_object_or_404(Timesheet, id=pk)

    if timesheet.user != request.user:
        userrole = getattr(timesheet.user, "userrole", None)
        if not userrole or userrole.manager != request.user:
            return Response({"error": "You do not have permission to view this timesheet."}, status=HTTP_403_FORBIDDEN)

    serializer = TimesheetSerializer(instance=timesheet)
    return Response({
        "message": TIMESHEET_FETCHED_SUCCESS_MESSAGE,
        "data": serializer.data
    }, status=HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_all_timesheets(request):
    user = request.user
    Timesheet.objects.filter(user=user).delete()
    return Response({"message": "All timesheets deleted successfully."}, status=HTTP_200_OK)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsManager])
def delete_employee_timesheets(request, user_id):
    from django.contrib.auth.models import User

    try:
        employee = User.objects.get(id=user_id)
        if employee.userrole.manager != request.user:
            return Response({"error": "Not authorized to delete this user's timesheets."}, status=HTTP_403_FORBIDDEN)

        Timesheet.objects.filter(user=employee).delete()
        return Response({"message": f"All timesheets for {employee.username} deleted successfully."}, status=HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=HTTP_400_BAD_REQUEST)
    

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsManager])
def compare_timesheet_history(request, pk):
    timesheet = get_object_or_404(Timesheet, id=pk)

    # Only allow manager of this employee
    if timesheet.user.userrole.manager != request.user:
        return Response({"error": "Not authorized."}, status=HTTP_403_FORBIDDEN)

    # Get previous timesheets of the same employee, before this one
    previous_timesheets = Timesheet.objects.filter(
        user=timesheet.user,
        week_start_date__lt=timesheet.week_start_date
    ).order_by("-week_start_date")[:5]  # last 5 for comparison

    data = [
        {
            "week_start": ts.week_start_date,
            "total_hours": ts.total_hours
        }
        for ts in previous_timesheets
    ]

    return Response({"history": data}, status=HTTP_200_OK)


