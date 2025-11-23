# Deployment Guide - DigitalOcean

This guide covers deploying both backend and frontend separately to DigitalOcean.

---

## Prerequisites

1. **DigitalOcean Account** - Sign up at https://www.digitalocean.com
2. **PostgreSQL Database** - Create a Managed PostgreSQL database on DigitalOcean
3. **GitHub Repository** - Push your code to GitHub (recommended for App Platform)
4. **AI Model**: The Llama 3.1 8B model (~5GB) will download automatically on first run. Ensure your deployment has sufficient storage and RAM (~6GB+).

---

## Which Deployment Method Should I Choose?

### ⚠️ **CRITICAL: App Platform is NOT Suitable for AI Model Deployment**

**Why App Platform Fails:**
- ❌ **Ephemeral Storage**: Container storage is wiped on every restart (2GB limit, model is 5GB+)
- ❌ **OOM Kills**: Limited memory causes containers to be killed (exit code 137) during model download/loading
- ❌ **No Persistent Volumes**: Cannot mount persistent storage for the AI model
- ❌ **Infinite Download Loop**: Model downloads, container gets killed, restarts, downloads again (what you're experiencing)

**Result**: The model will keep redownloading indefinitely because:
1. Model downloads to ~85-90%
2. Container runs out of memory → killed (exit code 137)
3. Container restarts → ephemeral storage wiped → model file deleted
4. Download starts again → repeat forever

### ✅ **Use Droplets (REQUIRED for AI Model)**

**Why Droplets Work:**
- ✅ **Persistent Storage**: Files survive restarts (25GB+ SSD included)
- ✅ **Sufficient RAM**: Can allocate 8GB+ RAM for model loading
- ✅ **Full Control**: Can configure everything needed for AI model hosting
- ✅ **Stable**: Model downloads once and stays on disk

**Best for:**
- Projects with large AI models (like this one)
- Need persistent file storage
- Learning server management
- Budget optimization (cheaper than App Platform for this use case)

### 💡 **Recommendation**

**For this project (with AI model):** You **MUST** use **Droplets** for the backend. App Platform will not work.

**Frontend**: Can still use App Platform (Static Site or Web Service) - it doesn't need persistent storage.

---

## Option 1: DigitalOcean App Platform

⚠️ **WARNING: DO NOT USE APP PLATFORM FOR BACKEND WITH AI MODEL**

App Platform is **NOT suitable** for deploying the backend with the AI model because:
- Ephemeral storage (files lost on restart)
- Limited memory (causes OOM kills)
- Model will keep redownloading indefinitely

**Use Droplets for backend instead** (see Option 2 below).

---

**App Platform can still be used for the frontend** (Static Site or Web Service) since it doesn't need persistent storage.

**Important**: Since your backend and frontend are in the same repository (`term-project`), you'll configure each component with its own **Root Directory** pointing to the respective subdirectory.

---

### Deployment Strategy: Same App vs Separate Apps

You have two options:
- **Option A**: Deploy both as components in the same App (recommended, easier to manage)
- **Option B**: Deploy as separate Apps (more isolation, separate URLs)

---

### Option A: Single App with Multiple Components (Recommended)

1. **Create App**
   - Go to DigitalOcean Dashboard → Apps → Create App
   - Connect your GitHub repository (`term-project`)
   - Select the repository and branch (e.g., `main`)

2. **Configure Backend Component**
   - The app will auto-detect a component - configure it as the backend
   - **Component Type**: Web Service
   - **Root Directory**: `backend` ⚠️ **Important: Specify this!**
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Run Command**: `npm start`
   - **HTTP Port**: `8080` (or your configured PORT)
   - **Instance Size**: ⚠️ **CRITICAL - At least 8GB RAM required!**
     - The AI model is ~5GB and needs additional RAM for loading
     - **Minimum**: 8GB RAM (Professional plan)
     - **Recommended**: 16GB RAM for stable operation
     - **Why**: Model download + loading requires significant memory. Without enough RAM, the container will be killed (exit code 137) and restart, causing infinite download loops.
   - **Storage**: ⚠️ **CRITICAL - Container storage is limited to 2GB!**
     - DigitalOcean App Platform containers have only **2GB non-persistent storage**
     - The AI model is **~5GB**, so it won't fit in container storage
     - **Solution**: Use **DigitalOcean Spaces** (object storage) to store the model
     - See "AI Model Storage Setup" section below for detailed instructions

3. **Set Backend Environment Variables**
   ```
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
   CLIENT_URL=https://your-frontend-app.ondigitalocean.app
   ```
   ⚠️ **CRITICAL**: 
   - `CLIENT_URL` must match your frontend URL **exactly** (no trailing slash, no trailing dot)
   - Example: `https://dreaminterpreter-frontend-4adnb.ondigitalocean.app` ✅
   - Wrong: `https://dreaminterpreter-frontend-4adnb.ondigitalocean.app/` ❌ (trailing slash)
   - Wrong: `https://dreaminterpreter-frontend-4adnb.ondigitalocean.app.` ❌ (trailing dot)

4. **Add Frontend Component**
   - Click "Add Component" → Select "Web Service" (NOT Static Site - we need a server for SPA routing!)
   - **Root Directory**: `frontend` ⚠️ **Important: Specify this!**
   - **Build Command**: `npm install && npm run build`
   - **Run Command**: `npm start` (uses `serve -s dist -l 8080` which handles SPA routing automatically)
   - **HTTP Port**: `8080`
   - ⚠️ **Why Web Service?**: The `serve` package with `-s` flag automatically handles SPA routing, serving `index.html` for all routes. This fixes 404 errors on page refresh.

5. **Set Frontend Environment Variables**
   ```
   VITE_API_URL=https://your-backend-app.ondigitalocean.app
   ```
   ⚠️ **Important**: Environment variables must be set before the first build!

6. **Database Setup**
   - Click "Add Database" → Select your PostgreSQL database
   - Or use an existing Managed Database connection string
   - After deployment, run migrations manually via SSH or add a post-deploy script:
     ```bash
     cd backend && npx prisma migrate deploy
     ```

7. **AI Model Storage Setup**
   - **For App Platform**: Container storage is only 2GB, model is ~5GB - use Spaces (see below)
   - **For Droplet**: ✅ No special setup needed! Droplets have persistent storage, model downloads once and stays
   - **Steps**:
     1. Create a DigitalOcean Space:
        - Go to DigitalOcean Dashboard → Spaces → Create a Space
        - Choose a region (same as your app for faster access)
        - Name it (e.g., `dream-interpreter-models`)
        - Choose "Public" or "Private" (private recommended)
     2. Upload the model file:
        - **Recommended: Use `s3cmd`** (more reliable for large files):
          ```bash
          # Install s3cmd (if not already installed)
          # On Ubuntu/Debian:
          sudo apt-get install s3cmd
          # On macOS:
          brew install s3cmd
          
          # Configure s3cmd (use your Space credentials)
          s3cmd --configure
          # Enter:
          # - Access Key: (from Spaces → Settings → Spaces Access Keys)
          # - Secret Key: (from Spaces → Settings → Spaces Access Keys)
          # - Default Region: (your Space region, e.g., nyc3)
          # - S3 Endpoint: https://your-region.digitaloceanspaces.com
          # - DNS-style bucket+hostname: your-space-name.your-region.digitaloceanspaces.com
          # - Use HTTPS: Yes
          # - Use HTTP: No
          
          # Upload the model file
          s3cmd put backend/models/llama-3.1-8b-q4.gguf s3://your-space-name/llama-3.1-8b-q4.gguf
          ```
        - **Alternative: Web interface** (simpler but may timeout on large files):
          - Go to your Space → Files → Upload Files
          - Upload: `backend/models/llama-3.1-8b-q4.gguf`
          - Keep filename as `llama-3.1-8b-q4.gguf`
     3. Get Space credentials (Access Key & Secret Key):
        - **What are these?**: They're like a username and password for your Space, allowing programs (like s3cmd) to upload/download files
        - **⚠️ Important**: These are **Spaces Access Keys** (S3-compatible), NOT the general DigitalOcean API tokens
        - **Where to get them** (Account-level, not Space-specific):
          1. Go to DigitalOcean Dashboard
          2. Click **API** in the left sidebar (or go to https://cloud.digitalocean.com/account/api/spaces)
          3. You'll see two sections:
             - **Personal access tokens** (for general API access) - ❌ NOT what you need
             - **Spaces access keys** (for Spaces/S3 storage) - ✅ THIS is what you need
          4. Scroll down to **Spaces access keys** section
          5. Click **Generate New Key**
          6. Give it a name (e.g., "dream-interpreter-upload")
          7. Click **Generate New Key** button
          8. **IMPORTANT**: Copy both the **Access Key** and **Secret Key** immediately - you can only see the secret key once!
          9. Save them securely (you'll need them for s3cmd and environment variables)
        - **Note**: These keys work for ALL Spaces in your account, not just one Space
        - **If you can't find it**: Make sure you're looking under **API** → **Spaces access keys** (not Personal access tokens)
     4. Set environment variables in App Platform:
        ```
        SPACES_ENDPOINT=https://your-region.digitaloceanspaces.com
        SPACES_KEY=your-access-key
        SPACES_SECRET=your-secret-key
        SPACES_BUCKET=your-space-name
        SPACES_REGION=your-region (e.g., nyc3)
        ```
   - **Alternative (Simpler)**: Use a smaller model that fits in 2GB:
     - Use TinyLlama (~700MB) - less accurate but fits in container storage
     - Set environment variable: `USE_TINYLLAMA=true`
     - The code will automatically download TinyLlama instead

8. **Deploy**
   - Click "Next" → Review → "Create Resources"
   - App Platform will build and deploy both components automatically

**Backend URL**: `https://your-backend-app.ondigitalocean.app`  
**Frontend URL**: `https://your-frontend-app.ondigitalocean.app`

---

### Option B: Separate Apps (Alternative)

#### Backend App

1. **Create Backend App**
   - DigitalOcean Dashboard → Apps → Create App
   - Connect GitHub repository (`term-project`)
   - Select repository and branch

2. **Configure Backend**
   - **Root Directory**: `backend` ⚠️ **Specify this subdirectory!**
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Run Command**: `npm start`
   - **HTTP Port**: `8080`

3. **Set Environment Variables** (same as Option A)

4. **Deploy**

#### Frontend App

1. **Create Frontend App**
   - DigitalOcean Dashboard → Apps → Create App
   - Connect the same GitHub repository (`term-project`)
   - Select same repository and branch

2. **Configure Frontend**
   - **Component Type**: Web Service (NOT Static Site - we need a server for SPA routing!)
   - **Root Directory**: `frontend` ⚠️ **Specify this subdirectory!**
   - **Build Command**: `npm install && npm run build`
   - **Run Command**: `npm start` (uses `serve -s dist -l 8080` which handles SPA routing automatically)
   - **HTTP Port**: `8080`

3. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-backend-app.ondigitalocean.app
   ```

4. **Deploy**

---

## Option 2: DigitalOcean Droplets (More Control)

This approach gives you full server control using Ubuntu droplets.

**Note**: Since your backend and frontend are in the same repository, you'll clone the entire repository and then work from the `backend` or `frontend` subdirectories.

---

### Backend Deployment (Droplet)

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - **⚠️ RAM Requirements** (choose based on your budget):
     - **Option A - TinyLlama (Cheaper)**: 1GB RAM / 1 vCPU (~$6/month)
       - Model: TinyLlama 1.1B (~700MB)
       - Less accurate but works fine for demos
       - Set `AI_MODEL=tinyllama` in environment variables
     - **Option B - Llama 3.1 8B (Best Quality)**: 8GB+ RAM / 2 vCPU (~$48/month)
       - Model: Llama 3.1 8B (~5GB)
       - Much more accurate (recommended for production)
       - Default (no `AI_MODEL` needed, or set `AI_MODEL=llama-3.1-8b`)
   - Add SSH keys for authentication
   - Choose a region close to your users

2. **SSH into Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   apt update && apt upgrade -y
   
   # Install Node.js (v18 or v20)
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   
   # Install Git
   apt install -y git
   
   # Install PM2 for process management
   npm install -g pm2
   ```

4. **Clone and Setup Backend**
   ```bash
   # Clone your repository
   git clone https://github.com/your-username/term-project.git
   cd term-project/backend
   
   # Install dependencies
   npm install
   
   # Build
   npm run build
   
   # Generate Prisma client
   npx prisma generate
   ```

5. **Configure Environment**
   ```bash
   # Create .env file
   nano .env
   ```
   
   Add:
   ```env
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
   CLIENT_URL=https://your-frontend-domain.com
   
   # AI Model Selection (optional)
   # For 1GB RAM Droplet: AI_MODEL=tinyllama
   # For 8GB+ RAM Droplet: AI_MODEL=llama-3.1-8b (or leave unset)
   AI_MODEL=tinyllama
   ```

6. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

7. **Start with PM2**
   ```bash
   # Start the application
   pm2 start dist/server.js --name "dream-interpreter-api"
   
   # Save PM2 configuration
   pm2 save
   
   # Setup PM2 to start on boot
   pm2 startup
   ```

8. **Configure Firewall**
   ```bash
   # Allow HTTP/HTTPS
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 8080/tcp
   ufw enable
   ```

9. **Setup Nginx as Reverse Proxy**
   ```bash
   # Install Nginx
   apt install -y nginx
   
   # Create Nginx config
   nano /etc/nginx/sites-available/dream-api
   ```
   
   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-backend-domain.com;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable the site:
   ```bash
   ln -s /etc/nginx/sites-available/dream-api /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

10. **Setup SSL with Let's Encrypt**
    ```bash
    apt install -y certbot python3-certbot-nginx
    certbot --nginx -d your-backend-domain.com
    ```

---

### Frontend Deployment (Droplet)

1. **Create Another Droplet (or use same)**
   - Ubuntu 22.04 LTS
   - 1GB RAM / 1 vCPU is sufficient for static site
   - Add SSH keys

2. **SSH into Droplet**
   ```bash
   ssh root@your-frontend-droplet-ip
   ```

3. **Install Dependencies**
   ```bash
   apt update && apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs git nginx
   ```

4. **Clone and Build Frontend**
   ```bash
   git clone https://github.com/your-username/term-project.git
   cd term-project/frontend
   
   # Set environment variable for build
   export VITE_API_URL=https://your-backend-domain.com
   
   # Install and build
   npm install
   npm run build
   ```

5. **Deploy to Nginx**
   ```bash
   # Copy build files
   cp -r dist/* /var/www/html/
   
   # Or create dedicated directory
   mkdir -p /var/www/dream-frontend
   cp -r dist/* /var/www/dream-frontend/
   ```

6. **Configure Nginx**
   ```bash
   nano /etc/nginx/sites-available/dream-frontend
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name your-frontend-domain.com;
       root /var/www/dream-frontend;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```
   
   Enable:
   ```bash
   ln -s /etc/nginx/sites-available/dream-frontend /etc/nginx/sites-enabled/
   rm /etc/nginx/sites-enabled/default
   nginx -t
   systemctl restart nginx
   ```

7. **Setup SSL**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your-frontend-domain.com
   ```

---

## Database Setup (DigitalOcean Managed PostgreSQL)

1. **Create Managed Database**
   - DigitalOcean Dashboard → Databases → Create Database
   - Choose PostgreSQL
   - Select region and plan

2. **Get Connection String**
   - Database Dashboard → "Connection Details"
   - Use the "Connection String" format
   - Update `DATABASE_URL` in your backend `.env`

3. **Initial Schema**
   ```bash
   # On your backend server/droplet
   cd backend
   npx prisma migrate deploy
   ```

---

## Environment Variables Reference

### Backend
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
CLIENT_URL=https://your-frontend-domain.com
```

### Frontend (set before build)
```env
VITE_API_URL=https://your-backend-domain.com
```

---

## Post-Deployment Checklist

### Backend
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Environment variables set correctly
- [ ] CORS configured for frontend domain
- [ ] Health check endpoint works (`/health`)
- [ ] SSL certificate installed (if using droplet)

### Frontend
- [ ] `VITE_API_URL` set before build
- [ ] Build successful
- [ ] API calls point to backend URL
- [ ] SSL certificate installed (if using droplet)

---

## Troubleshooting

### Backend Issues
- **Container keeps restarting / Model keeps redownloading (exit code 137)**:
  - **Cause**: Two possible issues:
    1. **Out of Memory (OOM)** - container doesn't have enough RAM
    2. **Out of Storage** - container storage is only 2GB, model is ~5GB
  - **Fix for RAM issue**: Increase instance size to **at least 8GB RAM** (16GB recommended)
    - Go to App Platform → Your Backend Component → Settings → Instance Size
    - Upgrade to **Professional Plan** with **8GB RAM minimum** (16GB recommended)
    - Redeploy
  - **Fix for Storage issue**: Use DigitalOcean Spaces (object storage)
    - Container storage is limited to **2GB** (non-persistent)
    - Model is **~5GB**, so it won't fit
    - **Solution**: Store model in DigitalOcean Spaces, download to container when needed
    - See "AI Model Storage Setup" section above for detailed instructions
  - **Alternative (Simpler)**: Use TinyLlama model (~700MB) that fits in 2GB storage
    - Set environment variable: `AI_MODEL=tinyllama`
    - ⚠️ **Note**: Even with TinyLlama, App Platform may still fail due to OOM kills. Droplets are still recommended.
    - Less accurate but works within storage limits
- **Database connection errors**: Check `DATABASE_URL` and firewall rules
- **CORS errors + 504 Gateway Timeout**: 
  - **504 means backend isn't running**: Check if backend component is deployed and running
  - **Fix CLIENT_URL**: Remove trailing dots/slashes, must be exact match
    - ❌ Wrong: `https://frontend.ondigitalocean.app.` (trailing dot)
    - ✅ Correct: `https://frontend.ondigitalocean.app`
  - **Set NODE_ENV=production**: Without this, CORS allows all origins (dev mode)
  - **Check environment variables**: In App Platform, verify:
    - `NODE_ENV=production` (no quotes, no spaces)
    - `CLIENT_URL=https://your-frontend-app.ondigitalocean.app` (no quotes, no trailing dot)
  - **Check backend logs**: In App Platform → Components → Backend → Runtime Logs
- **Health check failures / "connection refused" errors**:
  - **Fix**: Ensure server binds to `0.0.0.0`, not `localhost`
  - In `server.ts`, use: `app.listen(PORT, '0.0.0.0', callback)`
  - App Platform health checks need the server to listen on all interfaces
- **Build failures**: Check Node.js version (need v18+)

### Frontend Issues
- **404 errors on page reload (e.g., `/login` returns 404 after refresh)**:
  - **Cause**: Single Page Application (SPA) routes need a server to handle client-side routing
  - **Fix**: Use **Web Service** (NOT Static Site) with `npm start` command
  - The `serve -s dist -l 8080` command automatically handles SPA routing by serving `index.html` for all routes
  - **If you're using Static Site**: Change to Web Service in App Platform settings
- **"The application lacks a defined start command" error**: 
  - **Fix**: Ensure you're using Web Service (not Static Site) and set Run Command to `npm start`
- **API calls fail**: Verify `VITE_API_URL` was set before build
- **404 on routes**: Ensure Nginx `try_files` includes `/index.html` (Droplet) or verify Static Site config (App Platform)
- **Build fails**: Check Node.js version and dependencies

#### Fix for Web Service Type (Not Recommended)
If you accidentally configured as Web Service and can't change it:
1. Add `serve` to your frontend `package.json`:
   ```bash
   cd frontend
   npm install --save-dev serve
   ```
2. Add start script to `package.json`:
   ```json
   "scripts": {
     "start": "serve -s dist -l 8080"
   }
   ```
3. In App Platform, set Run Command: `npm start`
4. **Better solution**: Change component type to "Static Site" instead!

### PM2 Commands (Droplet)
```bash
pm2 list              # View running processes
pm2 logs dream-interpreter-api  # View logs
pm2 restart dream-interpreter-api  # Restart
pm2 stop dream-interpreter-api  # Stop
```

---

## Cost Estimation

- **App Platform**: 
  - Backend: ~$5-12/month (Basic plan)
  - Frontend: ~$3/month (Static Site)
  - Database: ~$15/month (Managed PostgreSQL)

- **Droplets**:
  - Backend Droplet: ~$12/month (2GB RAM)
  - Frontend Droplet: ~$6/month (1GB RAM)
  - Database: ~$15/month (Managed PostgreSQL)

---

## Security Recommendations

1. **Use Strong Secrets**: Generate `JWT_SECRET` with `openssl rand -base64 32`
2. **Enable Firewall**: Only open necessary ports (80, 443, 22)
3. **Keep Updated**: Regularly update system packages
4. **Use HTTPS**: Always use SSL certificates in production
5. **Database Access**: Restrict database to specific IPs in DigitalOcean firewall
