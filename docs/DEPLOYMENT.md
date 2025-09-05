# Deployment Guide

This guide provides comprehensive instructions for deploying the PDL Property Inspector application to various production environments.

## Overview

The application consists of two main components:
- **Frontend**: React SPA that can be served statically
- **Backend**: Node.js API server that requires a runtime environment

## Prerequisites

### Required Services

- **Database**: PostgreSQL (via Supabase or self-hosted)
- **Cache**: Redis instance for rate limiting and sessions
- **Domain**: Custom domain with SSL certificate
- **CDN**: Content delivery network (optional but recommended)

### Environment Preparation

- **Node.js 18+** runtime environment
- **SSL Certificate** for HTTPS
- **Environment Variables** properly configured
- **Monitoring** and logging setup

## Environment Variables

### Production Environment Configuration

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-chars
BCRYPT_ROUNDS=12

# External Services
REDIS_URL=redis://your-redis-host:6379
OPENAI_API_KEY=sk-your-production-openai-key

# Social Authentication
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
VITE_MICROSOFT_CLIENT_ID=your-production-microsoft-client-id
VITE_APPLE_CLIENT_ID=your-production-apple-client-id
VITE_DEMO_MODE=false

# Admin
ADMIN_API_KEY=your-secure-admin-api-key

# Security Headers
FORCE_HTTPS=true
TRUST_PROXY=true

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn-if-using
```

### Security Considerations

⚠️ **Important Security Notes:**

- **Never commit production environment variables to version control**
- **Use strong, randomly generated secrets**
- **Rotate API keys and secrets regularly**
- **Use different keys for staging and production**
- **Implement proper secret management**

## Deployment Options

### 1. Vercel Deployment (Recommended for Starters)

#### Frontend Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd pdlpropertyinspector
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Backend Deployment

```bash
# Create vercel.json for API routes
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    }
  ]
}
```

### 2. Docker Deployment

#### Create Docker Images

**Frontend Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build:server

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["node", "dist/server/index.js"]
```

#### Docker Compose for Production

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl-certs:/etc/nginx/ssl
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl-certs:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  redis-data:
```

### 3. AWS Deployment

#### AWS ECS Deployment

**Task Definition:**
```json
{
  "family": "property-inspector",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/property-inspector:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/database-url"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

#### S3 + CloudFront for Frontend

```bash
# Build frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 4. Kubernetes Deployment

#### Deployment Manifests

**Backend Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: property-inspector-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: property-inspector-backend
  template:
    metadata:
      labels:
        app: property-inspector-backend
    spec:
      containers:
      - name: backend
        image: property-inspector:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: property-inspector-backend-service
spec:
  selector:
    app: property-inspector-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
```

**Ingress Configuration:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: property-inspector-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.yourapp.com
    - yourapp.com
    secretName: property-inspector-tls
  rules:
  - host: api.yourapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: property-inspector-backend-service
            port:
              number: 80
  - host: yourapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: property-inspector-frontend-service
            port:
              number: 80
```

## Database Deployment

### Supabase (Recommended)

```bash
# Production Supabase setup
1. Create production project at supabase.com
2. Configure database settings
3. Set up Row Level Security policies
4. Configure authentication providers
5. Set environment variables
```

### Self-Hosted PostgreSQL

```yaml
# docker-compose.yml for PostgreSQL
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: propertyinspector
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres-data:
```

## SSL/HTTPS Configuration

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/property-inspector
server {
    listen 80;
    server_name yourapp.com www.yourapp.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourapp.com www.yourapp.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/yourapp.com.crt;
    ssl_certificate_key /etc/nginx/ssl/yourapp.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Frontend
    location / {
        root /var/www/property-inspector;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
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

### Let's Encrypt SSL

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourapp.com -d www.yourapp.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### Health Checks

```typescript
// Enhanced health check
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkExternalAPIs()
    ]);
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      version: process.env.APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV,
      services: {
        database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        redis: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        externalAPIs: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
      }
    };
    
    const allHealthy = Object.values(health.services).every(status => status === 'healthy');
    res.status(allHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});
```

### Application Logging

```typescript
// Production logging setup
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Process Management

#### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'property-inspector-api',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
```

```bash
# Deploy with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Performance Optimization

### Frontend Optimization

```bash
# Build optimization
npm run build

# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/static/js/*.js
```

### Backend Optimization

```typescript
// Performance middleware
import compression from 'compression';
import helmet from 'helmet';

app.use(compression());
app.use(helmet());

// Request rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

## Database Optimization

### Performance Tuning

```sql
-- Index optimization
CREATE INDEX CONCURRENTLY idx_inspections_property_status 
ON inspections(property_id, status) 
WHERE status != 'deleted';

-- Query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM inspections 
WHERE property_id = $1 AND status = 'completed';
```

### Backup Strategy

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="propertyinspector"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/
```

## Deployment Checklist

### Pre-Deployment

- [ ] **Environment Variables**: All production variables configured
- [ ] **SSL Certificates**: Valid certificates installed
- [ ] **Database**: Production database set up and migrated
- [ ] **Dependencies**: All production dependencies installed
- [ ] **Tests**: All tests passing
- [ ] **Security**: Security scan completed
- [ ] **Performance**: Load testing completed
- [ ] **Monitoring**: Monitoring and alerting configured

### Deployment Process

- [ ] **Build**: Create production builds
- [ ] **Backup**: Backup current production (if applicable)
- [ ] **Deploy**: Deploy new version
- [ ] **Health Check**: Verify application health
- [ ] **Smoke Tests**: Run basic functionality tests
- [ ] **Monitor**: Monitor for errors and performance issues
- [ ] **Rollback Plan**: Have rollback plan ready

### Post-Deployment

- [ ] **Verification**: Full application testing
- [ ] **Performance**: Monitor performance metrics
- [ ] **Logs**: Check error logs
- [ ] **Users**: Monitor user feedback
- [ ] **Documentation**: Update deployment documentation

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
docker logs container-name
pm2 logs

# Check environment variables
env | grep -E "(DATABASE_URL|REDIS_URL|JWT_SECRET)"

# Test database connection
node -e "const { createClient } = require('@supabase/supabase-js'); 
         const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
         console.log('Database connection test');"
```

#### High Memory Usage

```bash
# Monitor memory usage
free -h
top -p $(pgrep node)

# PM2 memory monitoring
pm2 monit

# Restart application
pm2 restart property-inspector-api
```

#### Database Connection Issues

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check connection limits
SELECT setting FROM pg_settings WHERE name = 'max_connections';
```

### Emergency Procedures

#### Rollback Process

```bash
# 1. Stop current version
pm2 stop property-inspector-api

# 2. Switch to previous version
git checkout previous-tag
npm install
npm run build:server

# 3. Start previous version
pm2 start ecosystem.config.js

# 4. Verify health
curl https://yourapp.com/health
```

## Security Hardening

### Server Security

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

### Application Security

```typescript
// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

This deployment guide provides comprehensive instructions for deploying the PDL Property Inspector application to production environments with proper security, monitoring, and performance considerations.