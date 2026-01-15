from rest_framework import serializers
from timesheet_app.models.leave_model import LeaveRequest
from datetime import timedelta, date
import holidays

class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['id', 'user', 'status', 'manager_comment', 'created_at']

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if start_date > end_date:
            raise serializers.ValidationError("Start date must be before end date.")

        # Handle leaves that span multiple years
        years = set(range(start_date.year, end_date.year + 1))
        uk_holidays = []
        for y in years:
            uk_holidays.extend(holidays.UnitedKingdom(years=y).keys())

        # Calculate valid leave days (exclude weekends and public holidays)
        current_day = start_date
        valid_leave_days = 0

        while current_day <= end_date:
            if current_day.weekday() < 5 and current_day not in uk_holidays:
                valid_leave_days += 1
            current_day += timedelta(days=1)

        if valid_leave_days == 0:
            raise serializers.ValidationError("Leave cannot consist solely of weekends or public holidays.")

        return data
