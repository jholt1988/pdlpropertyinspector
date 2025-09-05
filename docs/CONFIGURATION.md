# Configuration Reference

This document provides comprehensive reference for all configuration options, environment variables, and settings used in the PDL Property Inspector application.

## Environment Variables

### Required Variables

These variables must be set for the application to function properly.

#### Database Configuration

```bash
# Supabase Database (Recommended)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Or PostgreSQL Connection String
DATABASE_URL=postgresql://username:password@host:port/database_name
```

#### Authentication

```bash
# JWT Secret (minimum 32 characters)
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters

# Password Hashing Rounds (10-14 recommended)
BCRYPT_ROUNDS=12
```

### Optional Variables

#### External Services

```bash
# Redis for Rate Limiting and Caching
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# OpenAI for Enhanced Estimates
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4000

# Email Service (if not using Supabase)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com
```

#### Social Authentication

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789012
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Apple OAuth (iOS only)
VITE_APPLE_CLIENT_ID=com.yourapp.service
APPLE_CLIENT_SECRET=your-apple-client-secret
APPLE_KEY_ID=your-apple-key-id
APPLE_TEAM_ID=your-apple-team-id
```

#### Application Settings

```bash
# Environment
NODE_ENV=development|staging|production

# Server Configuration
PORT=3001
HOST=localhost

# Frontend URL
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

# Demo Mode (disables real OAuth)
VITE_DEMO_MODE=false

# Feature Flags
VITE_ENABLE_SOCIAL_LOGIN=true
VITE_ENABLE_ENHANCED_ESTIMATES=true
VITE_ENABLE_ANALYTICS=true
```

#### Security Settings

```bash
# Admin API Key
ADMIN_API_KEY=your-secure-admin-api-key

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,https://yourapp.com

# SSL/Security
FORCE_HTTPS=false
TRUST_PROXY=false
SECURE_COOKIES=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Monitoring and Logging

```bash
# Logging Level
LOG_LEVEL=info|debug|warn|error

# Sentry Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Analytics
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
MIXPANEL_TOKEN=your-mixpanel-token
```

## File-Based Configuration

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:server": "node ./scripts/cleanDist.cjs && npx tsc -p server/tsconfig.server.json && node ./scripts/writeDistPackageCommonjs.cjs && node ./scripts/fixServerRequires.cjs",
    "start:server": "npx tsx ./server/index.ts",
    "start:server:prod": "npm run build:server && node ./dist/server/index.js",
    "dev:server:watch": "nodemon --config nodemon.json",
    "dev:server:tsnode": "nodemon --watch server --ext ts --exec \"npx tsx server/index.ts\"",
    "build:web": "tsc && vite build",
    "lint": "eslint . --ext js,jsx,ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### TypeScript Configuration

#### Frontend (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/pages/*": ["src/pages/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### Backend (server/tsconfig.server.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "../dist/server",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false
  },
  "include": [
    "**/*.ts",
    "**/*.js"
  ],
  "exclude": [
    "node_modules",
    "../dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types')
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react']
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'dist/',
        'coverage/',
        '**/*.config.{ts,js}',
        '**/types.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types')
    }
  }
});
```

### ESLint Configuration

```json
{
  "root": true,
  "env": { "browser": true, "es2020": true, "node": true },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "ignorePatterns": ["dist", ".eslintrc.cjs"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": [
      "warn",
      { "allowConstantExport": true }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "overrides": [
    {
      "files": ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
      "env": { "vitest/globals": true },
      "extends": ["plugin:vitest/recommended"]
    }
  ]
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "printWidth": 100,
        "proseWrap": "preserve"
      }
    }
  ]
}
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## Database Configuration

### Supabase Setup

#### Row Level Security Policies

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Property managers can access managed properties
CREATE POLICY "Managers access managed properties" ON properties
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('manager', 'admin')
    ) OR
    manager_id = auth.uid() OR
    owner_id = auth.uid()
  );

-- Inspectors can access assigned inspections
CREATE POLICY "Inspectors access assigned inspections" ON inspections
  FOR ALL USING (
    inspector_id = auth.uid() OR
    property_id IN (
      SELECT id FROM properties 
      WHERE manager_id = auth.uid()
    )
  );
```

#### Database Schema

```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'inspector',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  property_type property_type_enum NOT NULL,
  units INTEGER DEFAULT 1,
  is_multi_unit BOOLEAN DEFAULT FALSE,
  owner_id UUID REFERENCES users(id),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspections
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES users(id),
  status inspection_status DEFAULT 'scheduled',
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  inspection_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  type report_type NOT NULL,
  content JSONB NOT NULL,
  generated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Redis Configuration

```bash
# redis.conf
port 6379
bind 127.0.0.1
protected-mode yes
requirepass your-redis-password

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

## Application-Specific Configuration

### System Configuration

```typescript
// src/config/system.ts
export interface SystemConfig {
  repairThreshold: number; // Threshold for repair vs replace
  laborRates: {
    general: number;
    electrical: number;
    plumbing: number;
    hvac: number;
    specialized: number;
  };
  maintenanceThresholds: {
    general: number; // Months between maintenance
    electrical: number;
    plumbing: number;
    hvac: number;
  };
  expectedLifespans: {
    general: number; // Months
    electrical: number;
    plumbing: number;
    hvac: number;
  };
  depreciationRates: {
    electrical: number; // Annual depreciation rate
    plumbing: number;
    hvac: number;
    general: number;
    specialized: number;
  };
  conditionPenalties: {
    Poor: number; // Additional penalty for poor condition
    Fair: number;
    Good: number;
    Excellent: number;
  };
}

export const defaultSystemConfig: SystemConfig = {
  repairThreshold: 0.5,
  laborRates: {
    general: 50,
    electrical: 75,
    plumbing: 65,
    hvac: 80,
    specialized: 90
  },
  maintenanceThresholds: {
    general: 24,
    electrical: 12,
    plumbing: 18,
    hvac: 12
  },
  expectedLifespans: {
    general: 120, // 10 years
    electrical: 180, // 15 years
    plumbing: 240, // 20 years
    hvac: 180 // 15 years
  },
  depreciationRates: {
    electrical: 0.05,
    plumbing: 0.04,
    hvac: 0.06,
    general: 0.05,
    specialized: 0.07
  },
  conditionPenalties: {
    Poor: 0.3,
    Fair: 0.15,
    Good: 0.05,
    Excellent: 0
  }
};
```

### API Configuration

```typescript
// server/config/api.ts
export interface ApiConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  jwt: {
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    issuer: string;
    audience: string;
  };
  cors: {
    origins: string[];
    credentials: boolean;
    optionsSuccessStatus: number;
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    destinationPath: string;
  };
}

export const apiConfig: ApiConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false
  },
  jwt: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    issuer: 'property-inspector-api',
    audience: 'property-inspector-app'
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ],
    destinationPath: './uploads'
  }
};
```

## Docker Configuration

### Dockerfile (Production)

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build
RUN npm run build:server

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/server/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  redis-data:
  postgres-data:
```

## Monitoring Configuration

### Health Check Endpoint

```typescript
// server/health.ts
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    externalAPIs: ServiceStatus;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

interface ServiceStatus {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}
```

### Logging Configuration

```typescript
// server/config/logging.ts
import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'property-inspector-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## Security Configuration

### Content Security Policy

```typescript
// server/middleware/security.ts
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    scriptSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    connectSrc: ["'self'", "https://api.openai.com"]
  }
};
```

### Rate Limiting Configuration

```typescript
// server/config/rateLimiting.ts
export const rateLimitConfig = {
  basic: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    keyGenerator: (req: any) => req.headers['x-api-key'] || req.ip
  }
};
```

---

This configuration reference provides comprehensive documentation for all settings and options used in the PDL Property Inspector application. Use this as a reference when setting up environments, deploying, or modifying application behavior.