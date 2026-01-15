# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from timesheet_app.models.timesheettemplate_model import TimesheetTemplate

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_template(request):
    name = request.data.get("name")
    daily_logs = request.data.get("daily_logs")

    if not name or not daily_logs:
        return Response({"error": "Name and daily logs required"}, status=400)

    template = TimesheetTemplate.objects.create(
        user=request.user,
        name=name,
        daily_logs=daily_logs
    )
    return Response({"message": "Template created", "id": template.id})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_templates(request):
    templates = TimesheetTemplate.objects.filter(user=request.user)
    return Response([
        {"id": t.id, "name": t.name} for t in templates
    ])

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def load_template(request, template_id):
    try:
        template = TimesheetTemplate.objects.get(id=template_id, user=request.user)
        return Response({
            "id": template.id,
            "name": template.name,
            "daily_logs": template.daily_logs
        })
    except TimesheetTemplate.DoesNotExist:
        return Response({"error": "Template not found"}, status=404)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_template(request, template_id):
    try:
        template = TimesheetTemplate.objects.get(id=template_id, user=request.user)
        template.delete()
        return Response({"message": "Template deleted"})
    except TimesheetTemplate.DoesNotExist:
        return Response({"error": "Template not found"}, status=404)
