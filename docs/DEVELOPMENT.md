# Development Guide

This guide provides detailed instructions for setting up a development environment and contributing to the PDL Property Inspector project.

## Prerequisites

### Required Software

- **Node.js 18+** - JavaScript runtime
- **npm** or **yarn** - Package manager
- **Git** - Version control
- **VS Code** (recommended) - Code editor with extensions

### External Services

- **Supabase Account** - Database and authentication
- **Redis** - Caching and rate limiting (optional for basic development)
- **OpenAI API Key** - For AI-powered estimates (optional)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jholt1988/pdlpropertyinspector.git
cd pdlpropertyinspector
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create environment files:

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database & Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
BCRYPT_ROUNDS=12

# External Services
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-openai-key

# Social Authentication (Optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
VITE_APPLE_CLIENT_ID=your-apple-client-id

# Demo Mode (for testing without OAuth setup)
VITE_DEMO_MODE=true

# Admin
ADMIN_API_KEY=your-admin-api-key
```

### 4. Database Setup

#### Option A: Supabase (Recommended)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env`
3. Run the provided SQL migrations in the Supabase SQL editor

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database for the project
3. Update `DATABASE_URL` in `.env`
4. Run migrations manually

### 5. Redis Setup (Optional)

#### Option A: Local Redis

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Install Redis (macOS)
brew install redis

# Start Redis
redis-server
```

#### Option B: Redis Cloud

1. Sign up for Redis Cloud
2. Create a database
3. Update `REDIS_URL` in `.env`

## Development Workflow

### Starting Development Servers

#### Frontend Only
```bash
npm run dev
# Opens http://localhost:5173
```

#### Backend Only
```bash
npm run start:server
# Runs on http://localhost:3001
```

#### Both (Recommended)
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run start:server
```

### Hot Reloading

- **Frontend**: Vite provides instant hot module replacement
- **Backend**: Nodemon automatically restarts on file changes

### Available Scripts

```bash
# Development
npm run dev                    # Start Vite dev server
npm run start:server          # Start backend with ts-node
npm run dev:server:watch      # Start backend with nodemon

# Building
npm run build                 # Build frontend
npm run build:server         # Build backend
npm run build:web            # Build frontend only

# Testing
npm test                     # Run all tests
npm run test:watch          # Run tests in watch mode

# Code Quality
npm run lint                 # Run ESLint
npm run preview             # Preview production build
```

## Project Structure

```
pdlpropertyinspector/
├── src/                     # Frontend source code
│   ├── components/         # Reusable React components
│   │   ├── Layout.tsx      # Main layout wrapper
│   │   ├── ProtectedRoute.tsx # Authentication guard
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── auth/          # Authentication pages
│   │   ├── HomePage.tsx   # Dashboard
│   │   └── ...
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.tsx # User authentication
│   │   └── StorageContext.tsx # Local storage
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service functions
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── App.tsx            # Main app component
├── server/                 # Backend source code
│   ├── routes/            # API route handlers
│   ├── utils/             # Server utilities
│   ├── handler.ts         # Main request handler
│   └── index.ts           # Server entry point
├── tests/                  # Test files
│   ├── components/        # Component tests
│   ├── services/          # Service tests
│   └── utils/             # Utility tests
├── docs/                   # Documentation
├── public/                # Static assets
├── scripts/               # Build and utility scripts
└── supabase/              # Database migrations and config
```

## Development Guidelines

### Code Style

#### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type when possible
- Use strict TypeScript configuration

#### React

- Use functional components with hooks
- Follow React best practices
- Use proper prop typing with interfaces
- Implement proper error boundaries

#### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names

### State Management

- **Local State**: useState for component-specific state
- **Global State**: React Context for app-wide state
- **Server State**: Direct API calls with proper error handling

### Error Handling

- Use try-catch blocks for async operations
- Implement proper error boundaries in React
- Log errors appropriately for debugging
- Show user-friendly error messages

### Testing

#### Writing Tests

- Write tests for all new features
- Test both happy path and error cases
- Use descriptive test names
- Mock external dependencies

#### Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    // Test implementation
  });
});
```

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- ComponentName.test.tsx

# Run with coverage
npm test -- --coverage
```

## Database Development

### Supabase

#### Local Development

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local development
supabase init

# Start local Supabase
supabase start

# Apply migrations
supabase db reset
```

#### Schema Changes

1. Create migration in `supabase/migrations/`
2. Test locally with `supabase db reset`
3. Apply to staging/production via Supabase dashboard

### Data Models

Key entities in the application:

- **Users**: Authentication and profile data
- **Properties**: Property information and management
- **Inspections**: Inspection records and checklists
- **Reports**: Generated inspection reports
- **Projects**: Repair and maintenance projects

## API Development

### Adding New Endpoints

1. Define route handler in `server/routes/`
2. Add route to `server/index.ts`
3. Implement validation with Zod
4. Add authentication/authorization
5. Write tests
6. Update API documentation

### Example Route Handler

```typescript
import { z } from 'zod';

const RequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

export async function handleRequest(req: any, res: any) {
  try {
    // Validate request
    const data = RequestSchema.parse(req.body);
    
    // Process request
    const result = await processData(data);
    
    // Return response
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Debugging

### Frontend Debugging

- Use React DevTools browser extension
- Check browser console for errors
- Use network tab to inspect API calls
- Use debugger statements or console.log

### Backend Debugging

- Check server console output
- Use debugger with VS Code
- Monitor API requests and responses
- Check Redis and database connections

### Common Issues

#### CORS Errors
```typescript
// Add CORS headers to server responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
```

#### Environment Variables Not Loading
- Ensure `.env` file is in project root
- Restart development servers after changes
- Check variable names are correct

#### Database Connection Issues
- Verify database URL and credentials
- Check network connectivity
- Ensure database is running

## Performance Optimization

### Frontend

- Use React.lazy for code splitting
- Implement proper memoization
- Optimize images and assets
- Monitor bundle size

### Backend

- Implement proper caching strategies
- Use database connection pooling
- Optimize database queries
- Monitor response times

## Deployment

### Build Process

```bash
# Build frontend
npm run build

# Build backend
npm run build:server

# Build both
npm run build && npm run build:server
```

### Environment-Specific Builds

- **Development**: Fast builds with source maps
- **Staging**: Production-like with debug info
- **Production**: Optimized builds without debug info

## VS Code Setup

### Recommended Extensions

- **TypeScript and JavaScript Language Features** - Built-in TS support
- **ES7+ React/Redux/React-Native snippets** - React snippets
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **GitLens** - Enhanced Git integration
- **Thunder Client** - API testing

### Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Contributing

### Git Workflow

1. Create feature branch from main
2. Make changes with descriptive commits
3. Run tests and linting
4. Create pull request
5. Address review feedback
6. Merge after approval

### Commit Messages

Use conventional commit format:

```
feat: add user authentication
fix: resolve database connection issue
docs: update API documentation
test: add component tests
refactor: improve error handling
```

### Pull Request Process

1. Fill out PR template completely
2. Ensure all tests pass
3. Add screenshots for UI changes
4. Request review from team members
5. Address feedback promptly

## Getting Help

### Resources

- **Documentation**: Check `docs/` directory
- **API Reference**: `docs/API.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **GitHub Issues**: Report bugs or ask questions

### Community

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Report bugs with detailed reproduction steps
- **Pull Requests**: Contribute improvements and fixes

---

Happy coding! 🚀