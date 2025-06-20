# WebSocket Server Deployment Guide

## Quick Deploy to Heroku

1. Create a new folder for your server:

```bash
mkdir swimming-lms-websocket-server
cd swimming-lms-websocket-server
```

2. Copy these files:

- `websocket-server-example.js` (rename to `server.js`)
- `websocket-server-package.json` (rename to `package.json`)

3. Initialize Git and deploy:

```bash
git init
git add .
git commit -m "Initial WebSocket server"

# Install Heroku CLI, then:
heroku create your-app-name-websocket
git push heroku main
```

4. Update your environment variable:

```env
NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-app-name-websocket.herokuapp.com
```

## Alternative: Railway (Easier)

1. Push your server code to GitHub
2. Go to railway.app
3. Connect your GitHub repo
4. Deploy automatically
5. Get your URL: `https://your-app.railway.app`

## Environment Variables to Set

In your Netlify dashboard, set:

```
NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-deployed-server.com
NEXT_PUBLIC_USE_MOCK_SOCKET=false
```
