import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export interface JWTPayload {
  userId: string;
  phone: string;
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Generate OTP
// In mock/demo mode, always use "123456" for easy testing
// In production, generate a random 6-digit code
export function generateOTP(): string {
  const otpService = process.env.OTP_SERVICE || 'mock';

  if (otpService === 'mock') {
    return '123456'; // Fixed OTP for demo mode
  }

  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get current user from request
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        swiggySession: {
          select: {
            isActive: true,
            expiresAt: true,
          },
        },
      },
    });

    return user;
  } catch {
    return null;
  }
}

// Check if user has connected Swiggy
export async function hasSwiggyConnection(userId: string): Promise<boolean> {
  const session = await prisma.swiggySession.findUnique({
    where: { userId },
  });

  if (!session || !session.isActive) {
    return false;
  }

  // Check if session has expired
  if (session.expiresAt && session.expiresAt < new Date()) {
    return false;
  }

  return true;
}

// Order status constants
export const OrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  CART_READY: 'CART_READY',
  PLACED: 'PLACED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];
