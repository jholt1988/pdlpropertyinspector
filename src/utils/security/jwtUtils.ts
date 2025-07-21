import { JWTPayload, SignJWT, jwtVerify } from 'jose';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

const JWT_ISSUER = 'property-inspector-app';
const JWT_AUDIENCE = 'property-inspector-users';

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenFamily: string;
  iat?: number;
  exp?: number;
}

/**
 * Generates a JWT access token
 * @param payload - Token payload containing user information
 * @param expiresIn - Token expiration time (default: 15 minutes)
 * @returns Promise resolving to JWT token string
 */
export async function generateAccessToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  expiresIn: string = '15m'
): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Generates a JWT refresh token
 * @param payload - Refresh token payload
 * @param expiresIn - Token expiration time (default: 7 days)
 * @returns Promise resolving to JWT refresh token string
 */
export async function generateRefreshToken(
  payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>,
  expiresIn: string = '7d'
): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token to verify
 * @returns Promise resolving to decoded token payload
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload as unknown as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verifies and decodes a JWT refresh token
 * @param token - JWT refresh token to verify
 * @returns Promise resolving to decoded refresh token payload
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload as unknown as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Extracts token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null if not found
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Generates a unique session ID
 * @returns Random session ID string
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generates a unique token family ID for refresh token rotation
 * @returns Random token family ID string
 */
export function generateTokenFamily(): string {
  return `family_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}