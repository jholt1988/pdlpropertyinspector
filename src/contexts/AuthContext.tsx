import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'microsoft' | 'apple') => Promise<void>;
  isAuthenticated: boolean;
  needsEmailVerification: boolean;
}

interface RegisterData {
  email: string;
  password: string;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    checkAuthStatus();
    // Initialize demo users if they don't exist
    initializeDemoUsers();
  }, []);

  const initializeDemoUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    
    const demoUsers = [
      {
        id: 'demo_manager',
        email: 'manager@demo.com',
        password: 'demo123',
        name: 'John Manager',
        role: 'property_manager',
        company: 'Premier Property Management',
        phone: '+1 (555) 123-4567',
        createdAt: new Date().toISOString(),
        emailVerified: true,
        provider: 'email',
      },
      {
        id: 'demo_landlord',
        email: 'landlord@demo.com',
        password: 'demo123',
        name: 'Sarah Landlord',
        role: 'landlord',
        company: 'Landlord Properties LLC',
        phone: '+1 (555) 234-5678',
        createdAt: new Date().toISOString(),
        emailVerified: true,
        provider: 'email',
      },
      {
        id: 'demo_tenant',
        email: 'tenant@demo.com',
        password: 'demo123',
        name: 'Mike Tenant',
        role: 'tenant',
        phone: '+1 (555) 345-6789',
        createdAt: new Date().toISOString(),
        emailVerified: true,
        provider: 'email',
      },
      {
        id: 'demo_maintenance',
        email: 'maintenance@demo.com',
        password: 'demo123',
        name: 'Alex Maintenance',
        role: 'maintenance',
        company: 'Fix-It Services',
        phone: '+1 (555) 456-7890',
        createdAt: new Date().toISOString(),
        emailVerified: true,
        provider: 'email',
      },
    ];

    // Add demo users if they don't exist
    demoUsers.forEach(demoUser => {
      const exists = storedUsers.find((u: any) => u.email === demoUser.email);
      if (!exists) {
        storedUsers.push(demoUser);
      }
    });

    localStorage.setItem('registered_users', JSON.stringify(storedUsers));
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear invalid data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get stored users
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      
      // Find user by email
      const foundUser = storedUsers.find((u: any) => u.email === email);
      
      if (!foundUser) {
        throw new Error('User not found. Please check your email or register for a new account.');
      }
      
      if (foundUser.password !== password) {
        throw new Error('Invalid password. Please try again.');
      }
      
      // Create user session
      const userSession: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        company: foundUser.company,
        phone: foundUser.phone,
        avatar: foundUser.avatar,
        createdAt: foundUser.createdAt,
        lastLogin: new Date().toISOString(),
        emailVerified: foundUser.emailVerified || false,
        provider: foundUser.provider || 'email',
      };
      
      // Update last login
      const updatedUsers = storedUsers.map((u: any) => 
        u.id === foundUser.id ? { ...u, lastLogin: userSession.lastLogin } : u
      );
      localStorage.setItem('registered_users', JSON.stringify(updatedUsers));
      
      // Store session
      const token = `token_${foundUser.id}_${Date.now()}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userSession));
      
      setUser(userSession);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get existing users
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      
      // Check if email already exists
      const existingUser = storedUsers.find((u: any) => u.email === userData.email);
      if (existingUser) {
        throw new Error('An account with this email already exists. Please use a different email or try logging in.');
      }
      
      // Create new user
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        password: userData.password, // In real app, this would be hashed
        name: userData.name,
        role: userData.role,
        company: userData.company,
        phone: userData.phone,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        provider: 'email',
        verificationToken: `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      // Store user
      storedUsers.push(newUser);
      localStorage.setItem('registered_users', JSON.stringify(storedUsers));
      
      // Store verification token for demo purposes
      localStorage.setItem(`verification_${newUser.email}`, newUser.verificationToken);
      
      // Auto-login after registration (but user will need to verify email)
      const userSession: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        company: newUser.company,
        phone: newUser.phone,
        createdAt: newUser.createdAt,
        emailVerified: false,
        provider: 'email',
      };
      
      const token = `token_${newUser.id}_${Date.now()}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userSession));
      
      setUser(userSession);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const userIndex = storedUsers.findIndex((u: any) => u.verificationToken === token);
      
      if (userIndex === -1) {
        throw new Error('Invalid or expired verification token.');
      }
      
      // Mark user as verified
      storedUsers[userIndex].emailVerified = true;
      storedUsers[userIndex].verificationToken = null;
      localStorage.setItem('registered_users', JSON.stringify(storedUsers));
      
      // Update current user session if it's the same user
      if (user && user.id === storedUsers[userIndex].id) {
        const updatedUser = { ...user, emailVerified: true };
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
      
      // Clean up verification token
      localStorage.removeItem(`verification_${storedUsers[userIndex].email}`);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const foundUser = storedUsers.find((u: any) => u.email === email);
    
    if (!foundUser) {
      throw new Error('User not found.');
    }
    
    if (foundUser.emailVerified) {
      throw new Error('Email is already verified.');
    }
    
    // Generate new verification token
    const newToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    foundUser.verificationToken = newToken;
    
    const updatedUsers = storedUsers.map((u: any) => 
      u.email === email ? foundUser : u
    );
    localStorage.setItem('registered_users', JSON.stringify(updatedUsers));
    localStorage.setItem(`verification_${email}`, newToken);
  };

  const socialLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
    setIsLoading(true);
    
    try {
      // Simulate OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate social login response
      const socialUserData = {
        google: {
          id: `google_${Date.now()}`,
          email: 'user@gmail.com',
          name: 'Google User',
          avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        },
        microsoft: {
          id: `microsoft_${Date.now()}`,
          email: 'user@outlook.com',
          name: 'Microsoft User',
          avatar: 'https://graph.microsoft.com/v1.0/me/photo/$value',
        },
        apple: {
          id: `apple_${Date.now()}`,
          email: 'user@icloud.com',
          name: 'Apple User',
          avatar: null,
        },
      };
      
      const socialData = socialUserData[provider];
      
      // Check if user already exists
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      let existingUser = storedUsers.find((u: any) => u.email === socialData.email);
      
      if (!existingUser) {
        // Create new user from social login
        existingUser = {
          id: socialData.id,
          email: socialData.email,
          name: socialData.name,
          role: 'property_manager', // Default role
          avatar: socialData.avatar,
          createdAt: new Date().toISOString(),
          emailVerified: true, // Social logins are pre-verified
          provider: provider,
        };
        
        storedUsers.push(existingUser);
        localStorage.setItem('registered_users', JSON.stringify(storedUsers));
      }
      
      // Create user session
      const userSession: User = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        company: existingUser.company,
        phone: existingUser.phone,
        avatar: existingUser.avatar,
        createdAt: existingUser.createdAt,
        lastLogin: new Date().toISOString(),
        emailVerified: true,
        provider: provider,
      };
      
      // Update last login
      const updatedUsers = storedUsers.map((u: any) => 
        u.id === existingUser.id ? { ...u, lastLogin: userSession.lastLogin } : u
      );
      localStorage.setItem('registered_users', JSON.stringify(updatedUsers));
      
      // Store session
      const token = `token_${existingUser.id}_${Date.now()}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userSession));
      
      setUser(userSession);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const foundUser = storedUsers.find((u: any) => u.email === email);
    
    if (!foundUser) {
      throw new Error('No account found with this email address.');
    }
    
    // In a real app, this would send a reset email
    // For demo purposes, we'll just show a success message
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...user, ...userData };
      
      // Update stored user data
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const updatedUsers = storedUsers.map((u: any) => 
        u.id === user.id ? { ...u, ...userData } : u
      );
      localStorage.setItem('registered_users', JSON.stringify(updatedUsers));
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    verifyEmail,
    resendVerificationEmail,
    socialLogin,
    isAuthenticated: !!user,
    needsEmailVerification: !!user && !user.emailVerified && user.provider === 'email',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}