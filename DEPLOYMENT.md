# Deployment Guide

This project is configured for easy deployment to Vercel (frontend) and Railway (API). No database is required - it uses in-memory storage.

## Prerequisites

- Google AI Studio API key ([Get one free](https://aistudio.google.com/app/apikey))
- GitHub account

## Free Deployment Options

**For Frontend (Vercel):** Completely free, no payment info required
**For API (Railway):** Free tier available, no payment info required

## Option 1: Deploy Frontend to Vercel (Free)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your repository: `adityamittal0786/Scam-Shield-Agent`
4. Configure:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: artifacts/scamshield
   - **Build Command**: pnpm install && pnpm run build
   - **Output Directory**: dist/public
5. Click "Deploy"

**Note:** The frontend will deploy but analysis features won't work without the API server.

## Option 2: Deploy API to Railway (Free)

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Click "Add Variables" and add:
   - `GOOGLE_GEMINI_API_KEY`: Your Google AI API key
   - `PORT`: 8080
   - `NODE_ENV`: production
5. Click "Deploy"
6. After deployment, copy your API URL (e.g., `https://your-app.railway.app`)

## Option 3: Deploy API to Glitch (Free)

1. Go to [glitch.com](https://glitch.com) and sign in
2. Click "New Project" → "Import from GitHub"
3. Enter your repository URL
4. Add environment variables in `.env` file
5. The app will auto-deploy

## Connect Frontend to API

After deploying the API:

1. Go to your Vercel project settings
2. Add environment variable:
   - `VITE_API_URL`: Your Railway/Glitch API URL
3. Redeploy the frontend

## Alternative: Demo Mode (No API Required)

For a demo without API deployment, you can modify the frontend to use mock data. This is suitable for showcasing the UI without actual AI analysis.

## Environment Variables Reference

### Required for API Server

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_GEMINI_API_KEY` | Google AI Studio API key | `AQ.Ab8RN6K...` |
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `production` |

### Required for Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API server URL | `https://your-app.railway.app` |

## Important Notes

- **In-Memory Storage**: Data is stored in memory and will be lost when the server restarts. This is suitable for development and demos.
- **Free Tier Limits**: Railway and Glitch have free tiers with limitations.
- **API Key Security**: Never commit your `.env` file to GitHub. Always use environment variables in deployment settings.
- **CORS**: The API is configured to allow requests from any origin.

## Troubleshooting

### API Server Fails to Start

- Check that all environment variables are set correctly
- Verify the build command completes successfully
- Check the deployment logs for errors

### Frontend Cannot Connect to API

- Verify `VITE_API_URL` is set correctly
- Check that the API server is running
- Ensure CORS is configured correctly in the API

### Build Fails

- Ensure `pnpm` is installed in the build environment
- Check that all dependencies are in `package.json`
- Verify the build command is correct for your directory structure

## Local Development

To run locally:

```bash
# API Server
cd artifacts/api-server
cp .env.example .env
# Edit .env with your API key
pnpm dev

# Frontend (new terminal)
cd artifacts/scamshield
pnpm dev
```

API: http://localhost:8080
Frontend: http://localhost:5173
