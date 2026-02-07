import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateOTP } from '@/lib/auth';
import { getOTPService, formatPhoneNumber, isValidPhoneNumber } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Validate phone number
    if (!phone || !isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { phone: formattedPhone },
      });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified OTPs for this user
    await prisma.otpCode.deleteMany({
      where: {
        userId: user.id,
        verified: false,
      },
    });

    // Create new OTP record
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        expiresAt,
      },
    });

    // Send OTP
    const otpService = getOTPService();
    const sent = await otpService.sendOTP(formattedPhone, otpCode);

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send OTP' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // In development, include OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
