from django.apps import AppConfig


class TimesheetAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'timesheet_app'
    def ready(self):
     import timesheet_app.signals.timesheet_signals
