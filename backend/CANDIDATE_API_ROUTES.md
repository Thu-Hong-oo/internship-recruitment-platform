# API Documentation for Candidate Role

This document outlines all API endpoints available for the `candidate` role, organized by resource. All endpoints are prefixed with `/api/candidates` and require authentication.

## 1. Core Profile Management (`/api/candidates/me/profile`)

Handles personal information, preferences, and section-based CRUD for the candidate's profile.

- **`GET /`**: Get the full candidate profile.
- **`PATCH /`**: Update core profile sections like `personalInfo` or `preferences`.
- **`GET /:section`**: Get a specific section (e.g., `education`, `experience`).
- **`POST /:section`**: Add a new entry to a section.
- **`PATCH /:section/:id`**: Update a specific entry within a section.
- **`DELETE /:section/:id`**: Delete a specific entry from a section.

## 2. Resume Management (`/api/candidates/me/resume`)

Manages all aspects of a candidate's resume, including uploading, parsing, generating, and versioning.

- **`POST /`**: Upload a new resume file. Can also include an `action=parse` to trigger AI analysis.
- **`GET /`**: Get information about the current resume or all historical versions (`?version=all`).
- **`POST /generate`**: Generate a new resume using AI, based on the candidate's profile data.
- **`POST /generate/:jobId`**: Generate a resume specifically tailored for a given job ID.
- **`GET /view/:id?`**: Stream a specific resume file for viewing in the browser.
- **`PUT /set-current/:id`**: Set a resume from history as the new current version.
- **`PUT /rename`**: Rename the display name of a resume.
- **`DELETE /:id`**: Delete a specific resume version.

## 3. Application Management (`/api/candidates/me/applications`)

Allows candidates to view and manage their job applications.

- **`GET /`**: Get a list of all submitted applications, with filtering options (e.g., by status).
- **`PATCH /:id`**: Perform actions on an application, such as withdrawing it (`action: "withdraw"`).

## 4. Saved Jobs (`/api/candidates/me/saved-jobs`)

Endpoints for managing jobs that the candidate has bookmarked.

- **`GET /`**: Get a list of all saved jobs.
- **`POST /`**: Save a new job (expects `jobId` in the body).
- **`DELETE /`**: Clear all saved jobs.
- **`GET /count`**: Get the total count of saved jobs.
- **`GET /check/:jobId`**: Check if a specific job is already saved.
- **`DELETE /:id`**: Remove a saved job by its SavedJob ID.
- **`DELETE /job/:jobId`**: Remove a saved job by the Job ID.

## 5. Followed Companies (`/api/candidates/me/followed-companies`)

Manages the list of companies the candidate is following.

- **`GET /`**: Get a list of all followed companies.
- **`POST /:id/action`**: Follow or unfollow a company (`action: "follow"` or `action: "unfollow"`).

## 6. Job Interaction (`/api/candidates/jobs`)

Handles interactions with public job listings.

- **`GET /`**: Unified endpoint to search for jobs, view saved jobs, or see jobs from followed companies (using `?type=search|saved|following`).
- **`POST /:id/action`**: Perform actions on a specific job, such as `save`, `unsave`, or `apply`.

## 7. CV Builder (`/api/candidates/me/cv-builder`)

Provides tools and data for the CV building interface.

- **`GET /`**: Get all data required for the CV builder interface.
- **`PUT /`**: Update the CV builder data.
- **`GET /templates`**: Get a list of available CV templates.
- **`POST /preview`**: Generate an HTML preview of a CV with a specific template and data.
- **`POST /generate`**: Generate a final CV (HTML or PDF) and optionally save it to the user's profile.
