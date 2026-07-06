# Deployment Guide

This project is configured for easy deployment to Render or Vercel. No database is required - it uses in-memory storage.

## Prerequisites

- Google AI Studio API key ([Get one free](https://aistudio.google.com/app/apikey))
- GitHub account

## Option 1: Deploy to Render

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy API Server

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: scam-shield-api
   - **Branch**: main
   - **Root Directory**: artifacts/api-server
   - **Build Command**: pnpm install && pnpm run build
   - **Start Command**: node dist/index.mjs
   - **Runtime**: Node 24
5. Add Environment Variables:
   - `GOOGLE_GEMINI_API_KEY`: Your Google AI API key
   - `SESSION_SECRET`: Generate a random string (use: `openssl rand -base64 32`)
   - `PORT`: 8080
   - `NODE_ENV`: production
6. Click "Create Web Service"

### Step 3: Deploy Frontend

1. Click "New +" → "Web Service"
2. Connect the same GitHub repository
3. Configure:
   - **Name**: scam-shield-frontend
   - **Branch**: main
   - **Root Directory**: artifacts/scamshield
   - **Build Command**: pnpm install && pnpm run build
   - **Start Command**: Leave empty (static site)
   - **Runtime**: Static
4. Add Environment Variables:
   - `VITE_API_URL`: Your API URL from Step 2 (e.g., https://scam-shield-api.onrender.com)
5. Click "Create Web Service"

### Step 4: Update Frontend API URL

After both services are deployed:
1. Go to your frontend service settings
2. Update `VITE_API_URL` to match your API service URL
3. Redeploy the frontend

## Option 2: Deploy to Vercel

### Step 1: Deploy API Server

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: artifacts/api-server
   - **Build Command**: pnpm install && pnpm run build
   - **Output Directory**: dist
   - **Start Command**: node dist/index.mjs
5. Add Environment Variables:
   - `GOOGLE_GEMINI_API_KEY`: Your Google AI API key
   - `SESSION_SECRET`: Generate a random string
   - `PORT`: 8080
   - `NODE_ENV`: production
6. Click "Deploy"

### Step 2: Deploy Frontend

1. Click "Add New Project"
2. Import the same repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: artifacts/scamshield
   - **Build Command**: pnpm install && pnpm run build
   - **Output Directory**: dist/public
4. Add Environment Variables:
   - `VITE_API_URL`: Your API URL from Step 1 (e.g., https://your-api.vercel.app)
5. Click "Deploy"

## Environment Variables Reference

### Required for API Server

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_GEMINI_API_KEY` | Google AI Studio API key | `AQ.Ab8RN6K...` |
| `SESSION_SECRET` | Random secret for sessions | `random_string_here` |
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `production` |

### Required for Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API server URL | `https://scam-shield-api.onrender.com` |

## Important Notes

- **In-Memory Storage**: Data is stored in memory and will be lost when the server restarts. This is suitable for development and demos.
- **Free Tier Limits**: Both Render and Vercel have free tiers with limitations (spin-down after inactivity).
- **API Key Security**: Never commit your `.env` file to GitHub. Always use environment variables in deployment settings.
- **CORS**: The API is configured to allow requests from any origin. For production, you should restrict this to your frontend domain.

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
