# Architecture Overview

This document provides a comprehensive overview of the PDL Property Inspector system architecture, including design decisions, technology choices, and integration patterns.

## System Overview

PDL Property Inspector is a modern web application built with a React frontend and Node.js backend, designed for property inspection and management workflows. The system follows a microservices-inspired architecture with clear separation of concerns.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Mobile App    │    │  API Clients    │
│    (React)      │    │   (Future)      │    │   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
              ┌─────────────────────────────────────┐
              │           Load Balancer             │
              │         (Production)                │
              └─────────────────────────────────────┘
                                 │
              ┌─────────────────────────────────────┐
              │         Frontend Assets             │
              │        (CDN/Static Host)            │
              └─────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Server    │    │   API Server    │    │  Background     │
│     (Vite)      │    │   (Express)     │    │   Workers       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
            ┌───────────┐ ┌──────────┐ ┌─────────────┐
            │ Supabase  │ │  Redis   │ │   OpenAI    │
            │ Database  │ │  Cache   │ │    API      │
            └───────────┘ └──────────┘ └─────────────┘
```

## Core Components

### Frontend Architecture (React SPA)

The frontend is a single-page application built with React 18 and TypeScript, utilizing modern development practices.

#### Technology Stack
- **React 18** - UI framework with concurrent features
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **React Context** - State management

#### Component Architecture

```
src/
├── App.tsx                 # Root component with routing
├── components/            # Reusable UI components
│   ├── Layout.tsx         # Main layout wrapper
│   ├── ProtectedRoute.tsx # Authentication guard
│   ├── EmailVerificationBanner.tsx
│   └── RepairPlan/        # Feature-specific components
├── pages/                 # Route-level page components
│   ├── HomePage.tsx       # Dashboard
│   ├── InspectionsPage.tsx
│   ├── ProjectPage.tsx
│   └── auth/              # Authentication flows
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # User authentication state
│   └── StorageContext.tsx # Local storage management
├── hooks/                 # Custom React hooks
├── services/              # API communication layer
├── utils/                 # Pure utility functions
└── types/                 # TypeScript type definitions
```

#### State Management Strategy

1. **Local Component State** - `useState` for UI-specific state
2. **Global Application State** - React Context for user auth, app settings
3. **Server State** - Direct API calls with loading/error handling
4. **Local Storage** - Persistent user preferences and cache

### Backend Architecture (Node.js API)

The backend is a RESTful API server built with Express and TypeScript, following domain-driven design principles.

#### Technology Stack
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type safety and developer experience
- **Zod** - Runtime schema validation
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

#### Service Architecture

```
server/
├── index.ts               # Application entry point
├── handler.ts             # Main request handler
├── routes/                # API route handlers
│   └── admin.ts           # Admin endpoints
├── utils/                 # Business logic and utilities
│   ├── apiKeyManager.js   # API key management
│   └── rateLimiterStore.ts # Rate limiting
├── estimate.ts            # Estimation engine
├── rateLimiterStore.ts    # Redis integration
└── tsconfig.server.json   # TypeScript configuration
```

#### Request Flow

1. **Authentication Middleware** - Validate JWT tokens or API keys
2. **Rate Limiting** - Prevent abuse with Redis-based limiting
3. **Input Validation** - Zod schema validation
4. **Business Logic** - Core application processing
5. **Response Formatting** - Consistent API responses
6. **Error Handling** - Centralized error processing

## Data Architecture

### Database Design (Supabase/PostgreSQL)

The application uses Supabase as the primary database, providing PostgreSQL with real-time capabilities.

#### Core Entities

```sql
-- Users and Authentication
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Property Management
properties (
  id UUID PRIMARY KEY,
  address TEXT NOT NULL,
  property_type property_type_enum,
  units INTEGER,
  is_multi_unit BOOLEAN,
  owner_id UUID REFERENCES users(id),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP
);

-- Inspection Records
inspections (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  inspector_id UUID REFERENCES users(id),
  status inspection_status_enum,
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  data JSONB, -- Flexible inspection data
  created_at TIMESTAMP
);

-- Reports and Estimates
reports (
  id UUID PRIMARY KEY,
  inspection_id UUID REFERENCES inspections(id),
  type report_type_enum,
  content JSONB,
  generated_date TIMESTAMP,
  created_by UUID REFERENCES users(id)
);
```

#### Row Level Security (RLS)

Supabase RLS policies ensure data isolation:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Property managers can access managed properties
CREATE POLICY "Managers can access managed properties" ON properties
  FOR ALL USING (
    auth.uid() = manager_id OR 
    auth.uid() = owner_id
  );
```

### Caching Strategy (Redis)

Redis is used for:

1. **Rate Limiting** - Track API usage per key/user
2. **Session Storage** - User session data
3. **Application Cache** - Frequently accessed data
4. **Background Jobs** - Task queue management

```typescript
// Rate limiting structure
rate_limit:{api_key}:{endpoint} = {
  count: number,
  reset_time: timestamp
}

// Session cache
session:{user_id} = {
  user_data: object,
  permissions: array,
  last_activity: timestamp
}
```

## Security Architecture

### Authentication & Authorization

#### Multi-Layer Security

1. **Frontend Guards** - Route protection with `ProtectedRoute`
2. **API Authentication** - JWT token validation
3. **Database Policies** - Row Level Security (RLS)
4. **Rate Limiting** - API abuse prevention

#### Token Management

```typescript
// JWT Token Structure
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "inspector|manager|admin",
  "iat": timestamp,
  "exp": timestamp
}

// Refresh Token Flow
Access Token (15 min) → Refresh Token (7 days) → New Access Token
```

#### API Key System

```typescript
// API Key Structure
{
  id: "uuid",
  key: "pk_live_...", // Prefixed key
  permissions: ["estimate", "admin"],
  rateLimitTier: "basic|premium|enterprise",
  quotas: { daily: 1000, monthly: 30000 }
}
```

### Input Validation & Sanitization

```typescript
// Zod Schema Example
const EstimateRequestSchema = z.object({
  inventory: z.array(z.object({
    itemId: z.string().min(1),
    category: z.enum(['electrical', 'plumbing', 'hvac']),
    condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
    originalCost: z.number().positive()
  })),
  userLocation: z.object({
    city: z.string().min(1),
    region: z.string().min(1),
    country: z.string().length(2)
  })
});
```

## Integration Architecture

### External Service Integration

#### OpenAI API Integration

```typescript
// Estimate Generation Flow
Client Request → Input Validation → AI Processing → Result Formatting → Response

// Fallback Strategy
AI Service Available → Use AI Enhancement
AI Service Down → Use Local Calculations
```

#### Supabase Integration

```typescript
// Database Connection
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Real-time Subscriptions
supabase
  .channel('inspections')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'inspections' 
  }, payload => {
    // Handle real-time updates
  })
  .subscribe();
```

#### Social Authentication

```typescript
// OAuth 2.0 Flow with PKCE
Initiate Login → Generate PKCE → Redirect to Provider → 
Receive Code → Exchange for Token → Validate & Store
```

### API Design Patterns

#### RESTful Design

```
GET    /api/inspections        # List inspections
POST   /api/inspections        # Create inspection
GET    /api/inspections/:id    # Get specific inspection
PUT    /api/inspections/:id    # Update inspection
DELETE /api/inspections/:id    # Delete inspection
```

#### Error Response Format

```json
{
  "error": "Human readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "field": "validation error details"
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "uuid"
}
```

## Performance Architecture

### Frontend Performance

#### Code Splitting

```typescript
// Route-level code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const InspectionsPage = lazy(() => import('./pages/InspectionsPage'));

// Component-level splitting for large features
const RepairEstimator = lazy(() => import('./components/RepairEstimator'));
```

#### Asset Optimization

- **Vite** - Fast HMR and optimized builds
- **Tree Shaking** - Remove unused code
- **Image Optimization** - Lazy loading and responsive images
- **CDN Integration** - Static asset delivery

### Backend Performance

#### Caching Strategy

```typescript
// Multi-layer caching
1. Redis Cache (seconds to minutes)
2. Application Memory (request duration)
3. Database Query Optimization
4. CDN Caching (static assets)
```

#### Database Optimization

```sql
-- Proper indexing
CREATE INDEX idx_inspections_property_id ON inspections(property_id);
CREATE INDEX idx_inspections_inspector_id ON inspections(inspector_id);
CREATE INDEX idx_inspections_status ON inspections(status);

-- Query optimization
EXPLAIN ANALYZE SELECT * FROM inspections 
WHERE property_id = $1 AND status = 'completed';
```

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.yml (local development)
version: '3.8'
services:
  frontend:
    build: .
    ports: ['5173:5173']
    environment:
      - NODE_ENV=development
  
  backend:
    build: ./server
    ports: ['3001:3001']
    environment:
      - NODE_ENV=development
      - DATABASE_URL=${DATABASE_URL}
  
  redis:
    image: redis:alpine
    ports: ['6379:6379']
```

### Production Environment

```yaml
# Production deployment (Docker/Kubernetes)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: property-inspector-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: property-inspector-api
  template:
    metadata:
      labels:
        app: property-inspector-api
    spec:
      containers:
      - name: api
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
```

## Monitoring & Observability

### Application Monitoring

```typescript
// Health Check Endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      openai: await checkOpenAI()
    }
  };
  
  res.status(200).json(health);
});
```

### Error Tracking

```typescript
// Centralized error handling
app.use((error, req, res, next) => {
  console.error('Application error:', {
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id
  });
});
```

### Performance Metrics

```typescript
// Request duration tracking
const requestDuration = histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    requestDuration
      .labels(req.method, req.route?.path, res.statusCode)
      .observe(duration);
  });
  next();
});
```

## Scalability Considerations

### Horizontal Scaling

- **Stateless API Design** - No server-side session storage
- **Database Connection Pooling** - Efficient connection management
- **Load Balancer Ready** - Health checks and graceful shutdown
- **Microservice Preparation** - Domain separation for future splitting

### Vertical Scaling

- **Memory Management** - Efficient object creation and cleanup
- **CPU Optimization** - Async processing and worker threads
- **Database Optimization** - Query performance and indexing

## Future Architecture Considerations

### Microservices Migration

```
Current Monolith → Gradual Service Extraction

Candidates for extraction:
1. Authentication Service
2. Estimation Engine Service  
3. Report Generation Service
4. Notification Service
```

### Event-Driven Architecture

```typescript
// Event system preparation
interface DomainEvent {
  type: string;
  payload: any;
  timestamp: Date;
  aggregateId: string;
}

// Event handlers
const eventHandlers = {
  'inspection.completed': [
    generateReport,
    sendNotification,
    updateStatistics
  ]
};
```

### API Evolution

- **GraphQL Integration** - More flexible client queries
- **WebSocket Support** - Real-time updates
- **gRPC Services** - High-performance internal communication

This architecture provides a solid foundation for current needs while maintaining flexibility for future growth and scale requirements.