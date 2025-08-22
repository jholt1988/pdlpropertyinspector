/**
 * OAuth 2.0 configuration for social login providers
 */

export interface OAuthProvider {
  id: string;
  name: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  scope: string;
  redirectUri: string;
  responseType: string;
  grantType: string;
}

export interface OAuthConfig {
  google: OAuthProvider;
  microsoft: OAuthProvider;
  apple: OAuthProvider;
}

// OAuth endpoints and configuration
export const OAUTH_CONFIG: OAuthConfig = {
  google: {
    id: 'google',
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId: import.meta.env?.VITE_GOOGLE_CLIENT_ID || 'demo-google-client-id',
    scope: 'openid email profile',
    redirectUri: `${window.location.origin}/auth/callback/google`,
    responseType: 'code',
    grantType: 'authorization_code',
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    clientId: import.meta.env?.VITE_MICROSOFT_CLIENT_ID || 'demo-microsoft-client-id',
    scope: 'openid email profile User.Read',
    redirectUri: `${window.location.origin}/auth/callback/microsoft`,
    responseType: 'code',
    grantType: 'authorization_code',
  },
  apple: {
    id: 'apple',
    name: 'Apple',
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: '', // Apple provides user info in the token response
    clientId: import.meta.env?.VITE_APPLE_CLIENT_ID || 'demo-apple-client-id',
    scope: 'name email',
    redirectUri: `${window.location.origin}/auth/callback/apple`,
    responseType: 'code',
    grantType: 'authorization_code',
  },
};

/**
 * Generates state parameter for OAuth flow (CSRF protection)
 */
export function generateOAuthState(): string {
  const state = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  sessionStorage.setItem('oauth_state', state);
  return state;
}

/**
 * Validates OAuth state parameter
 */
export function validateOAuthState(receivedState: string): boolean {
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state'); // Clean up
  return storedState === receivedState;
}

/**
 * Generates PKCE code verifier and challenge for enhanced security
 */
export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = generateRandomString(128);
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  return { codeVerifier, codeChallenge };
}

/**
 * Retrieves PKCE code verifier from session storage
 */
export function getPKCECodeVerifier(): string | null {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  sessionStorage.removeItem('pkce_code_verifier'); // Clean up
  return codeVerifier;
}

/**
 * Generates a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}