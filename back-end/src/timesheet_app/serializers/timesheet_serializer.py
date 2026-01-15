
from rest_framework import serializers
from dateutil.parser import parse
import holidays
from timesheet_app.models.timesheet_model import Timesheet, DailyLog, TaskEntry
from timesheet_app.models.leave_model import LeaveRequest
from timesheet_app.models.task_model import Task
from timesheet_app.serializers.project_serializer import ProjectSerializer
from timesheet_app.serializers.task_serializer import TaskSerializer
from timesheet_app.utils.performance_calculator import calculate_employee_performance, calculate_project_performance,calculate_task_efficiency
from datetime import timedelta, datetime
from django.contrib.auth.models import User


class TaskEntrySerializer(serializers.ModelSerializer):
    task = TaskSerializer(read_only=True)
    task_id = serializers.PrimaryKeyRelatedField(queryset=Task.objects.all(), source='task', write_only=True)

    project_name = serializers.CharField(source="task.project.project_name", read_only=True)
    project_id = serializers.IntegerField(source="task.project.id", read_only=True)

    class Meta:
        model = TaskEntry
        fields = ['id', 'task', 'task_id', 'duration', 'project_name', 'project_id']
class DailyLogSerializer(serializers.ModelSerializer):



    task_entries = TaskEntrySerializer(many=True)

    class Meta:
        model = DailyLog
        fields = ['id', 'date', 'start_time', 'end_time', 'task_entries']

    def create(self, validated_data):
        tasks_data = validated_data.pop('task_entries')
        daily_log = DailyLog.objects.create(**validated_data)
        for task_data in tasks_data:
            TaskEntry.objects.create(daily_log=daily_log, **task_data)
        return daily_log

class TimesheetSerializer(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)
    daily_logs = DailyLogSerializer(many=True)
    total_hours = serializers.ReadOnlyField()
    approval_status = serializers.ReadOnlyField()
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    manager = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    submitted_by = serializers.SerializerMethodField()
    week_start = serializers.SerializerMethodField()



    class Meta:
        model = Timesheet
        fields = [
            'id', 'user', 'manager', 'projects',
            'week_start_date', 'daily_logs',
            'total_hours', 'overtime_hours',
            'approval_status', 'rejection_reason', 'submitted_by', 'week_start'
        ]

    def get_manager(self, obj):
        if hasattr(obj.user, 'userrole') and obj.user.userrole.manager:
            m = obj.user.userrole.manager
            return {
                "id": m.id,
                "first_name": m.first_name,
                "last_name": m.last_name,
                "email": m.email
            }
        return None
    
    def get_user(self,obj):
        if obj.user:
            return {
                "id" : obj.user.id,
                "first_name": obj.user.first_name,
                "last_name" : obj.user.last_name,
                "email" :obj.user.email
            }
    
        return None

    
    def get_projects(self, obj):
       
        projects = set()
        for log in obj.daily_logs.all():
            for task_entry in log.task_entries.all():
                projects.add(task_entry.task.project)
        return [{"id": p.id, "project_name": p.project_name} for p in projects]  
    def get_submitted_by(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return "N/A"

    def get_week_start(self, obj):
        return obj.week_start_date.strftime('%Y-%m-%d') if obj.week_start_date else "N/A"


    def validate(self, data):
        user = self.context["request"].user
        week_start = data.get("week_start_date")
        logs = data.get("daily_logs")

        if isinstance(week_start, str):
            try:
                week_start = parse(week_start).date()
            except Exception:
                raise serializers.ValidationError("Invalid format for week_start_date. Use YYYY-MM-DD.")

        data["week_start_date"] = week_start

        if not logs or len(logs) == 0:
            raise serializers.ValidationError("Please add at least one daily log with task entries.")
        if len(logs) > 5:
            raise serializers.ValidationError("You can only submit logs for 5 working days.")

        uk_holidays = holidays.UnitedKingdom()
        for log in logs:
            log_date = log["date"]
            if log_date.weekday() >= 5:
                raise serializers.ValidationError(f"{log_date} falls on a weekend.")
            if log_date in uk_holidays:
                raise serializers.ValidationError(f"{log_date} is a UK public holiday")

      
        approved_leave = LeaveRequest.objects.filter(user=user, status='approved')
        leave_days = set()
        for leave in approved_leave:
            current = leave.start_date
            while current <= leave.end_date:
                leave_days.add(current)
                current += timedelta(days=1)

        for log in logs:
            if log["date"] in leave_days:
                raise serializers.ValidationError(f"{log['date']} is during an approved leave. You cannot log work on this day.")

        existing = Timesheet.objects.filter(user=user, week_start_date=week_start)
        instance = getattr(self, 'instance', None)
        if instance is not None:
            existing = existing.exclude(id=instance.id)

        if existing.exists(): 
            raise serializers.ValidationError("A timesheet for this week already exists")    

        if not instance:
            latest = Timesheet.objects.filter(user=user).order_by("-week_start_date").first()
            if latest and (week_start - latest.week_start_date).days < 7:
                raise serializers.ValidationError(
                    f"You can only submit a timesheet every 7 days. "
                    f"Last submitted on: {latest.week_start_date}"
                )

        return data


    def create(self, validated_data):

        logs_data = validated_data.pop("daily_logs")
        validated_data["user"] = self.context["request"].user

        timesheet = Timesheet.objects.create(**validated_data)
        touched_projects = set()
        touched_tasks= []


        for log_data in logs_data:
            tasks_data = log_data.pop('task_entries')
            daily_log = DailyLog.objects.create(timesheet=timesheet, **log_data)
            for task in tasks_data:
                task_entry = TaskEntry.objects.create(daily_log=daily_log, **task)
                touched_tasks.append(task_entry.task)
                if task_entry.task.project:
                    touched_projects.add(task_entry.task.project)


        timesheet.update_hours()  
        for task in touched_tasks:
            calculate_task_efficiency(task)

        for project in touched_projects:
            calculate_project_performance(project)

        user = self.context["request"].user
        calculate_employee_performance(user, validated_data["week_start_date"])        


        return timesheet
    

    def update(self, instance, validated_data):
        logs_data = validated_data.pop("daily_logs", [])

        # Reset status and rejection reason on update
        instance.rejection_reason = ""
        instance.approval_status = "Pending"
        instance.week_start_date = validated_data.get("week_start_date", instance.week_start_date)
        instance.save()

        # Delete old logs and task entries
        instance.daily_logs.all().delete()
        touched_projects = set()
        touched_tasks= []



        # Re-create logs and task entries
        for log_data in logs_data:
            tasks_data = log_data.pop("task_entries")
            daily_log = DailyLog.objects.create(timesheet=instance, **log_data)
            

            for task in tasks_data:

                task_entry = TaskEntry.objects.create(daily_log=daily_log, **task)
                touched_tasks.append(task_entry.task)
                if task_entry.task.project:
                    touched_projects.add(task_entry.task.project)
        # Recalculate hours
        instance.update_hours()
        for task in touched_tasks:
            calculate_task_efficiency(task)

        for project in touched_projects:
            calculate_project_performance(project)

        user = self.context["request"].user
        calculate_employee_performance(user, validated_data["week_start_date"])        

        return instance

