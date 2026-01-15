from locust import HttpUser, TaskSet, task, between

class TimesheetTaskSet(TaskSet):
    @task
    def get_timesheet(self):
        
        self.client.get("/api/timesheet/manager/100", headers={
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ2MTE1NjAyLCJpYXQiOjE3NDYwOTQwMDIsImp0aSI6IjNiYzY5MTg2OWExYjRjMzY4OTRhNzRkY2M4MzBhYjljIiwidXNlcl9pZCI6MTQsInJvbGUiOiJtYW5hZ2VyIn0.vrR4yzDB7J7dCM8L5n_ktWDt9GKQJSP5TakXzAgu7Hc"
        })

    @task
    def list_timesheets(self):
        self.client.get("/api/timesheet/all", headers={
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ2MTE1NjAyLCJpYXQiOjE3NDYwOTQwMDIsImp0aSI6IjNiYzY5MTg2OWExYjRjMzY4OTRhNzRkY2M4MzBhYjljIiwidXNlcl9pZCI6MTQsInJvbGUiOiJtYW5hZ2VyIn0.vrR4yzDB7J7dCM8L5n_ktWDt9GKQJSP5TakXzAgu7Hc"
        })

class WebsiteUser(HttpUser):
    tasks = [TimesheetTaskSet]
    wait_time = between(1, 5)  
