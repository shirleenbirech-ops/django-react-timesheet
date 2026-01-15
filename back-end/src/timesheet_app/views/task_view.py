from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST
from timesheet_app import models
from timesheet_app.models.project_model import Project
from timesheet_app.models.task_model import Task
from timesheet_app.serializers.task_serializer import TaskSerializer
from django.shortcuts import get_object_or_404
from django.db.models import Q


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_task(request):
    serializer = TaskSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Task created successfully.", "data": serializer.data}, status=HTTP_201_CREATED)
    return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_tasks(request):
    tasks = Task.objects.all()
    serializer = TaskSerializer(tasks, many=True)
    return Response({"message": "All tasks retrieved successfully.", "data": serializer.data}, status=HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_task(request, pk):
    task = get_object_or_404(Task, pk=pk)
    serializer = TaskSerializer(task)
    return Response({"message": "Task details fetched successfully.", "data": serializer.data}, status=HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_task(request, pk):
    task = get_object_or_404(Task, pk=pk)
    serializer = TaskSerializer(instance=task, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Task updated successfully.", "data": serializer.data}, status=HTTP_200_OK)
    return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_task(request, pk):
    task = get_object_or_404(Task, pk=pk)
    task.delete()
    return Response({"message": "Task deleted successfully."}, status=HTTP_200_OK)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def assign_task(request, pk):
    """
    Assign or reassign a task to a user.
    Expected payload: { "assigned_to": user_id, "status": "In Progress" }
    """
    task = get_object_or_404(Task, id=pk)

    assigned_to_id = request.data.get("assigned_to")
    status = request.data.get("status", task.status)  # Optional update

    if not assigned_to_id:
        return Response({"error": "assigned_to is required."}, status=HTTP_400_BAD_REQUEST)

    try:
        task.assigned_to_id = assigned_to_id
        task.status = status
        task.save()
    except Exception as e:
        return Response({"error": str(e)}, status=HTTP_400_BAD_REQUEST)

    return Response({
        "message": "Task assigned successfully.",
        "data": TaskSerializer(task).data
    }, status=HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assigned_tasks(request):
    """
    Return tasks:
    - Explicitly assigned to the current user (requires_assignment = True AND assigned_to = user)
    - OR self-selectable internal tasks (requires_assignment = False)
    """
    user = request.user
    tasks = Task.objects.filter(
        Q(assigned_to=user, requires_assignment=True) |
        Q(requires_assignment=False)
    ).select_related("project")

    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data, status=HTTP_200_OK)


