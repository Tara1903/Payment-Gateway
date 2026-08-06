import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ORDER_JWT_SECRET ?? 'fallback-dev-secret-minimum-32-characters-long'
);
const JWT_ISSUER = process.env.JWT_ISSUER ?? 'starpay';
const JWT_AUDIENCE = 'starpay-checkout';
const JWT_EXPIRY = '30m';

export interface OrderTokenPayload {
  orderId: string;
  merchantId: string;
}

export async function signOrderToken(payload: OrderTokenPayload): Promise<string> {
  // Spread into plain object to satisfy JWTPayload's [key: string]: unknown index signature
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyOrderToken(token: string): Promise<OrderTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as OrderTokenPayload;
  } catch {
    return null;
  }
}
