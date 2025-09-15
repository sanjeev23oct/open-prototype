# Deployment Guide

This guide covers deploying the AI Prototype Generator to various platforms.

## 🚀 Quick Deploy Options

### Vercel (Recommended for Frontend)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sanjeev23oct/open-prototype)

### Railway (Recommended for Full Stack)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/your-template-id)

### Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/sanjeev23oct/open-prototype)

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- LiteLLM API access or AI provider API keys
- Domain name (optional)

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_prototype_generator"

# LiteLLM Configuration
LITELLM_BASE_URL="http://localhost:4000"
LITELLM_API_KEY="your-litellm-api-key"

# AI Provider Keys (choose one or more)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
DEEPSEEK_API_KEY="your-deepseek-key"

# Application
NODE_ENV="production"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Security
JWT_SECRET="your-jwt-secret-key"
CORS_ORIGIN="http://localhost:3000"

# Optional: File Storage
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_BUCKET_NAME="your-bucket-name"
AWS_REGION="us-east-1"
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone and setup**
   ```bash
   git clone https://github.com/sanjeev23oct/open-prototype.git
   cd open-prototype
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Build and run**
   ```bash
   docker-compose up -d
   ```

3. **Initialize database**
   ```bash
   docker-compose exec backend npm run db:migrate
   docker-compose exec backend npm run db:seed
   ```

### Custom Docker Build

```bash
# Build backend
docker build -t ai-prototype-backend ./backend

# Build frontend
docker build -t ai-prototype-frontend ./frontend

# Run with docker-compose
docker-compose up -d
```

## ☁️ Cloud Platform Deployments

### Vercel (Frontend Only)

1. **Fork the repository**
2. **Connect to Vercel**
   - Import your GitHub repository
   - Set build command: `cd frontend && npm run build`
   - Set output directory: `frontend/dist`

3. **Environment Variables**
   ```bash
   VITE_API_URL=https://your-backend-url.com
   VITE_WS_URL=wss://your-backend-url.com
   ```

### Railway (Full Stack)

1. **Connect Repository**
   - Connect your GitHub repository to Railway
   - Railway will auto-detect the monorepo structure

2. **Configure Services**
   
   **Backend Service:**
   ```bash
   # Build Command
   cd backend && npm install && npm run build
   
   # Start Command
   cd backend && npm start
   
   # Environment Variables
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PORT=${{PORT}}
   ```

   **Frontend Service:**
   ```bash
   # Build Command
   cd frontend && npm install && npm run build
   
   # Start Command
   cd frontend && npm run preview
   ```

3. **Add PostgreSQL**
   - Add PostgreSQL plugin in Railway
   - Database URL will be automatically set

### Heroku

1. **Create Heroku Apps**
   ```bash
   # Backend
   heroku create your-app-backend
   
   # Frontend  
   heroku create your-app-frontend
   ```

2. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev -a your-app-backend
   ```

3. **Configure Buildpacks**
   ```bash
   # Backend
   heroku buildpacks:set heroku/nodejs -a your-app-backend
   
   # Frontend
   heroku buildpacks:set heroku/nodejs -a your-app-frontend
   ```

4. **Deploy**
   ```bash
   # Backend
   git subtree push --prefix backend heroku-backend main
   
   # Frontend
   git subtree push --prefix frontend heroku-frontend main
   ```

### AWS (Advanced)

#### Using AWS App Runner

1. **Create apprunner.yaml**
   ```yaml
   version: 1.0
   runtime: nodejs18
   build:
     commands:
       build:
         - npm install
         - npm run build
   run:
     runtime-version: 18
     command: npm start
     network:
       port: 3001
       env: PORT
   ```

#### Using AWS ECS with Fargate

1. **Create task definition**
2. **Set up Application Load Balancer**
3. **Configure RDS PostgreSQL**
4. **Deploy using ECS service**

## 🗄️ Database Setup

### PostgreSQL Setup

1. **Create Database**
   ```sql
   CREATE DATABASE ai_prototype_generator;
   CREATE USER app_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE ai_prototype_generator TO app_user;
   ```

2. **Run Migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Managed Database Options

- **Supabase**: Free PostgreSQL with built-in auth
- **PlanetScale**: Serverless MySQL (requires schema changes)
- **Railway PostgreSQL**: Simple setup with Railway
- **AWS RDS**: Production-grade managed database
- **Google Cloud SQL**: Scalable managed database

## 🔐 Security Configuration

### SSL/TLS Setup

1. **Obtain SSL Certificate**
   - Let's Encrypt (free)
   - Cloudflare (free with proxy)
   - AWS Certificate Manager

2. **Configure HTTPS**
   ```bash
   # In production environment
   HTTPS=true
   SSL_CERT_PATH=/path/to/cert.pem
   SSL_KEY_PATH=/path/to/key.pem
   ```

### Security Headers

Add to your reverse proxy or application:

```nginx
# Nginx configuration
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

## 📊 Monitoring & Logging

### Application Monitoring

1. **Health Check Endpoint**
   ```
   GET /api/health
   ```

2. **Monitoring Services**
   - **Uptime Robot**: Free uptime monitoring
   - **New Relic**: Application performance monitoring
   - **DataDog**: Comprehensive monitoring
   - **Sentry**: Error tracking and performance

### Logging Setup

```bash
# Environment variables for logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=/app/logs/app.log
```

## 🚀 Performance Optimization

### Frontend Optimization

1. **Build Optimization**
   ```bash
   # Vite build with optimization
   npm run build
   
   # Analyze bundle size
   npm run analyze
   ```

2. **CDN Setup**
   - Cloudflare (free tier available)
   - AWS CloudFront
   - Vercel Edge Network

### Backend Optimization

1. **Database Optimization**
   - Connection pooling
   - Query optimization
   - Proper indexing

2. **Caching**
   - Redis for session storage
   - Application-level caching
   - CDN for static assets

## 🔄 CI/CD Pipeline

### GitHub Actions (Included)

The repository includes GitHub Actions for:
- Automated testing
- Security audits
- Build verification
- Deployment automation

### Custom Deployment Script

```bash
#!/bin/bash
# deploy.sh

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
npm run install:all

# Run tests
npm run test

# Build applications
npm run build

# Run database migrations
cd backend && npx prisma migrate deploy

# Restart services
pm2 restart all

echo "Deployment completed!"
```

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   npx prisma db pull
   
   # Reset database (development only)
   npx prisma migrate reset
   ```

2. **Build Failures**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear build cache
   npm run clean
   ```

3. **Environment Variables**
   ```bash
   # Verify environment variables are loaded
   node -e "console.log(process.env.DATABASE_URL)"
   ```

### Performance Issues

1. **Database Performance**
   - Check slow query logs
   - Optimize database indexes
   - Consider connection pooling

2. **Memory Issues**
   - Monitor memory usage
   - Optimize bundle size
   - Use lazy loading

## 📞 Support

For deployment issues:
- 📧 Email: sanjeev23oct@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/sanjeev23oct/open-prototype/issues)
- 📖 Docs: Check this deployment guide

---

**Happy Deploying! 🚀**