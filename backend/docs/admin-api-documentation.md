# Admin API Documentation

## Overview
This document provides detailed information about the Admin API endpoints, including their purpose, HTTP methods, request parameters, and example responses.

---

## Endpoints

### 1. Dashboard
- **GET /admin/dashboard**
  - **Description**: Retrieve system dashboard data.
  - **Response**:
    ```json
    {
      "users": 1200,
      "jobs": 450,
      "employers": 300
    }
    ```

---

### 2. User Management
- **GET /admin/users**
  - **Description**: Retrieve a list of all users.

- **POST /admin/users**
  - **Description**: Create a new user.
  - **Request Body**:
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user"
    }
    ```

- **GET /admin/users/:id**
  - **Description**: Retrieve details of a specific user.

- **PUT /admin/users/:id**
  - **Description**: Update user details.

- **DELETE /admin/users/:id**
  - **Description**: Delete a user.

- **PATCH /admin/users/:id/status**
  - **Description**: Update the status of a user.

---

### 3. Employer Management
- **GET /admin/employers**
  - **Description**: Retrieve a list of all employers.

- **GET /admin/employers/:id**
  - **Description**: Retrieve details of a specific employer.

- **PATCH /admin/employers/:id/status**
  - **Description**: Update the status of an employer.

---

### 4. Company Management
- **GET /admin/companies**
  - **Description**: Retrieve a list of all companies.

- **POST /admin/companies**
  - **Description**: Create a new company.

- **GET /admin/companies/:id**
  - **Description**: Retrieve details of a specific company.

- **PUT /admin/companies/:id**
  - **Description**: Update company details.

- **DELETE /admin/companies/:id**
  - **Description**: Delete a company.

---

### 5. Job Management
- **GET /admin/jobs**
  - **Description**: Retrieve a list of all jobs.

- **POST /admin/jobs**
  - **Description**: Create a new job.

- **GET /admin/jobs/:id**
  - **Description**: Retrieve details of a specific job.

- **PUT /admin/jobs/:id**
  - **Description**: Update job details.

- **DELETE /admin/jobs/:id**
  - **Description**: Delete a job.

---

### 6. System
- **GET /admin/stats**
  - **Description**: Retrieve system statistics.

- **GET /admin/logs**
  - **Description**: Retrieve system logs.

- **GET /admin/health**
  - **Description**: Check system health.

- **PATCH /admin/settings**
  - **Description**: Update system settings.

---

## Notes
- All endpoints require authentication and admin authorization.
- Use the `Authorization` header with a valid token to access these endpoints.