# Deployment Guide - DigitalOcean

This guide covers deploying both backend and frontend separately to DigitalOcean.

---

## Prerequisites

1. **DigitalOcean Account** - Sign up at https://www.digitalocean.com
2. **PostgreSQL Database** - Create a Managed PostgreSQL database on DigitalOcean
3. **GitHub Repository** - Push your code to GitHub (recommended for App Platform)

---

## Which Deployment Method Should I Choose?

### ✅ **Use App Platform (Recommended for Term Projects)**

**Best for:**
- Term/school projects
- Getting up and running quickly
- Focus on development, not server management
- Automatic SSL and HTTPS
- Simple deployments

**Why**: App Platform handles most of the infrastructure automatically - you just configure your build commands and environment variables. Perfect for learning and demonstrations.

### ⚙️ **Use Droplets (Advanced)**

**Best for:**
- Learning server management and Linux
- Need full control over the server
- Specific infrastructure requirements
- Budget optimization for very high traffic (advanced)

**Why**: Droplets give you a full Ubuntu server to manage yourself. More learning opportunity but more setup and maintenance.

### 💡 **Recommendation**

For a term project, we strongly recommend **App Platform** for both backend and frontend. It's faster to deploy, requires less maintenance, and lets you focus on your project rather than server configuration.

---

## Option 1: DigitalOcean App Platform (Recommended - Easier)

App Platform automatically handles building, deploying, and SSL certificates.

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

3. **Set Backend Environment Variables**
   ```
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
   CLIENT_URL=https://your-frontend-app.ondigitalocean.app
   ```

4. **Add Frontend Component**
   - Click "Add Component" → Select "Static Site" ⚠️ **Critical: Must be Static Site, NOT Web Service!**
   - **Root Directory**: `frontend` ⚠️ **Important: Specify this!**
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - ⚠️ **Do NOT set a Run Command** - Static Sites don't need one!

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

7. **Deploy**
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
   - **Component Type**: Static Site
   - **Root Directory**: `frontend` ⚠️ **Specify this subdirectory!**
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`

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
   - Recommended: 2GB RAM / 1 vCPU minimum
   - Add SSH keys for authentication

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
- **"The application lacks a defined start command" error**: 
  - **Fix**: In App Platform, edit your frontend component → Change component type from "Web Service" to "Static Site"
  - **Why**: Static sites don't need a start command - App Platform serves the built files automatically
  - **If you MUST use Web Service**: Install `serve` package and add start script (see below)
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
