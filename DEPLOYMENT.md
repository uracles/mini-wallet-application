# Deployment Guide

This guide covers deployment to various platforms for the Mini Wallet Application.

## Table of Contents
- [Render Deployment](#render-deployment)
- [Railway Deployment](#railway-deployment)
- [Heroku Deployment](#heroku-deployment)
- [AWS EC2 Deployment](#aws-ec2-deployment)
- [Docker Deployment](#docker-deployment)

---

## Render Deployment (Recommended)

Render offers free PostgreSQL and easy deployment from GitHub.

### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/mini-wallet-app.git
   git push -u origin main
   ```

2. **Create PostgreSQL Database**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "PostgreSQL"
   - Name: `mini-wallet-db`
   - Plan: Free
   - Click "Create Database"
   - Copy the **Internal Database URL**

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: `mini-wallet-app`
     - **Environment**: Node
     - **Build Command**: `npm install && npm run migrate`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=<paste-internal-database-url>
   JWT_SECRET=<generate-strong-secret>
   ALCHEMY_API_KEY=<your-alchemy-key>
   ETHERSCAN_API_KEY=<your-etherscan-key>
   ENCRYPTION_KEY=<generate-32-char-key>
   CORS_ORIGIN=*
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be available at `https://mini-wallet-app.onrender.com`

### Generate Secrets:
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Railway Deployment

Railway provides simple deployment with integrated PostgreSQL.

### Steps:

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Add PostgreSQL**
   ```bash
   railway add
   # Select PostgreSQL
   ```

5. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=<your-secret>
   railway variables set ALCHEMY_API_KEY=<your-key>
   railway variables set ETHERSCAN_API_KEY=<your-key>
   railway variables set ENCRYPTION_KEY=<your-key>
   ```

6. **Deploy**
   ```bash
   railway up
   ```

---

## Heroku Deployment

### Prerequisites:
- Heroku CLI installed
- Heroku account

### Steps:

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create App**
   ```bash
   heroku create mini-wallet-app
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=<your-secret>
   heroku config:set ALCHEMY_API_KEY=<your-key>
   heroku config:set ETHERSCAN_API_KEY=<your-key>
   heroku config:set ENCRYPTION_KEY=<your-key>
   ```

5. **Create Procfile**
   ```
   web: npm start
   release: npm run migrate
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **Open App**
   ```bash
   heroku open
   ```

---

## AWS EC2 Deployment

### Steps:

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t2.micro (free tier)
   - Security Group: Allow ports 22, 80, 443, 4000

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib

   # Install PM2
   sudo npm install -g pm2
   ```

4. **Setup PostgreSQL**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE mini_wallet_db;
   CREATE USER wallet_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE mini_wallet_db TO wallet_user;
   \q
   ```

5. **Clone and Setup App**
   ```bash
   git clone https://github.com/yourusername/mini-wallet-app.git
   cd mini-wallet-app
   npm install
   ```

6. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env
   # Edit with your values
   ```

7. **Run Migrations**
   ```bash
   npm run migrate
   ```

8. **Start with PM2**
   ```bash
   pm2 start src/server.js --name mini-wallet-app
   pm2 startup
   pm2 save
   ```

9. **Setup Nginx (Optional)**
   ```bash
   sudo apt install -y nginx
   sudo nano /etc/nginx/sites-available/mini-wallet-app
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mini-wallet-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Docker Deployment

### Using Docker Compose

1. **Build and Run**
   ```bash
   docker-compose up -d
   ```

2. **View Logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop Services**
   ```bash
   docker-compose down
   ```

### Using Docker Only

1. **Build Image**
   ```bash
   docker build -t mini-wallet-app .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     --name mini-wallet-app \
     -p 4000:4000 \
     --env-file .env \
     mini-wallet-app
   ```

### Deploy to Docker Hub

1. **Login**
   ```bash
   docker login
   ```

2. **Tag Image**
   ```bash
   docker tag mini-wallet-app username/mini-wallet-app:latest
   ```

3. **Push to Hub**
   ```bash
   docker push username/mini-wallet-app:latest
   ```

---

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables are set correctly
- [ ] API is accessible at `/graphql`
- [ ] Health check returns 200 at `/health`
- [ ] JWT authentication works
- [ ] Can create wallets
- [ ] Can check balances
- [ ] Logs are being written
- [ ] SSL/HTTPS is configured (for production)
- [ ] Rate limiting is working
- [ ] Error monitoring is set up

---

## Monitoring and Maintenance

### Health Checks

```bash
# Check if app is running
curl https://your-app.com/health

# Check GraphQL endpoint
curl -X POST https://your-app.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}'
```

### View Logs

**Render:**
```
View logs in Render dashboard
```

**Railway:**
```bash
railway logs
```

**Heroku:**
```bash
heroku logs --tail
```

**PM2:**
```bash
pm2 logs mini-wallet-app
```

### Database Backups

**Render:**
- Automatic backups included in paid plans

**Heroku:**
```bash
heroku pg:backups:capture
heroku pg:backups:download
```

**Manual PostgreSQL:**
```bash
pg_dump -U username -d mini_wallet_db > backup.sql
```

---

## Troubleshooting

### Common Issues:

1. **Database Connection Fails**
   - Check DATABASE_URL format
   - Ensure database is accessible
   - Verify credentials

2. **Migrations Don't Run**
   ```bash
   # Run manually
   npm run migrate
   ```

3. **Port Already in Use**
   ```bash
   # Change PORT in .env
   PORT=5000
   ```

4. **JWT Token Invalid**
   - Ensure JWT_SECRET is same across restarts
   - Check token expiration

5. **Blockchain API Errors**
   - Verify API keys are valid
   - Check rate limits
   - Ensure network is accessible

---

## Security Recommendations

1. **Use HTTPS** - Always use SSL in production
2. **Secure Secrets** - Never commit secrets to version control
3. **Rate Limiting** - Keep rate limits enabled
4. **Database Security** - Use strong passwords, restrict access
5. **Regular Updates** - Keep dependencies updated
6. **Monitor Logs** - Set up log monitoring and alerts
7. **Backup Data** - Regular database backups
8. **Environment Isolation** - Separate dev/staging/prod environments

---

## Support

For deployment issues:
- Check the [main README](README.md)
- Review [API Documentation](API_DOCUMENTATION.md)
- Open an issue on GitHub
