import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  generateSessionId, 
  generateTokenFamily,
  TokenPayload 
} from '../utils/security/jwtUtils';
import { hashPassword, verifyPassword } from '../utils/security/passwordUtils';
import { validateRegistrationData, validateLoginCredentials } from '../utils/security/inputValidation';
import { loginRateLimiter, registrationRateLimiter, passwordResetRateLimiter } from '../utils/security/rateLimiter';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'property_manager' | 'landlord' | 'tenant' | 'maintenance';
  company?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  emailVerified: boolean;
  provider: 'email' | 'google' | 'microsoft' | 'apple';
  passwordHash?: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
}

export interface LoginResult {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  rateLimited?: boolean;
  remainingAttempts?: number;
}

export interface RegisterResult {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  error?: string;
  rateLimited?: boolean;
  needsEmailVerification?: boolean;
}

export class AuthService {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, { userId: string; tokenFamily: string; createdAt: string }> = new Map();

  constructor() {
    this.loadUsers();
    this.initializeDemoUsers();
  }

  /**
   * Registers a new user with secure validation and password hashing
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'property_manager' | 'landlord' | 'tenant' | 'maintenance';
    company?: string;
    phone?: string;
  }): Promise<RegisterResult> {
    try {
      // Rate limiting check
      const rateLimitResult = registrationRateLimiter.checkLimit(userData.email.toLowerCase());
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: 'Too many registration attempts. Please try again later.',
          rateLimited: true,
        };
      }

      // Validate and sanitize input
      const validation = validateRegistrationData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      const sanitizedData = validation.sanitizedData!;

      // Check if user already exists
      const existingUser = this.findUserByEmail(sanitizedData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists.',
        };
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);

      // Generate email verification token
      const emailVerificationToken = this.generateSecureToken();

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: sanitizedData.email,
        name: sanitizedData.name,
        role: userData.role,
        company: sanitizedData.company,
        phone: sanitizedData.phone,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        provider: 'email',
        passwordHash,
        isActive: true,
        failedLoginAttempts: 0,
        emailVerificationToken,
      };

      // Store user
      this.users.set(newUser.id, newUser);
      this.saveUsers();

      // Remove sensitive data from response
      const { passwordHash: _, emailVerificationToken: __, ...userResponse } = newUser;

      return {
        success: true,
        user: userResponse,
        needsEmailVerification: true,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }
  }

  /**
   * Authenticates user with secure validation and rate limiting
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Rate limiting check
      const rateLimitResult = loginRateLimiter.checkLimit(email.toLowerCase(), false);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          rateLimited: true,
        };
      }

      // Validate input
      const validation = validateLoginCredentials(email, password);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid credentials.',
          remainingAttempts: rateLimitResult.remaining,
        };
      }

      const sanitizedData = validation.sanitizedData!;

      // Find user
      const user = this.findUserByEmail(sanitizedData.email);
      if (!user || !user.passwordHash) {
        // Perform dummy password verification to prevent timing attacks
        await hashPassword('dummy_password');
        
        return {
          success: false,
          error: 'Invalid credentials.',
          remainingAttempts: rateLimitResult.remaining - 1,
        };
      }

      // Check if user is locked
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        return {
          success: false,
          error: 'Account is temporarily locked. Please try again later.',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account has been deactivated. Please contact support.',
        };
      }

      // Verify password
      const passwordValid = await verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        // Increment failed attempts
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

        // Lock account after too many failures
        if (user.failedLoginAttempts >= 10) {
          user.lockedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // Lock for 1 hour
        }

        this.users.set(user.id, user);
        this.saveUsers();

        return {
          success: false,
          error: 'Invalid credentials.',
          remainingAttempts: rateLimitResult.remaining - 1,
        };
      }

      // Successful login - reset failed attempts and rate limiter
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      user.lastLogin = new Date().toISOString();
      this.users.set(user.id, user);
      this.saveUsers();

      // Reset rate limiter for successful login
      loginRateLimiter.resetLimit(sanitizedData.email);

      // Generate tokens
      const sessionId = generateSessionId();
      const tokenFamily = generateTokenFamily();

      const accessToken = await generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId,
      });

      const refreshToken = await generateRefreshToken({
        userId: user.id,
        sessionId,
        tokenFamily,
      });

      // Store session
      this.sessions.set(sessionId, {
        userId: user.id,
        tokenFamily,
        createdAt: new Date().toISOString(),
      });

      // Remove sensitive data from response
      const { passwordHash, emailVerificationToken, passwordResetToken, ...userResponse } = user;

      return {
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    }
  }

  /**
   * Refreshes access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken?: string; error?: string }> {
    try {
      // Verify refresh token
      const payload = await verifyRefreshToken(refreshToken);

      // Check if session exists
      const session = this.sessions.get(payload.sessionId);
      if (!session || session.tokenFamily !== payload.tokenFamily) {
        // Potential token reuse - invalidate all sessions for user
        this.invalidateUserSessions(payload.userId);
        return { error: 'Invalid refresh token. Please login again.' };
      }

      // Get user
      const user = this.users.get(payload.userId);
      if (!user || !user.isActive) {
        return { error: 'User not found or inactive.' };
      }

      // Generate new access token
      const accessToken = await generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: payload.sessionId,
      });

      return { accessToken };
    } catch (error) {
      return { error: 'Invalid refresh token.' };
    }
  }

  /**
   * Logs out user and invalidates session
   */
  async logout(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  /**
   * Initiates password reset process
   */
  async initiatePasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Rate limiting
      const rateLimitResult = passwordResetRateLimiter.checkLimit(email.toLowerCase());
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: 'Too many password reset attempts. Please try again later.',
        };
      }

      const user = this.findUserByEmail(email.toLowerCase());
      if (!user) {
        // Don't reveal if user exists
        return { success: true };
      }

      // Generate reset token
      const resetToken = this.generateSecureToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      
      this.users.set(user.id, user);
      this.saveUsers();

      // In a real app, send email here
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to initiate password reset.' };
    }
  }

  /**
   * Verifies email using verification token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = Array.from(this.users.values()).find(u => u.emailVerificationToken === token);
      
      if (!user) {
        return { success: false, error: 'Invalid verification token.' };
      }

      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      
      this.users.set(user.id, user);
      this.saveUsers();

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Email verification failed.' };
    }
  }

  /**
   * Gets user by ID
   */
  getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Updates user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string; user?: Omit<User, 'passwordHash'> }> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Update user with new data
      const updatedUser = { ...user, ...updates };
      this.users.set(userId, updatedUser);
      this.saveUsers();

      // Return user without sensitive data
      const { passwordHash, emailVerificationToken, passwordResetToken, ...userResponse } = updatedUser;
      return { success: true, user: userResponse };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  // Helper methods
  private findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email === email.toLowerCase());
  }

  private generateSecureToken(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  }

  private invalidateUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }

  private loadUsers(): void {
    try {
      const stored = localStorage.getItem('secure_users');
      if (stored) {
        const usersArray = JSON.parse(stored);
        usersArray.forEach((user: User) => {
          this.users.set(user.id, user);
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  private saveUsers(): void {
    try {
      const usersArray = Array.from(this.users.values());
      localStorage.setItem('secure_users', JSON.stringify(usersArray));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  private initializeDemoUsers(): void {
    // Only initialize if no users exist
    if (this.users.size > 0) return;

    const demoUsers = [
      {
        email: 'manager@demo.com',
        password: 'SecureDemo123!',
        name: 'John Manager',
        role: 'property_manager' as const,
        company: 'Premier Property Management',
        phone: '+1-555-123-4567',
      },
      {
        email: 'landlord@demo.com',
        password: 'SecureDemo123!',
        name: 'Sarah Landlord',
        role: 'landlord' as const,
        company: 'Landlord Properties LLC',
        phone: '+1-555-234-5678',
      },
    ];

    demoUsers.forEach(async (demoUser) => {
      try {
        await this.register({
          ...demoUser,
          confirmPassword: demoUser.password,
        });

        // Auto-verify demo users
        const user = this.findUserByEmail(demoUser.email);
        if (user) {
          user.emailVerified = true;
          user.emailVerificationToken = undefined;
          this.users.set(user.id, user);
        }
      } catch (error) {
        console.error('Error creating demo user:', error);
      }
    });

    this.saveUsers();
  }
}

// Export singleton instance
export const authService = new AuthService();