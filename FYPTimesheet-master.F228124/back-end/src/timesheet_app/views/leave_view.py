from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_200_OK
from timesheet_app.models.leave_model import LeaveRequest
from timesheet_app.serializers.leave_serializer import LeaveRequestSerializer
from rest_framework.permissions import IsAuthenticated, IsManager, IsEmployee
from timesheet_app.models import UserRole
from datetime import date



@api_view(['POST'])
@permission_classes([IsAuthenticated, IsEmployee])
def request_leave(request):
    """
    Allow employees to request leave.
    """
    serializer = LeaveRequestSerializer(data=request.data)

    if serializer.is_valid():
        leave_request = serializer.save(user=request.user)
        return Response({"message": "Leave request submitted successfully.",
                         "leave_id": leave_request.id}, status=HTTP_201_CREATED) 

    return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)



@api_view(['GET'])
@permission_classes([IsAuthenticated, IsEmployee])
def track_leave_requests(request):
    """
    Allow employees to view the status of their leave requests.
    """
    leave_requests = LeaveRequest.objects.filter(user=request.user)
    
    serializer = LeaveRequestSerializer(leave_requests, many=True)
    return Response(serializer.data, status=HTTP_200_OK)


# Managers can approve/reject leave requests
@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsManager])
def manage_leave_request(request, leave_id):
    """
    Allow managers to approve or reject leave requests.
    """
    print(f"🔹 Received leave_id: {leave_id} (Type: {type(leave_id)})")  # Debugging

    try:
        #  Convert leave_id to an integer (since we switched from UUID)
        leave_id = int(leave_id)

        #  Fetch leave request
        leave_request = LeaveRequest.objects.get(id=leave_id)

        print(f" Found Leave Request: ID={leave_request.id}, Status={leave_request.status}")

    except LeaveRequest.DoesNotExist:
        print(f"❌ Leave request NOT found in database for ID: {leave_id}")
        return Response({"message": "Leave request not found."}, status=HTTP_400_BAD_REQUEST)

    except ValueError:
        print(f"❌ Invalid leave request ID format: {leave_id}")
        return Response({"message": "Invalid leave request ID format."}, status=HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"❌ Unexpected error while querying: {str(e)}")
        return Response({"message": "Internal server error while retrieving the request."}, status=HTTP_400_BAD_REQUEST)

    #  Ensure status is provided in request data
    status = request.data.get("status")
    if not status:
        return Response({"error": "Status is required."}, status=HTTP_400_BAD_REQUEST)

    status = status.lower()
    manager_comment = request.data.get("manager_comment", "")

    #  Validate status choices
    if status not in ["approved", "rejected"]:
        return Response({"error": "Invalid status. Must be 'approved' or 'rejected'."}, status=HTTP_400_BAD_REQUEST)

    #  Prevent updating already processed requests
    if leave_request.status != "pending":
        print(f"❌ Leave request already processed: ID={leave_request.id}, Status={leave_request.status}")
        return Response({"error": "This request has already been processed."}, status=HTTP_400_BAD_REQUEST)

    print(f"🔄 Updating Leave Request {leave_request.id} to status {status}")

    try:
        #  Save changes
        leave_request.status = status
        leave_request.manager_comment = manager_comment
        leave_request.save()

        print(f" SUCCESS: Leave request updated to {leave_request.status}")

        return Response({"message": f"Leave request {status} successfully."}, status=HTTP_200_OK)

    except Exception as e:
        print(f"❌ Unexpected error while saving: {str(e)}")
        return Response({"message": "Internal server error while updating the request."}, status=HTTP_400_BAD_REQUEST)


#  Managers can view all leave requests
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManager])
def view_all_leave_requests(request):
    """
    Allow managers to view all leave requests from employees.
    """
    leave_requests = LeaveRequest.objects.all().order_by('-created_at')
    
    serializer = LeaveRequestSerializer(leave_requests, many=True)
    return Response(serializer.data, status=HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_leave_snapshot(request):
    user = request.user

    # Get all leave requests for the user
    leave_requests = LeaveRequest.objects.filter(user=user)

    # Calculate approved leave days
    approved_days = sum([
        (leave.end_date - leave.start_date).days + 1
        for leave in leave_requests.filter(status="approved")
    ])

    total_entitled_days = 35
    remaining_days = max(total_entitled_days - approved_days, 0)

    # Count by status using lowercase keys
    pending_count = leave_requests.filter(status="pending").count()
    approved_count = leave_requests.filter(status="approved").count()
    rejected_count = leave_requests.filter(status="rejected").count()

    return Response({
        "remaining_days": remaining_days,
        "pending": pending_count,
        "approved": approved_count,
        "rejected": rejected_count
    })
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsManager])
def get_manager_leave_snapshot(request):
    user_role = getattr(request.user, 'userrole', None)

    if not user_role or user_role.role != 'manager':
        return Response({"error": "Only managers can access this view."}, status=403)

    manager = request.user

    managed_user_ids = UserRole.objects.filter(manager=manager).values_list("user_id", flat=True)

    team_requests = LeaveRequest.objects.filter(user_id__in=managed_user_ids)

    today = date.today()
    team_on_leave = team_requests.filter(status="approved", start_date__lte=today, end_date__gte=today)
    pending_requests = team_requests.filter(status="pending").count()

    my_requests = LeaveRequest.objects.filter(user=manager, status="approved")
    my_approved_days = sum([(leave.end_date - leave.start_date).days + 1 for leave in my_requests])
    manager_remaining_days = max(35 - my_approved_days, 0)

    on_leave_list = [
        {
            "employee": f"{req.user.first_name} {req.user.last_name}" if req.user.first_name else req.user.username,
            "start_date": req.start_date,
            "end_date": req.end_date,
            "reason": req.reason
        }
        for req in team_on_leave
    ]

    return Response({
        "manager_remaining_days": manager_remaining_days,
        "team_on_leave": len(on_leave_list),
        "pending_requests": pending_requests,
        "on_leave_list": on_leave_list
    }, status=HTTP_200_OK)

