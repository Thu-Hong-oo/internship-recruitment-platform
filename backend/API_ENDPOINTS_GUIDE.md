# API Endpoints Guide - Internship Recruitment Platform

## Base URL
```
http://localhost:3000/api
```

## Authentication Endpoints

### 1. Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Company Registration:**
```json
{
  "email": "company@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Manager",
  "role": "company",
  "companyName": "Tech Company Ltd",
  "companyInfo": "A technology company specializing in software development"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "fullName": "John Doe",
    "isEmailVerified": false
  }
}
```

### 2. Verify Email (OTP)
```http
POST /auth/verify-email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 3. Verify Email (URL)
```http
GET /auth/verify-email/{token}
```

### 4. Resend OTP
```http
POST /auth/resend-otp
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### 5. Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "fullName": "John Doe",
    "avatar": "",
    "isEmailVerified": true
  }
}
```

### 6. Get Current User
```http
GET /auth/me
```

**Headers:**
```
Authorization: Bearer {token}
```

### 7. Update User Details
```http
PUT /auth/updatedetails
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "education": {
    "school": "University of Technology",
    "degree": "Bachelor of Science",
    "fieldOfStudy": "Computer Science",
    "graduationYear": 2024,
    "gpa": 3.5
  }
}
```

### 8. Update User Profile (with Skills & Experience)
```http
PUT /auth/profile
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "education": {
    "school": "University of Technology",
    "degree": "Bachelor of Science",
    "fieldOfStudy": "Computer Science",
    "graduationYear": 2024,
    "gpa": 3.5
  },
  "skills": [
    {
      "name": "JavaScript",
      "level": "intermediate",
      "yearsOfExperience": 2
    },
    {
      "name": "React",
      "level": "advanced",
      "yearsOfExperience": 3
    },
    {
      "name": "Node.js",
      "level": "beginner",
      "yearsOfExperience": 1
    }
  ],
  "experience": [
    {
      "title": "Frontend Developer",
      "company": "Tech Corp",
      "location": "New York, NY",
      "from": "2022-01-01",
      "to": "2023-12-31",
      "current": false,
      "description": "Developed responsive web applications using React and JavaScript"
    },
    {
      "title": "Software Engineer Intern",
      "company": "Startup Inc",
      "location": "San Francisco, CA",
      "from": "2023-06-01",
      "to": "2023-08-31",
      "current": false,
      "description": "Worked on backend development using Node.js and MongoDB"
    }
  ]
}
```

### 9. Update Password
```http
PUT /auth/updatepassword
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### 10. Update User Preferences
```http
PUT /auth/update-preferences
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "jobAlerts": true,
  "emailNotifications": true,
  "pushNotifications": false,
  "privacySettings": {
    "profileVisibility": "public"
  }
}
```

### 11. Upload Avatar (TODO)
```http
POST /auth/upload-avatar
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### 12. Upload Resume (TODO)
```http
POST /auth/upload-resume
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### 13. Forgot Password
```http
POST /auth/forgotpassword
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### 14. Reset Password
```http
PUT /auth/resetpassword/{resettoken}
```

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

### 15. Logout
```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer {token}
```

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Update Profile (with token)
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name",
    "phone": "+1234567890",
    "skills": [
      {
        "name": "JavaScript",
        "level": "intermediate",
        "yearsOfExperience": 2
      }
    ]
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing with Postman

### 1. Environment Variables
Set up environment variables in Postman:
- `base_url`: `http://localhost:3000/api`
- `token`: (will be set after login)

### 2. Collection Setup
Create a collection with the following structure:
```
Internship Platform API
├── Authentication
│   ├── Register User
│   ├── Login User
│   ├── Get Current User
│   ├── Update Profile
│   ├── Update Password
│   ├── Logout
│   └── Email Verification
│       ├── Verify Email (OTP)
│       ├── Verify Email (URL)
│       └── Resend OTP
└── User Management
    ├── Upload Avatar
    ├── Upload Resume
    └── Update Preferences
```

### 3. Pre-request Scripts
For login endpoint, add this script to automatically set the token:
```javascript
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    if (jsonData.success && jsonData.token) {
        pm.environment.set("token", jsonData.token);
    }
});
```

### 4. Authorization
For protected endpoints, use:
- Type: `Bearer Token`
- Token: `{{token}}`

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Route /api/auth/profile not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Common Issues & Solutions

### 1. 404 Route Not Found
- Check if the route is properly defined in `src/routes/auth.js`
- Verify the HTTP method (GET, POST, PUT, DELETE)
- Check if the route is properly mounted in `server.js`

### 2. 401 Unauthorized
- Ensure the token is valid and not expired
- Check if the token is properly formatted: `Bearer {token}`
- Verify the user is logged in

### 3. 400 Bad Request
- Check request body format (JSON)
- Verify required fields are provided
- Check data validation rules

### 4. Email Verification Issues
- Ensure email configuration is set up in `.env`
- Check if OTP is not expired (10 minutes)
- Verify email address is correct

## Rate Limiting
- Default: 100 requests per 15 minutes
- Configured in `server.js`

## Security Features
- JWT token authentication
- Password hashing with bcrypt
- Email verification required
- Rate limiting
- Input validation
- CORS protection
