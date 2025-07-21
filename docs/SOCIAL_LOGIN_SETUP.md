# Social Login Setup Guide

This guide explains how to set up and configure social login (OAuth 2.0) for Google, Microsoft, and Apple in your Property Inspector application.

## 🔧 **Configuration Overview**

The social login system supports:
- **Google OAuth 2.0**
- **Microsoft OAuth 2.0** (Azure AD)
- **Apple Sign In**
- **Account linking** (connect social accounts to existing email/password accounts)
- **Secure token handling** with PKCE
- **Demo mode** for development/testing

## 🚀 **Quick Start (Demo Mode)**

For development and testing, you can use the built-in demo mode:

1. Set environment variable:
```bash
VITE_DEMO_MODE=true
```

2. The social login buttons will work with simulated OAuth flows
3. Demo users will be created automatically

## 🔐 **Production Setup**

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `https://yourdomain.com/auth/callback/google`
   - `http://localhost:5173/auth/callback/google` (for development)

```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set redirect URIs:
   - `https://yourdomain.com/auth/callback/microsoft`
   - `http://localhost:5173/auth/callback/microsoft`
5. Under "API permissions", add Microsoft Graph permissions:
   - `User.Read`
   - `openid`
   - `email`
   - `profile`

```bash
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

### 3. Apple Sign In Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Sign in with your Apple Developer account
3. Navigate to "Certificates, Identifiers & Profiles"
4. Create a new App ID with Sign In with Apple capability
5. Create a Service ID for web authentication
6. Configure redirect URLs:
   - `https://yourdomain.com/auth/callback/apple`

```bash
VITE_APPLE_CLIENT_ID=your-apple-service-id
APPLE_CLIENT_SECRET=your-apple-client-secret
```

## 🔧 **Environment Configuration**

Create a `.env` file with the following variables:

```bash
# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

VITE_APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret

# Demo Mode (set to false in production)
VITE_DEMO_MODE=false

# App URL
VITE_APP_URL=https://yourdomain.com

# Security
JWT_SECRET=your-super-secure-jwt-secret
```

## 🏗️ **Architecture Overview**

### OAuth Flow Components

1. **OAuth Client** (`src/utils/oauth/oauthClient.ts`)
   - Handles OAuth 2.0 flow
   - Manages PKCE security
   - Processes provider callbacks

2. **Social Auth Service** (`src/services/socialAuthService.ts`)
   - Integrates OAuth with main auth system
   - Handles user creation and linking
   - Manages token generation

3. **Social Login Buttons** (`src/components/SocialLoginButtons.tsx`)
   - UI components for social login
   - Provider-specific styling
   - Loading states and error handling

4. **OAuth Callback Page** (`src/pages/auth/SocialCallbackPage.tsx`)
   - Handles OAuth provider redirects
   - Processes authorization codes
   - Manages account linking flow

### Security Features

- **PKCE (Proof Key for Code Exchange)** - Enhanced security for public clients
- **State Parameter** - CSRF protection
- **Secure Token Storage** - JWT with refresh token rotation
- **Account Linking** - Connect social accounts to existing accounts
- **Audit Logging** - Track all social login events

## 🔄 **OAuth Flow Diagram**

```
1. User clicks social login button
   ↓
2. Redirect to OAuth provider (Google/Microsoft/Apple)
   ↓
3. User authenticates with provider
   ↓
4. Provider redirects to callback URL with authorization code
   ↓
5. Exchange code for access token
   ↓
6. Retrieve user information from provider
   ↓
7. Create user account or link to existing account
   ↓
8. Generate JWT tokens and establish session
   ↓
9. Redirect to application
```

## 🔗 **Account Linking Flow**

When a user tries to sign in with a social provider but an account with that email already exists:

1. System detects existing email
2. Shows account linking dialog
3. User enters existing password
4. System links social account to existing account
5. User can now login with either method

## 🛠️ **Customization**

### Adding New OAuth Providers

1. Add provider configuration to `src/utils/oauth/oauthConfig.ts`
2. Update `OAuthClient` to handle provider-specific flows
3. Add UI button to `SocialLoginButtons.tsx`
4. Update callback routing in `App.tsx`

### Customizing User Data Mapping

Modify the `normalizeUserInfo` function in `OAuthClient` to map provider-specific user data to your application's user model.

### Custom Redirect URLs

Update the redirect URIs in:
- OAuth provider console settings
- `oauthConfig.ts` configuration
- App routing configuration

## 🔍 **Testing & Debugging**

### Demo Mode Testing

1. Set `VITE_DEMO_MODE=true`
2. Social login buttons will simulate OAuth flow
3. No actual provider setup required
4. Creates demo users automatically

### Production Testing Checklist

- [ ] OAuth applications configured correctly
- [ ] Redirect URIs match exactly
- [ ] Client IDs and secrets are correct
- [ ] HTTPS enabled for production
- [ ] Callback pages handle errors gracefully
- [ ] Account linking works properly
- [ ] Audit logging captures events

### Common Issues

1. **Redirect URI Mismatch**
   - Ensure callback URLs match exactly in provider console
   - Check for trailing slashes and HTTP vs HTTPS

2. **Client Secret Issues**
   - Some providers don't require client secrets for public clients
   - Ensure secrets are properly configured if required

3. **Scope Permissions**
   - Verify required scopes are requested
   - Check if additional permissions need user consent

## 📊 **Monitoring & Analytics**

The system includes comprehensive audit logging:

- All social login attempts (success/failure)
- Account creation and linking events
- User agent and IP tracking
- Provider-specific metadata

Query audit logs:
```sql
SELECT * FROM social_login_audit 
WHERE provider = 'google' 
  AND created_at > now() - interval '24 hours';
```

## 🔐 **Security Best Practices**

1. **Always use HTTPS** in production
2. **Validate redirect URIs** strictly
3. **Implement PKCE** for all OAuth flows
4. **Store client secrets securely**
5. **Monitor for suspicious activity**
6. **Regularly rotate secrets**
7. **Audit user permissions**

## 🚀 **Deployment**

### Environment Variables

Set all required OAuth configuration variables in your deployment environment:

```bash
# Production example
VITE_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
VITE_MICROSOFT_CLIENT_ID=abcd1234-5678-90ef-ghij-klmnopqrstuv
VITE_APPLE_CLIENT_ID=com.yourapp.service
VITE_DEMO_MODE=false
```

### Domain Configuration

Update OAuth provider configurations with production domains:
- Remove localhost URLs
- Add production callback URLs
- Update CORS settings if needed

This comprehensive social login implementation provides enterprise-grade OAuth 2.0 integration while maintaining the highest security standards.