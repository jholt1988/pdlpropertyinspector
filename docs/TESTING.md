# Testing Guide

This guide provides comprehensive information about testing practices, strategies, and tools used in the PDL Property Inspector project.

## Overview

Our testing strategy follows a multi-layered approach to ensure code quality, reliability, and maintainability:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions and API endpoints
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Ensure application performance standards

## Testing Stack

### Frontend Testing
- **Vitest**: Fast test runner with native TypeScript support
- **React Testing Library**: Component testing utilities
- **Happy DOM**: Lightweight DOM implementation
- **MSW**: API mocking for integration tests

### Backend Testing
- **Vitest**: Test runner for Node.js code
- **Supertest**: HTTP assertion library
- **Test Containers**: Database testing with real instances

## Test Organization

```
tests/
├── components/           # React component tests
├── services/            # API service tests
├── utils/               # Utility function tests
├── pages/               # Page component integration tests
├── api/                 # Backend API tests
├── fixtures/            # Test data and mocks
├── helpers/             # Test utility functions
└── setup.ts             # Test configuration
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test UserCard.test.tsx

# Run tests matching pattern
npm test -- --grep "authentication"

# Run in UI mode (Vitest UI)
npm run test:ui
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:components": "vitest run tests/components",
    "test:api": "vitest run tests/api",
    "test:e2e": "playwright test"
  }
}
```

## Writing Tests

### Unit Tests

#### Testing React Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard Component', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'inspector' as const
  };

  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('inspector')).toBeInTheDocument();
  });

  it('handles click events properly', async () => {
    const mockOnClick = vi.fn();
    render(<UserCard user={mockUser} onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledWith(mockUser.id);
    });
  });

  it('shows loading state when specified', () => {
    render(<UserCard user={mockUser} isLoading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });
});
```

#### Testing Custom Hooks

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth Hook', () => {
  it('initializes with null user', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('updates user state on login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clears user state on logout', async () => {
    const { result } = renderHook(() => useAuth());
    
    // First login
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    // Then logout
    await act(async () => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

#### Testing Utility Functions

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDepreciation, formatCurrency } from './calculations';

describe('Calculation Utilities', () => {
  describe('calculateDepreciation', () => {
    it('calculates depreciation correctly for electrical items', () => {
      const result = calculateDepreciation({
        originalCost: 1000,
        ageInYears: 5,
        category: 'electrical',
        condition: 'Good'
      });
      
      expect(result.depreciatedValue).toBe(750);
      expect(result.depreciationRate).toBe(0.05);
    });

    it('applies condition penalties correctly', () => {
      const result = calculateDepreciation({
        originalCost: 1000,
        ageInYears: 3,
        category: 'plumbing',
        condition: 'Poor'
      });
      
      expect(result.conditionPenalty).toBeGreaterThan(0);
      expect(result.depreciatedValue).toBeLessThan(850);
    });

    it('handles zero age gracefully', () => {
      const result = calculateDepreciation({
        originalCost: 1000,
        ageInYears: 0,
        category: 'general',
        condition: 'Excellent'
      });
      
      expect(result.depreciatedValue).toBe(1000);
      expect(result.depreciationRate).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('handles zero values', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });

    it('formats large numbers', () => {
      expect(formatCurrency(1234567.89, 'USD')).toBe('$1,234,567.89');
    });
  });
});
```

### Integration Tests

#### Testing API Services

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { estimateService } from './estimateService';

const server = setupServer(
  http.post('/api/estimate', () => {
    return HttpResponse.json({
      totalItems: 1,
      flaggedItems: [{
        itemId: '1',
        recommendation: 'repair',
        estimatedCost: 250
      }],
      totalEstimatedCost: 250
    });
  })
);

beforeEach(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('Estimate Service', () => {
  it('generates estimates successfully', async () => {
    const inventory = [{
      itemId: '1',
      itemName: 'Test Item',
      category: 'electrical',
      currentCondition: 'Fair',
      originalCost: 1000
    }];

    const result = await estimateService.generateEstimate(inventory);
    
    expect(result.totalItems).toBe(1);
    expect(result.totalEstimatedCost).toBe(250);
    expect(result.flaggedItems[0].recommendation).toBe('repair');
  });

  it('handles API errors gracefully', async () => {
    server.use(
      http.post('/api/estimate', () => {
        return HttpResponse.error();
      })
    );

    await expect(estimateService.generateEstimate([])).rejects.toThrow();
  });
});
```

#### Testing Backend API Endpoints

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { setupTestDatabase, cleanupTestDatabase } from './helpers/database';

describe('Estimate API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/estimate', () => {
    it('generates estimate with valid data', async () => {
      const requestData = {
        inventory: [{
          itemId: '1',
          itemName: 'HVAC Unit',
          category: 'hvac',
          currentCondition: 'Fair',
          purchaseDate: '2020-01-01T00:00:00Z',
          originalCost: 5000,
          location: 'Roof'
        }],
        userLocation: {
          city: 'New York',
          region: 'NY',
          country: 'US',
          type: 'approximate'
        },
        currency: 'USD'
      };

      const response = await request(app)
        .post('/api/estimate')
        .set('X-API-Key', 'test-api-key')
        .send(requestData)
        .expect(200);

      expect(response.body.totalItems).toBe(1);
      expect(response.body.flaggedItems).toHaveLength(1);
      expect(response.body.totalEstimatedCost).toBeGreaterThan(0);
    });

    it('returns 400 for invalid input', async () => {
      const invalidData = {
        inventory: [{
          itemId: '',  // Invalid empty ID
          itemName: 'Test Item'
        }]
      };

      await request(app)
        .post('/api/estimate')
        .set('X-API-Key', 'test-api-key')
        .send(invalidData)
        .expect(400);
    });

    it('returns 401 for missing API key', async () => {
      await request(app)
        .post('/api/estimate')
        .send({})
        .expect(401);
    });

    it('handles rate limiting correctly', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/estimate')
          .set('X-API-Key', 'test-api-key')
          .send({ inventory: [] })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      expect(responses.some(r => r.status === 429)).toBe(true);
    });
  });
});
```

### Component Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { InspectionPage } from '../pages/InspectionPage';

function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Inspection Page Integration', () => {
  it('completes full inspection workflow', async () => {
    renderWithProviders(<InspectionPage />, { route: '/inspections/new' });

    // Select property
    const propertySelect = screen.getByLabelText(/property/i);
    fireEvent.change(propertySelect, { target: { value: 'property-1' } });

    // Fill in inspection details
    const inspectionType = screen.getByLabelText(/inspection type/i);
    fireEvent.change(inspectionType, { target: { value: 'move-in' } });

    // Add room
    fireEvent.click(screen.getByText(/add room/i));
    
    // Fill room details
    const roomName = screen.getByLabelText(/room name/i);
    fireEvent.change(roomName, { target: { value: 'Kitchen' } });

    // Add checklist items
    fireEvent.click(screen.getByText(/add item/i));
    
    const itemCondition = screen.getByLabelText(/condition/i);
    fireEvent.change(itemCondition, { target: { value: 'Good' } });

    // Save inspection
    fireEvent.click(screen.getByText(/save inspection/i));

    await waitFor(() => {
      expect(screen.getByText(/inspection saved/i)).toBeInTheDocument();
    });
  });
});
```

## Test Data Management

### Fixtures and Mocks

```typescript
// tests/fixtures/users.ts
export const mockUsers = {
  inspector: {
    id: '1',
    email: 'inspector@example.com',
    name: 'John Inspector',
    role: 'inspector' as const
  },
  manager: {
    id: '2',
    email: 'manager@example.com',
    name: 'Jane Manager',
    role: 'manager' as const
  }
};

// tests/fixtures/properties.ts
export const mockProperties = {
  apartment: {
    id: 'prop-1',
    address: '123 Main St, Apt 4B',
    propertyType: 'apartment' as const,
    units: 1,
    isMultiUnit: false
  },
  house: {
    id: 'prop-2',
    address: '456 Oak Ave',
    propertyType: 'house' as const,
    units: 1,
    isMultiUnit: false
  }
};

// tests/fixtures/inspections.ts
export const mockInspections = {
  completed: {
    id: 'insp-1',
    propertyId: 'prop-1',
    status: 'completed' as const,
    completedDate: '2024-01-15T10:00:00Z',
    rooms: [
      {
        id: 'room-1',
        name: 'Kitchen',
        type: 'kitchen' as const,
        checklistItems: [
          {
            id: 'item-1',
            category: 'Appliances',
            item: 'Refrigerator',
            condition: 'Good' as const,
            notes: 'Working properly',
            photos: []
          }
        ]
      }
    ]
  }
};
```

### Database Test Helpers

```typescript
// tests/helpers/database.ts
import { createClient } from '@supabase/supabase-js';

let testDb: any;

export async function setupTestDatabase() {
  testDb = createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_ANON_KEY!
  );

  // Insert test data
  await testDb.from('users').insert(Object.values(mockUsers));
  await testDb.from('properties').insert(Object.values(mockProperties));
}

export async function cleanupTestDatabase() {
  if (testDb) {
    await testDb.from('inspections').delete().neq('id', '');
    await testDb.from('properties').delete().neq('id', '');
    await testDb.from('users').delete().neq('id', '');
  }
}

export function getTestDatabase() {
  return testDb;
}
```

## Testing Best Practices

### General Guidelines

1. **Write tests first** (TDD approach when possible)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Keep tests independent** and isolated
5. **Mock external dependencies**
6. **Test edge cases** and error conditions
7. **Maintain test data** consistency

### React Component Testing

1. **Test user interactions**, not internal state
2. **Use semantic queries** (getByRole, getByText)
3. **Test accessibility** features
4. **Mock API calls** and external services
5. **Test error states** and loading states

```typescript
// Good: Testing user behavior
it('shows error message when login fails', async () => {
  render(<LoginForm />);
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'invalid@email' }
  });
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});

// Avoid: Testing implementation details
it('sets error state when validation fails', () => {
  const { result } = renderHook(() => useLoginForm());
  
  act(() => {
    result.current.setEmail('invalid');
    result.current.validate();
  });
  
  expect(result.current.error).toBe('Invalid email');
});
```

### API Testing

1. **Test all HTTP methods** used
2. **Validate request/response** formats
3. **Test authentication** and authorization
4. **Test rate limiting** and error handling
5. **Use real database** for integration tests

### Performance Testing

```typescript
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  it('calculates depreciation within acceptable time', () => {
    const start = performance.now();
    
    const largeInventory = Array(1000).fill(null).map((_, i) => ({
      itemId: `item-${i}`,
      originalCost: 1000,
      ageInYears: Math.random() * 10,
      category: 'general',
      condition: 'Good'
    }));

    largeInventory.forEach(item => calculateDepreciation(item));
    
    const end = performance.now();
    const duration = end - start;
    
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npx tsc --noEmit
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Coverage Reporting

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'vite.config.ts',
        'vitest.config.ts'
      ]
    }
  }
});
```

## Debugging Tests

### Common Issues

#### Tests Timing Out

```typescript
// Increase timeout for slow tests
it('handles large data processing', async () => {
  // Process large dataset
}, { timeout: 10000 }); // 10 second timeout
```

#### Async Operations

```typescript
// Use waitFor for async updates
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
}, { timeout: 5000 });

// Or use findBy queries (automatic waiting)
expect(await screen.findByText('Updated')).toBeInTheDocument();
```

#### Mock Issues

```typescript
// Clear mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

// Reset modules for isolated testing
afterEach(() => {
  vi.resetModules();
});
```

### Debug Utilities

```typescript
// Debug component rendering
import { screen } from '@testing-library/react';

it('debugs component state', () => {
  render(<MyComponent />);
  
  // Print current DOM
  screen.debug();
  
  // Print specific element
  screen.debug(screen.getByTestId('my-element'));
});

// Debug test data
console.log('Test data:', JSON.stringify(testData, null, 2));
```

## Test Maintenance

### Keeping Tests Updated

1. **Update tests** when features change
2. **Remove obsolete** tests promptly
3. **Refactor test** utilities regularly
4. **Review test** coverage periodically
5. **Update test** dependencies

### Test Documentation

1. **Document test** strategies and patterns
2. **Explain complex** test setups
3. **Maintain test** data documentation
4. **Share testing** best practices
5. **Document test** environment setup

---

This testing guide provides comprehensive coverage of testing practices in the PDL Property Inspector project. Regular testing ensures code quality, reliability, and maintainability of the application.