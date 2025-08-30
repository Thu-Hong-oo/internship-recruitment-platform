# Google OAuth Setup Guide

## Overview
This guide explains how to set up Google OAuth authentication for the internship AI platform backend.

## Features Added
- **Google OAuth Login/Register**: Users can sign in or create accounts using their Google accounts
- **Account Linking**: Existing users can link their local accounts with Google OAuth
- **Hybrid Authentication**: Users can use both local password and Google OAuth
- **Automatic Email Verification**: Google accounts are automatically verified

## Setup Steps

### 1. Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application" as the application type
6. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
7. Copy the Client ID and Client Secret

### 2. Environment Configuration

Add the following variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Frontend Integration

#### Google Sign-In Button
```html
<!-- Add Google Sign-In script -->
<script src="https://accounts.google.com/gsi/client" async defer></script>

<!-- Google Sign-In button -->
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-callback="handleCredentialResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>
```

#### JavaScript Handler
```javascript
function handleCredentialResponse(response) {
  // Send the ID token to your backend
  fetch('/api/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken: response.credential
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Store token and redirect
      localStorage.setItem('token', data.token);
      // Handle successful login
    } else {
      // Handle error
      console.error(data.error);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}
```

## API Endpoints

### 1. Google OAuth Login/Register
```
POST /api/auth/google
```
**Request Body:**
```json
{
  "idToken": "google_id_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "fullName": "John Doe",
    "avatar": "profile_picture_url",
    "isEmailVerified": true,
    "authMethod": "google"
  },
  "isNew": false
}
```

### 2. Link Google Account
```
POST /api/auth/link-google
Authorization: Bearer <jwt_token>
```
**Request Body:**
```json
{
  "idToken": "google_id_token_here"
}
```

### 3. Unlink Google Account
```
DELETE /api/auth/unlink-google
Authorization: Bearer <jwt_token>
```

## User Model Updates

The User model now includes these new fields:

- `googleId`: Unique Google OAuth ID
- `googleEmail`: Email from Google profile
- `googleProfile`: Google profile information (picture, locale, verified_email)
- `authMethod`: Authentication method ('local', 'google', 'hybrid')

## Security Features

1. **Token Verification**: Google ID tokens are verified using Google's official library
2. **Account Linking Protection**: Prevents linking the same Google account to multiple users
3. **Hybrid Authentication**: Users can use both methods without conflicts
4. **Automatic Verification**: Google accounts are automatically email-verified

## Error Handling

Common error responses:

```json
{
  "success": false,
  "error": "Invalid Google ID token"
}
```

```json
{
  "success": false,
  "error": "This Google account is already linked to another user"
}
```

```json
{
  "success": false,
  "error": "Cannot unlink Google account if it's the only authentication method"
}
```

## Testing

### 1. Test Google OAuth Flow
1. Use Google's OAuth 2.0 Playground
2. Test with valid and invalid tokens
3. Verify user creation and linking

### 2. Test Account Linking
1. Create a local account
2. Link with Google account
3. Verify both authentication methods work

### 3. Test Error Cases
1. Invalid tokens
2. Duplicate Google accounts
3. Unlinking restrictions

## Troubleshooting

### Common Issues

1. **"Invalid Google ID token"**
   - Check if GOOGLE_CLIENT_ID is correct
   - Verify token hasn't expired
   - Ensure Google+ API is enabled

2. **"Google account already linked"**
   - Check if the Google account is used elsewhere
   - Verify account linking logic

3. **CORS Issues**
   - Ensure frontend domain is in authorized origins
   - Check redirect URI configuration

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

## Production Considerations

1. **HTTPS Required**: Google OAuth requires HTTPS in production
2. **Domain Verification**: Verify your domain with Google
3. **Rate Limiting**: Implement rate limiting for OAuth endpoints
4. **Monitoring**: Monitor OAuth success/failure rates
5. **Backup Authentication**: Ensure users can still access accounts if Google OAuth fails

## Support

For issues related to:
- **Google OAuth**: Check Google Cloud Console and documentation
- **Backend Integration**: Review logs and API responses
- **Frontend Integration**: Check browser console and network requests

