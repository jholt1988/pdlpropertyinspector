import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, LoginResult, RegisterResult } from '../services/authService';
import { User } from '../types/user';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/security/jwtUtils';

export interface AuthContextType {
  user: Omit<User, 'passwordHash'> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsEmailVerification: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (userData: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: 'property_manager' | 'landlord' | 'tenant' | 'maintenance';
  company?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'passwordHash'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
    
    // Set up automatic token refresh with stable function reference
    let refreshInterval: NodeJS.Timeout | null = null;
    
    const setupTokenRefresh = () => {
      if (refreshTokenValue && !refreshInterval) {
        refreshInterval = setInterval(() => {
          refreshToken();
        }, 10 * 60 * 1000); // Refresh every 10 minutes
      }
    };
    
    setupTokenRefresh();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    };
  }, [refreshTokenValue]);

  const checkAuthStatus = async () => {
    try {
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (!storedAccessToken || !storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Verify access token
        const payload = await verifyAccessToken(storedAccessToken);
        
        // Get complete user data from auth service
        const fullUser = authService.getUserById(payload.userId);
        if (!fullUser) {
          clearTokens();
          setIsLoading(false);
          return;
        }
        
        // Remove sensitive data for context
        const { passwordHash, emailVerificationToken, passwordResetToken, ...userData } = fullUser;
        
        setUser(userData);
        setAccessToken(storedAccessToken);
        setRefreshTokenValue(storedRefreshToken);
      } catch (error) {
        // Access token expired, try to refresh
        const refreshResult = await authService.refreshToken(storedRefreshToken);
        
        if (refreshResult.accessToken) {
          localStorage.setItem('accessToken', refreshResult.accessToken);
          setAccessToken(refreshResult.accessToken);
          
          const payload = await verifyAccessToken(refreshResult.accessToken);
          
          // Get complete user data from auth service
          const fullUser = authService.getUserById(payload.userId);
          if (!fullUser) {
            clearTokens();
            setIsLoading(false);
            return;
          }
          
          // Remove sensitive data for context
          const { passwordHash, emailVerificationToken, passwordResetToken, ...userData } = fullUser;
          
          setUser(userData);
          setRefreshTokenValue(storedRefreshToken);
        } else {
          // Refresh failed, clear tokens
          clearTokens();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      const result = await authService.login(email, password);
      
      if (result.success && result.user && result.accessToken && result.refreshToken) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setRefreshTokenValue(result.refreshToken);
        
        // Store tokens securely
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<RegisterResult> => {
    try {
      setIsLoading(true);
      return await authService.register(userData);
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Invalidate session on server
      const token = extractTokenFromHeader(`Bearer ${accessToken}`);
      if (token) {
        const payload = await verifyAccessToken(token);
        await authService.logout(payload.sessionId);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    return authService.initiatePasswordReset(email);
  };

  const verifyEmail = async (token: string) => {
    return authService.verifyEmail(token);
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!refreshTokenValue) {
      return false;
    }

    try {
      const result = await authService.refreshToken(refreshTokenValue);
      
      if (result.accessToken) {
        setAccessToken(result.accessToken);
        localStorage.setItem('accessToken', result.accessToken);
        return true;
      } else {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearTokens();
      setUser(null);
      return false;
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const result = await authService.updateProfile(user.id, userData);
      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshTokenValue(null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    needsEmailVerification: !!user && !user.emailVerified && user.provider === 'email',
    login,
    register,
    logout,
    resetPassword,
    verifyEmail,
    refreshToken,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}