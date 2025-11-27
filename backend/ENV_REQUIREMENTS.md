# 🌱 Environment Variables Checklist

Use this checklist to ensure every service in the learning-resource pipeline has the credentials it needs. Copy these keys into your local `.env` file (not committed) before running `npm run dev`.

| Category | Variable | Required? | Notes |
|----------|----------|-----------|-------|
| Core App | `NODE_ENV` | Optional | `development` by default |
|          | `PORT` | Optional | Defaults to `3000` |
| Database | `MONGO_URI` | ✅ | MongoDB connection string |
| Cache    | `REDIS_URL` | Optional | Enables Redis-backed queues/caching |
| OAuth    | `GOOGLE_CLIENT_ID` | ✅ | Used for Google login |
|          | `GOOGLE_CLIENT_SECRET` | ✅ | — |
|          | `GOOGLE_REDIRECT_URI` | ✅ | e.g. `http://localhost:3000/api/auth/google/callback` |
| AI       | `GEMINI_API_KEY` | ✅ for AI features | Needed for Gemini-based roadmap enhancements |
|          | `GEMINI_MODEL` | Optional | Defaults to `gemini-1.5-flash` |
| Learning APIs | `YOUTUBE_API_KEY` | ✅ | Fetches fresh video resources |
|             | `GITHUB_TOKEN` | 🔒 Recommended | Increases GitHub rate-limit 80× |
|             | `GOOGLE_SEARCH_API_KEY` | ✅ (for backup search) | Enables Google Custom Search fallback |
|             | `GOOGLE_SEARCH_ENGINE_ID` | ✅ (pair with key) | Programmable Search Engine ID |
|             | `STACKOVERFLOW_API_KEY` | Optional | Adds reliability for Stack Overflow API |
| Mailer   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | ✅ | Gmail/SES/etc. credentials |
|          | `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS` | ✅ | Branding for outbound mails |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | ✅ | Required for CV/resume assets |
| JWT      | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRE` | ✅ | Auth token settings |
| Frontend | `FRONTEND_URL`, `CLIENT_URL` | Optional | Set when deploying separate frontend |

## Quick Setup Snippet
Add the following block to your local `.env` file and replace placeholder values:

```bash
YOUTUBE_API_KEY=AIzaSy...your_key
GITHUB_TOKEN=ghp_your_token   # remove spaces!
GOOGLE_SEARCH_API_KEY=AIzaSy...your_key
GOOGLE_SEARCH_ENGINE_ID=0123456789:abcdef
STACKOVERFLOW_API_KEY=optional_but_recommended
```

> **Why?**  
> - Google Custom Search is only invoked when other APIs run dry. Without both `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID`, the service logs “credentials not set” and skips the backup search.  
> - GitHub Awesome Lists fall back to 60 requests/hour without `GITHUB_TOKEN`, which is not enough once you crawl multiple skills. Supplying a token unlocks 5,000 requests/hour; if you cannot, the code now auto-limits to 1 repo per skill to avoid rate-limit errors.

## Verification
Run:

```bash
node scripts/check-env.js
```

_(The helper script prints the current `process.env` state and highlights missing keys.)_

If you see warnings like `Google Search API credentials not set` or `GitHub API rate limit exceeded`, re-check the table above.

