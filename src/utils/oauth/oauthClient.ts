/**
 * OAuth 2.0 client implementation for social login
 */

import { OAUTH_CONFIG, generateOAuthState, generatePKCE, validateOAuthState, getPKCECodeVerifier } from './oauthConfig';

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

export interface SocialLoginResult {
  success: boolean;
  user?: OAuthUserInfo;
  provider: string;
  error?: string;
}

export class OAuthClient {
  /**
   * Initiates OAuth login flow by redirecting to provider's authorization URL
   */
  static async initiateLogin(providerId: 'google' | 'microsoft' | 'apple'): Promise<void> {
    const config = OAUTH_CONFIG[providerId];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${providerId}`);
    }

    // Generate security parameters
    const state = generateOAuthState();
    const { codeChallenge } = await generatePKCE();

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: config.responseType,
      scope: config.scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Add provider-specific parameters
    if (providerId === 'microsoft') {
      params.append('response_mode', 'query');
      params.append('prompt', 'select_account');
    } else if (providerId === 'apple') {
      params.append('response_mode', 'form_post');
    }

    const authUrl = `${config.authUrl}?${params.toString()}`;
    
    // Store provider for callback handling
    sessionStorage.setItem('oauth_provider', providerId);
    
    // Redirect to OAuth provider
    window.location.href = authUrl;
  }

  /**
   * Handles OAuth callback and exchanges authorization code for tokens
   */
  static async handleCallback(
    providerId: string,
    code: string,
    state: string
  ): Promise<SocialLoginResult> {
    try {
      // Validate state parameter (CSRF protection)
      if (!validateOAuthState(state)) {
        return {
          success: false,
          provider: providerId,
          error: 'Invalid state parameter. Possible CSRF attack.',
        };
      }

      const config = OAUTH_CONFIG[providerId as keyof typeof OAUTH_CONFIG];
      if (!config) {
        return {
          success: false,
          provider: providerId,
          error: `Unsupported OAuth provider: ${providerId}`,
        };
      }

      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForToken(config, code);
      if (!tokenResponse.success || !tokenResponse.data) {
        return {
          success: false,
          provider: providerId,
          error: tokenResponse.error || 'Failed to exchange authorization code for token',
        };
      }

      // Get user information
      const userInfo = await this.getUserInfo(config, tokenResponse.data);
      if (!userInfo.success || !userInfo.data) {
        return {
          success: false,
          provider: providerId,
          error: userInfo.error || 'Failed to retrieve user information',
        };
      }

      return {
        success: true,
        user: userInfo.data,
        provider: providerId,
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        provider: providerId,
        error: 'OAuth authentication failed. Please try again.',
      };
    }
  }

  /**
   * Exchanges authorization code for access token
   */
  private static async exchangeCodeForToken(
    config: any,
    code: string
  ): Promise<{ success: boolean; data?: OAuthTokenResponse; error?: string }> {
    try {
      const codeVerifier = getPKCECodeVerifier();
      if (!codeVerifier) {
        return { success: false, error: 'Missing PKCE code verifier' };
      }

      const tokenParams = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret || '', // Some providers don't require client secret for public clients
        code: code,
        redirect_uri: config.redirectUri,
        grant_type: config.grantType,
        code_verifier: codeVerifier,
      });

      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenParams.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', errorText);
        return { success: false, error: 'Failed to exchange authorization code for token' };
      }

      const tokenData: OAuthTokenResponse = await response.json();
      return { success: true, data: tokenData };
    } catch (error) {
      console.error('Token exchange error:', error);
      return { success: false, error: 'Network error during token exchange' };
    }
  }

  /**
   * Retrieves user information using access token
   */
  private static async getUserInfo(
    config: any,
    tokenData: OAuthTokenResponse
  ): Promise<{ success: boolean; data?: OAuthUserInfo; error?: string }> {
    try {
      // For Apple, user info is typically in the ID token
      if (config.id === 'apple' && tokenData.id_token) {
        return this.parseAppleIdToken(tokenData.id_token);
      }

      if (!config.userInfoUrl) {
        return { success: false, error: 'No user info endpoint configured' };
      }

      const response = await fetch(config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('User info fetch failed:', errorText);
        return { success: false, error: 'Failed to retrieve user information' };
      }

      const userData = await response.json();
      return {
        success: true,
        data: this.normalizeUserInfo(config.id, userData),
      };
    } catch (error) {
      console.error('User info fetch error:', error);
      return { success: false, error: 'Network error while retrieving user information' };
    }
  }

  /**
   * Parses Apple ID token to extract user information
   */
  private static parseAppleIdToken(idToken: string): { success: boolean; data?: OAuthUserInfo; error?: string } {
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        return { success: false, error: 'Invalid ID token format' };
      }

      const payload = JSON.parse(atob(parts[1]));
      return {
        success: true,
        data: {
          id: payload.sub,
          email: payload.email,
          name: payload.name ? `${payload.name.firstName} ${payload.name.lastName}` : payload.email,
          given_name: payload.name?.firstName,
          family_name: payload.name?.lastName,
        },
      };
    } catch (error) {
      return { success: false, error: 'Failed to parse Apple ID token' };
    }
  }

  /**
   * Normalizes user information from different providers
   */
  private static normalizeUserInfo(providerId: string, userData: any): OAuthUserInfo {
    switch (providerId) {
      case 'google':
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          given_name: userData.given_name,
          family_name: userData.family_name,
          locale: userData.locale,
        };

      case 'microsoft':
        return {
          id: userData.id,
          email: userData.mail || userData.userPrincipalName,
          name: userData.displayName,
          given_name: userData.givenName,
          family_name: userData.surname,
        };

      case 'apple':
        return {
          id: userData.sub,
          email: userData.email,
          name: userData.name ? `${userData.name.firstName} ${userData.name.lastName}` : userData.email,
          given_name: userData.name?.firstName,
          family_name: userData.name?.lastName,
        };

      default:
        return {
          id: userData.id || userData.sub,
          email: userData.email,
          name: userData.name || userData.displayName,
        };
    }
  }

  /**
   * Demo mode: Simulates OAuth flow for development/testing
   */
  static async simulateOAuthLogin(providerId: 'google' | 'microsoft' | 'apple'): Promise<SocialLoginResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const demoUsers = {
      google: {
        id: 'google_123456789',
        email: 'demo@gmail.com',
        name: 'Demo Google User',
        picture: 'https://lh3.googleusercontent.com/a/default-user',
        given_name: 'Demo',
        family_name: 'User',
      },
      microsoft: {
        id: 'microsoft_987654321',
        email: 'demo@outlook.com',
        name: 'Demo Microsoft User',
        given_name: 'Demo',
        family_name: 'User',
      },
      apple: {
        id: 'apple_555666777',
        email: 'demo@icloud.com',
        name: 'Demo Apple User',
        given_name: 'Demo',
        family_name: 'User',
      },
    };

    return {
      success: true,
      user: demoUsers[providerId],
      provider: providerId,
    };
  }
}