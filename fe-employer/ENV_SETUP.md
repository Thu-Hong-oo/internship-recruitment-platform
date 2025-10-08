# Environment Setup

## Environment Variables

The application uses the following environment variables:

### API Configuration

- `NEXT_PUBLIC_API_URL`: Base URL for the API endpoints (default: `http://localhost:3000/api`)

## Setup Instructions

1. Copy the environment file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Update the values in `.env.local` according to your environment:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

## API Structure

The application now uses centralized API functions organized by domain:

- **Main API** (`lib/api.ts`): Handles authentication, registration, email verification, and employer profile
- **Company API** (`lib/companyAPI.ts`): Handles company information, logo upload, and cover image upload
- **Job API** (`lib/jobAPI.ts`): Handles job creation, management, applications, and review submission
- **Document API** (`lib/documentAPI.ts`): Handles document management operations

All API calls use the `NEXT_PUBLIC_API_URL` environment variable for consistent endpoint configuration.
