# Contributing Guide

Thank you for your interest in contributing to PDL Property Inspector! This guide will help you understand our development process and how to contribute effectively.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** and inclusive in all interactions
- **Be constructive** when providing feedback
- **Be patient** with newcomers and questions
- **Focus on what's best** for the community and project
- **Report unacceptable behavior** to project maintainers

## Getting Started

### Prerequisites

Before contributing, please ensure you have:

- Read the [Development Guide](DEVELOPMENT.md)
- Set up your local development environment
- Familiarized yourself with the [Architecture](ARCHITECTURE.md)
- Reviewed existing issues and pull requests

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/pdlpropertyinspector.git
   cd pdlpropertyinspector
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/jholt1988/pdlpropertyinspector.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment** following the [Development Guide](DEVELOPMENT.md)

## Ways to Contribute

### 🐛 Bug Reports

When reporting bugs, please include:

- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected** vs **actual** behavior
- **Environment details** (OS, browser, Node.js version)
- **Screenshots** or **error logs** when applicable
- **Minimal reproduction** example if possible

#### Bug Report Template

```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 95.0]
- Node.js: [e.g., 18.12.0]
- App Version: [e.g., 1.0.0]

## Additional Context
Any other relevant information
```

### 💡 Feature Requests

For feature requests, please provide:

- **Clear description** of the proposed feature
- **Use case** and motivation
- **Alternative solutions** considered
- **Implementation suggestions** (optional)

#### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Screenshots, mockups, or examples
```

### 📝 Documentation

Documentation contributions are always welcome:

- **Fix typos** and improve clarity
- **Add examples** and use cases
- **Update outdated** information
- **Translate** documentation
- **Add API documentation** for new features

### 🔧 Code Contributions

Code contributions should follow our development standards and processes.

## Development Process

### Branching Strategy

We use a feature branch workflow:

```bash
# Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/your-feature-name

# Create pull request
```

### Branch Naming Conventions

- **feature/**: New features (`feature/user-authentication`)
- **fix/**: Bug fixes (`fix/login-redirect-issue`)
- **docs/**: Documentation updates (`docs/api-reference`)
- **refactor/**: Code refactoring (`refactor/auth-service`)
- **test/**: Test improvements (`test/component-coverage`)
- **chore/**: Maintenance tasks (`chore/update-dependencies`)

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates
- **perf**: Performance improvements
- **ci**: CI/CD changes

#### Examples

```bash
feat: add user authentication system
fix: resolve database connection timeout
docs: update API documentation for estimates endpoint
refactor: simplify error handling in auth service
test: add unit tests for estimation engine
chore: update dependencies to latest versions
```

### Code Standards

#### TypeScript Guidelines

- **Use TypeScript** for all new code
- **Define proper interfaces** for all data structures
- **Avoid `any` type** - use proper typing
- **Use strict mode** TypeScript configuration
- **Document complex types** with JSDoc comments

```typescript
// Good
interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'inspector' | 'manager' | 'admin';
  createdAt: Date;
}

// Avoid
const user: any = getData();
```

#### React Guidelines

- **Use functional components** with hooks
- **Implement proper prop typing** with interfaces
- **Use descriptive component names** in PascalCase
- **Extract custom hooks** for reusable logic
- **Implement error boundaries** for error handling

```tsx
// Good
interface UserCardProps {
  user: UserProfile;
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

export function UserCard({ user, onEdit, isLoading = false }: UserCardProps) {
  return (
    <div className="user-card">
      {/* Component content */}
    </div>
  );
}
```

#### CSS/Styling Guidelines

- **Use Tailwind CSS** for styling
- **Follow mobile-first** responsive design
- **Use semantic HTML** elements
- **Ensure accessibility** compliance
- **Test across browsers** and devices

```tsx
// Good
<button 
  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  onClick={handleClick}
>
  Submit
</button>
```

#### API Guidelines

- **Follow RESTful** conventions
- **Use proper HTTP** status codes
- **Implement consistent** error responses
- **Add input validation** with Zod schemas
- **Include request/response** typing

```typescript
// Good
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  role: z.enum(['inspector', 'manager'])
});

export async function createUser(req: Request, res: Response) {
  try {
    const userData = CreateUserSchema.parse(req.body);
    const user = await userService.create(userData);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    handleError(error, res);
  }
}
```

### Testing Requirements

All contributions must include appropriate tests:

#### Frontend Testing

- **Component tests** for all new React components
- **Hook tests** for custom React hooks
- **Integration tests** for user workflows
- **Accessibility tests** for UI components

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'inspector' as const,
    createdAt: new Date()
  };

  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} onEdit={jest.fn()} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });
});
```

#### Backend Testing

- **Unit tests** for all service functions
- **Integration tests** for API endpoints
- **Database tests** for data operations
- **Error handling tests** for edge cases

```typescript
// API endpoint test example
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('POST /api/users', () => {
  it('creates a new user with valid data', async () => {
    const userData = {
      email: 'newuser@example.com',
      name: 'New User',
      role: 'inspector'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(userData.email);
  });

  it('returns 400 for invalid email', async () => {
    const invalidData = {
      email: 'invalid-email',
      name: 'User',
      role: 'inspector'
    };

    await request(app)
      .post('/api/users')
      .send(invalidData)
      .expect(400);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test UserCard.test.tsx

# Run backend tests only
npm test -- tests/server

# Run frontend tests only
npm test -- tests/components
```

## Pull Request Process

### Before Submitting

- [ ] **Run all tests** and ensure they pass
- [ ] **Run linting** and fix any issues
- [ ] **Update documentation** if needed
- [ ] **Add tests** for new functionality
- [ ] **Check accessibility** requirements
- [ ] **Test cross-browser** compatibility
- [ ] **Verify responsive** design

### Pull Request Guidelines

#### Title Format

Use clear, descriptive titles following conventional commit format:

```
feat: add user role management system
fix: resolve authentication redirect loop
docs: update deployment guide with Docker instructions
```

#### Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- List of specific changes
- Another change
- And another

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing done

## Screenshots (if applicable)
Include screenshots for UI changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated checks** must pass (tests, linting, build)
2. **Code review** by at least one maintainer
3. **Additional reviews** for breaking changes
4. **Testing verification** by reviewers
5. **Documentation review** if applicable

### Review Criteria

Reviewers will check for:

- **Code quality** and adherence to standards
- **Test coverage** and quality
- **Documentation** updates
- **Performance** implications
- **Security** considerations
- **Accessibility** compliance
- **Breaking changes** assessment

## Code Review Guidelines

### As a Reviewer

- **Be constructive** and helpful in feedback
- **Explain reasoning** behind suggestions
- **Suggest alternatives** when pointing out issues
- **Acknowledge good** code and practices
- **Focus on code**, not the person
- **Test changes** locally when possible

#### Review Comment Examples

```markdown
# Good feedback
Consider using a more descriptive variable name here. `userProfiles` would be clearer than `data`.

# Good feedback with suggestion
This function is getting complex. Consider breaking it into smaller functions:
```typescript
function processUserData(users: User[]) {
  const validated = validateUsers(users);
  const transformed = transformUsers(validated);
  return saveUsers(transformed);
}
```

# Good appreciation
Nice use of the custom hook pattern here! This makes the component much cleaner.
```

### As a Contributor

- **Respond promptly** to review feedback
- **Ask questions** when feedback is unclear
- **Make requested changes** thoughtfully
- **Thank reviewers** for their time
- **Learn from feedback** for future contributions

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Release Workflow

1. **Feature freeze** for upcoming release
2. **Testing phase** with release candidates
3. **Documentation** updates
4. **Changelog** preparation
5. **Release** deployment
6. **Post-release** monitoring

## Issue Management

### Issue Triage

Issues are triaged and labeled:

- **Priority**: `critical`, `high`, `medium`, `low`
- **Type**: `bug`, `feature`, `enhancement`, `documentation`
- **Status**: `needs-triage`, `ready`, `in-progress`, `blocked`
- **Difficulty**: `good-first-issue`, `intermediate`, `advanced`

### Working on Issues

1. **Comment on the issue** to express interest
2. **Wait for assignment** from maintainers
3. **Ask questions** if requirements are unclear
4. **Provide updates** on progress
5. **Link your PR** to the issue

## Communication

### Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas
- **Pull Requests**: Code review, technical discussion

### Communication Guidelines

- **Be respectful** and professional
- **Search existing** issues/discussions first
- **Provide context** and details
- **Use clear** and descriptive titles
- **Tag relevant** people when appropriate

## Recognition

We value all contributions and recognize contributors:

- **Contributors** listed in README
- **Release notes** mention significant contributions
- **GitHub badges** for various contribution types
- **Special recognition** for outstanding contributions

## Getting Help

### Resources

- **Development Guide**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **API Documentation**: [API.md](API.md)
- **Architecture Guide**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)

### Support

- **GitHub Issues**: Technical problems
- **GitHub Discussions**: General questions
- **Email**: [Contact maintainers for sensitive issues]

## License

By contributing to PDL Property Inspector, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to PDL Property Inspector! Your efforts help make this project better for everyone. 🚀