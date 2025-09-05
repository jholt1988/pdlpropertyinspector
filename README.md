# PDL Property Inspector

A comprehensive property inspection and management platform built with React, TypeScript, and Node.js. The application provides property managers and inspectors with tools to conduct detailed property inspections, generate repair estimates, and manage maintenance workflows.

## 🏗️ **Key Features**

- **Property Inspections**: Comprehensive room-by-room inspection checklists
- **AI-Powered Repair Estimates**: Intelligent cost estimation with depreciation calculations
- **User Management**: Secure authentication with social login support
- **Report Generation**: Professional inspection reports with detailed findings
- **Project Management**: Track repairs and maintenance projects
- **Multi-Tenant Support**: Property managers can handle multiple properties
- **API Integration**: RESTful API for programmatic access

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Redis (for rate limiting and caching)
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jholt1988/pdlpropertyinspector.git
   cd pdlpropertyinspector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   # Frontend development server
   npm run dev
   
   # Backend development server  
   npm run start:server
   ```

### Production Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start:server:prod
```

## 📚 **Documentation**

- [**API Documentation**](docs/API.md) - Complete API reference
- [**Development Guide**](docs/DEVELOPMENT.md) - Setup and development workflow
- [**Architecture Overview**](docs/ARCHITECTURE.md) - System design and components
- [**Deployment Guide**](docs/DEPLOYMENT.md) - Production deployment instructions
- [**User Guide**](docs/USER_GUIDE.md) - How to use the application
- [**Contributing**](docs/CONTRIBUTING.md) - Guidelines for contributors
- [**Security Documentation**](docs/SECURITY_DOCUMENTATION.md) - Security features and best practices
- [**Enhanced Estimates**](docs/ENHANCED_ESTIMATES.md) - AI-powered estimation system
- [**Social Login Setup**](docs/SOCIAL_LOGIN_SETUP.md) - OAuth configuration guide

## 🛠️ **Technology Stack**

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Supabase** for database and authentication
- **Redis** for caching and rate limiting
- **JWT** for secure authentication

### Testing
- **Vitest** for unit testing
- **React Testing Library** for component testing
- **Happy DOM** for DOM simulation

## 🔧 **Development**

### Available Scripts

```bash
# Frontend development
npm run dev              # Start Vite dev server
npm run build           # Build frontend for production
npm run preview         # Preview production build

# Backend development  
npm run start:server    # Start development server (ts-node)
npm run build:server    # Build server for production
npm run start:server:prod # Start production server

# Testing
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode

# Code quality
npm run lint           # Run ESLint
```

### Environment Variables

```bash
# Database
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
JWT_SECRET=your_jwt_secret
BCRYPT_ROUNDS=12

# External Services
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key

# Social Authentication
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
VITE_APPLE_CLIENT_ID=your_apple_client_id

# Admin
ADMIN_API_KEY=your_admin_api_key
```

## 📊 **Project Structure**

```
pdlpropertyinspector/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript type definitions
├── server/                # Backend source code
│   ├── routes/           # API route handlers
│   ├── utils/            # Server utilities
│   └── index.ts          # Server entry point
├── tests/                 # Test files
├── docs/                  # Documentation
├── public/               # Static assets
└── scripts/              # Build and utility scripts
```

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details on:

- Development workflow
- Code standards
- Testing requirements
- Pull request process

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Report bugs or request features via GitHub Issues
- **Security**: Report security vulnerabilities privately

## 🙏 **Acknowledgments**

- Built with ❤️ using React and Node.js
- Powered by Supabase for backend services
- Styled with Tailwind CSS
