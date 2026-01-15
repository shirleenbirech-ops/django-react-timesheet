from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from timesheet_app.consumers import TimesheetNotificationConsumer

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/timesheet/notifications/", TimesheetNotificationConsumer.as_asgi()),
        ])
    ),
})
