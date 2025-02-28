# Deployment Guide for 3D Platformer Game

This document provides instructions for deploying your multiplayer 3D platformer game to either Vercel or Cloudflare Pages.

## Option 1: Deploying to Vercel (Recommended)

Vercel offers a straightforward deployment process with excellent support for Node.js applications and WebSocket connections.

### Prerequisites
- A GitHub, GitLab, or Bitbucket account
- Your project code pushed to a repository
- A free Vercel account (https://vercel.com/signup)

### Deployment Steps

1. **Push your code to a repository**
   - Make sure all your changes are committed and pushed to your repository

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your repository from GitHub, GitLab, or Bitbucket
   - Select the repository that contains your game

3. **Configure Project Settings**
   - Project Name: `3d-platformer-game` (or your preferred name)
   - Framework Preset: `Other`
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables**
   - Add the following environment variables:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: Your PostgreSQL database URL (if using a database)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build and deployment to complete (usually 1-2 minutes)

6. **Test Your Deployment**
   - Once deployed, Vercel will provide you with a URL to your live application
   - Test the game functionality, including multiplayer features

7. **Custom Domain (Optional)**
   - In your project settings, navigate to "Domains"
   - Add your custom domain and follow the verification steps

## Option 2: Deploying to Cloudflare Pages

Cloudflare Pages with Workers offers a powerful serverless platform with global distribution.

### Prerequisites
- A GitHub account
- Your project code pushed to a repository
- A free Cloudflare account (https://dash.cloudflare.com/sign-up)

### Deployment Steps

1. **Push your code to a repository**
   - Make sure all your changes are committed and pushed to GitHub

2. **Connect to Cloudflare Pages**
   - Log in to your Cloudflare dashboard
   - Navigate to "Pages"
   - Click "Create a project"
   - Select "Connect to Git"
   - Authorize Cloudflare to access your GitHub repositories
   - Select your game repository

3. **Configure Build Settings**
   - Project name: `3d-platformer-game` (or your preferred name)
   - Production branch: `main` or `master` (whichever you use)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (leave as default)

4. **Environment Variables**
   - Add the following environment variables:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: Your PostgreSQL database URL (if using a database)

5. **Deploy**
   - Click "Save and Deploy"
   - Wait for the build and deployment to finish

6. **Configure Workers**
   - After deployment, go to "Workers & Pages" in your Cloudflare dashboard
   - Find your deployed Pages project
   - Click on "Settings" > "Functions"
   - Enable "Functions" if not already enabled
   - In the project settings, ensure "Compatibility date" is set

7. **Test Your Deployment**
   - Cloudflare will provide you with a URL to your live application
   - Test the game functionality, including multiplayer features

8. **Custom Domain (Optional)**
   - In your Pages project, go to "Custom domains"
   - Click "Set up a custom domain"
   - Follow the instructions to add and verify your domain

## Database Configuration for Production

If your game uses a PostgreSQL database, you'll need to set up a database for production:

1. **Options for PostgreSQL Hosting:**
   - [Neon](https://neon.tech) (Recommended, offers a free tier)
   - [Supabase](https://supabase.com) (Good alternative with free tier)
   - [Railway](https://railway.app) (Developer-friendly option)
   - [Render](https://render.com) (Simple setup with free tier)

2. **After setting up your database:**
   - Get the database connection string
   - Add it as the `DATABASE_URL` environment variable in your deployment platform
   - Make sure the connection string includes username, password, host, port, and database name

3. **Initialize the database schema:**
   - Run `npm run db:push` to initialize your database schema
   - Or use the database provider's interface to run the migration SQL

## Troubleshooting Common Issues

### WebSocket Connection Failed
- Check that your `vercel.json` file correctly configures WebSocket routes
- For Cloudflare, ensure the WebSocket routes are properly set up in `_routes.json`

### Database Connection Issues
- Verify your DATABASE_URL is correctly formatted
- Check if your database provider allows connections from your deployment platform
- You may need to configure SSL certificates or connection options

### Build Failures
- Check the build logs for specific errors
- Ensure all dependencies are properly listed in package.json
- Verify that the build command and output directory are correctly configured

## Keeping Your Deployment Updated

### Continuous Deployment
Both Vercel and Cloudflare Pages support continuous deployment. When you push changes to your repository, your application will automatically rebuild and deploy.

### Manual Deployments
You can also manually trigger new deployments from the Vercel or Cloudflare dashboards whenever needed.

---

For additional support, refer to the official documentation:
- [Vercel Documentation](https://vercel.com/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)