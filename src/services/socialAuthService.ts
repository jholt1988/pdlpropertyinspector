/**
 * Social Authentication Service
 * Handles OAuth integration with the main authentication system
 */

import { OAuthClient, SocialLoginResult } from '../utils/oauth/oauthClient';
import { authService } from './authService';
import { generateAccessToken, generateRefreshToken, generateSessionId, generateTokenFamily } from '../utils/security/jwtUtils';
import { User } from '../types/user';

export interface SocialUser {
  providerId: string;
  providerUserId: string;
  email: string;
  name: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
}

export interface SocialLoginResponse {
  success: boolean;
  user?: User & { socialProviderId?: string; socialProviderUserId?: string };
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  needsAccountLinking?: boolean;
  existingEmail?: string;
}

export class SocialAuthService {
  private static users: Map<string, User & { socialProviderId?: string; socialProviderUserId?: string }> = new Map();
  private static sessions: Map<string, { userId: string; tokenFamily: string; createdAt: string }> = new Map();
  /**
   * Initiates social login flow
   */
  static async initiateSocialLogin(provider: 'google' | 'microsoft' | 'apple'): Promise<SocialLoginResponse | void> {
    try {
      // Check if we're in demo mode (for development/testing)
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || 
                        import.meta.env.NODE_ENV === 'development';

      if (isDemoMode) {
        // In demo mode, use simulated OAuth
        const result = await OAuthClient.simulateOAuthLogin(provider);
        if (result.success && result.user) {
          return await this.handleSocialLoginSuccess(result);
        }
        return {
          success: false,
          error: 'Demo login failed',
        };
      }

      // Production OAuth flow
      await OAuthClient.initiateLogin(provider);
    } catch (error) {
      console.error('Social login initiation error:', error);
      return {
        success: false,
        error: 'Failed to initiate social login',
      };
    }
  }

  /**
   * Handles OAuth callback from provider
   */
  static async handleOAuthCallback(
    provider: string,
    code: string,
    state: string
  ): Promise<SocialLoginResponse> {
    try {
      const result = await OAuthClient.handleCallback(provider, code, state);
      
      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error || 'Social authentication failed',
        };
      }

      return await this.handleSocialLoginSuccess(result);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        error: 'Failed to process OAuth callback',
      };
    }
  }

  /**
   * Processes successful social login
   */
  private static async handleSocialLoginSuccess(result: SocialLoginResult): Promise<SocialLoginResponse> {
    try {
      if (!result.user) {
        return {
          success: false,
          error: 'No user information received from provider',
        };
      }

      const socialUser: SocialUser = {
        providerId: result.provider,
        providerUserId: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.picture,
        firstName: result.user.given_name,
        lastName: result.user.family_name,
        locale: result.user.locale,
      };

      // Check if user already exists
      const existingUser = await this.findUserByEmail(socialUser.email);
      
      if (existingUser) {
        // Check if this social account is already linked
        if (existingUser.provider === 'email') {
          // User exists with email/password - offer account linking
          return {
            success: false,
            needsAccountLinking: true,
            existingEmail: socialUser.email,
            error: 'An account with this email already exists. Would you like to link your social account?',
          };
        } else if (existingUser.socialProviderId === socialUser.providerId && 
                   existingUser.socialProviderUserId === socialUser.providerUserId) {
          // Same social account - proceed with login
          return await this.loginExistingSocialUser(existingUser);
        } else {
          // Different social provider with same email
          return {
            success: false,
            error: `This email is already associated with ${existingUser.provider} login. Please use that method to sign in.`,
          };
        }
      } else {
        // New user - create account
        return await this.createSocialUser(socialUser);
      }
    } catch (error) {
      console.error('Social login processing error:', error);
      return {
        success: false,
        error: 'Failed to process social login',
      };
    }
  }

  /**
   * Creates a new user account from social login
   */
  private static async createSocialUser(socialUser: SocialUser): Promise<SocialLoginResponse> {
    try {
      const newUser: User & { socialProviderId: string; socialProviderUserId: string } = {
        id: `social_${socialUser.providerId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        email: socialUser.email,
        name: socialUser.name,
        role: 'property_manager',
        avatar: socialUser.avatar,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        emailVerified: true,
        provider: socialUser.providerId,
        company: undefined,
        phone: undefined,
        socialProviderId: socialUser.providerId,
        socialProviderUserId: socialUser.providerUserId
      };

      // Store user in the auth service
      await this.storeUser(newUser);

      // Generate tokens
      const sessionId = generateSessionId();
      const tokenFamily = generateTokenFamily();

      const accessToken = await generateAccessToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        sessionId,
      });

      const refreshToken = await generateRefreshToken({
        userId: newUser.id,
        sessionId,
        tokenFamily,
      });

      // Store session
      await this.storeSession(sessionId, newUser.id, tokenFamily);

      return {
        success: true,
        user: newUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Social user creation error:', error);
      return {
        success: false,
        error: 'Failed to create user account',
      };
    }
  }

  /**
   * Logs in an existing social user
   */
  private static async loginExistingSocialUser(user: User & { socialProviderId?: string; socialProviderUserId?: string }): Promise<SocialLoginResponse> {
    try {
      // Update last login
      user.lastLogin = new Date().toISOString();
      await this.updateUser(user);

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
      await this.storeSession(sessionId, user.id, tokenFamily);

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Social user login error:', error);
      return {
        success: false,
        error: 'Failed to log in user',
      };
    }
  }

  /**
   * Links a social account to an existing email/password account
   */
  static async linkSocialAccount(
    email: string,
    password: string,
    socialUser: SocialUser
  ): Promise<SocialLoginResponse> {
    try {
      // Verify existing user credentials
      const loginResult = await authService.login(email, password);
      if (!loginResult.success || !loginResult.user) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Update user with social account information
      const updatedUser: User & { socialProviderId?: string; socialProviderUserId?: string } = {
        ...loginResult.user!,
        provider: socialUser.providerId,
        socialProviderId: socialUser.providerId,
        socialProviderUserId: socialUser.providerUserId,
        avatar: socialUser.avatar || loginResult.user!.avatar,
        emailVerified: true,
        lastLogin: new Date().toISOString(),
      };

      await this.updateUser(updatedUser);

      return {
        success: true,
        user: updatedUser,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
      };
    } catch (error) {
      console.error('Account linking error:', error);
      return {
        success: false,
        error: 'Failed to link social account',
      };
    }
  }

  /**
   * Unlinks a social account (converts back to email/password only)
   */
  static async unlinkSocialAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.findUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (user.provider === 'email') {
        return { success: false, error: 'Account is not linked to a social provider' };
      }

      // Convert back to email provider
      const updatedUser: User = {
        ...user,
        provider: 'email',
        socialProviderId: undefined,
        socialProviderUserId: undefined,
      };

      await this.updateUser(updatedUser);

      return { success: true };
    } catch (error) {
      console.error('Account unlinking error:', error);
      return { success: false, error: 'Failed to unlink social account' };
    }
  }

  // Helper methods for data persistence
  // In a real application, these would interact with your database
  // For this demo, data is stored in memory only

  private static async findUserByEmail(email: string): Promise<(User & { socialProviderId?: string; socialProviderUserId?: string }) | undefined> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  private static async findUserById(userId: string): Promise<(User & { socialProviderId?: string; socialProviderUserId?: string }) | undefined> {
    return this.users.get(userId);
  }

  private static async storeUser(user: User & { socialProviderId?: string; socialProviderUserId?: string }): Promise<void> {
    this.users.set(user.id, user);
  }

  private static async updateUser(user: User & { socialProviderId?: string; socialProviderUserId?: string }): Promise<void> {
    this.users.set(user.id, user);
  }

  private static async storeSession(sessionId: string, userId: string, tokenFamily: string): Promise<void> {
    this.sessions.set(sessionId, { userId, tokenFamily, createdAt: new Date().toISOString() });
  }
}