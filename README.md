# Timesheet Management System

## Overview
This project is a full-stack **timesheet management system** designed to support structured time tracking, leave management, and performance analytics within a team-based organisation. The system is built using **Django REST Framework** for the backend API and a **Node.js + Vite** powered React frontend.

The application supports **two primary user roles**:
- **Team Members** – submit timesheets, request leave, and view personal performance metrics.
- **Managers** – review and approve timesheets and leave requests, and monitor team-level performance analytics.

The system is designed with extensibility in mind, with **future expansion planned to introduce an Admin role** for global system configuration and user management.

---

## Technology Stack

### Backend
- Django
- Django REST Framework
- RESTful API architecture
- Role-Based Access Control (RBAC)
- SQLite (development)

### Frontend
- React
- Vite build tool
- Node.js runtime
- Component-based UI architecture
- REST API integration

---

## Core Features

### Timesheet Management
- Weekly timesheet submission by team members  
- Task-level time tracking (project and administrative tasks)  
- Manager approval and rejection workflow  
- Resubmission support for rejected timesheets  

### Leave Management
- Leave and absence requests by team members  
- Manager approval or rejection with feedback  
- Validation to prevent overlaps with approved leave or holidays  
- Status tracking for all requests  

### Performance Analytics
- Individual performance metrics for team members  
- Team-level performance insights for managers  
- Analytics derived from approved timesheet and task data  
- Clear separation between personal and managerial views  

### Role-Based Access Control
- Distinct permissions for team members and managers  
- Protected API endpoints based on user role  
- Separate frontend dashboards per role  

---

## Project Structure

```text
timesheet-management-system/
├── back-end/
│   ├── src/
│   │   ├── manage.py
│   │   ├── project/
│   │   └── apps/
│   ├── requirements.txt
│   └── README.md
├── front-end/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
└── README.md
```
## Backend Setup 
1. cd back-end
2. python -m venv .venv
3. source .venv/bin/activate  # Windows: .venv\Scripts\activate
4. pip install -r requirements.txt
5. python manage.py migrate
6. python manage.py runserver

## Frontend Setup 
1. cd front-end
2. npm install
3. npm run dev
