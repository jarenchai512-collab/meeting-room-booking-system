import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { User, UserRole } from "../data/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-key-32characters-long-safe-default-2026";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  username: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  [key: string]: any;
}

/**
 * Sign JWT token for user session
 */
export async function signUserToken(user: User): Promise<string> {
  const payload: TokenPayload = {
    userId: user.userId,
    username: user.username,
    name: user.name,
    email: user.email,
    department: user.department,
    role: user.role,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(encodedSecret);

  return token;
}

/**
 * Verify JWT token string
 */
export async function verifyUserToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compare plain password with stored hash
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
