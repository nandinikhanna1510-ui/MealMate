import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Demo mode - set to true to simulate Swiggy OTP (since real Swiggy MCP may not be available)
const DEMO_MODE = true;

/**
 * Send OTP to user's Swiggy phone number
 * POST /api/swiggy/auth/send-otp
 */
export async function POST(request: NextRequest) {
  try {
    // User must be logged into MealMate first
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to MealMate first' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format (Indian format)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 12) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Format phone number with country code
    const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;

    console.log(`[Swiggy Auth] Sending OTP to ${formattedPhone} for user ${user.id}`);

    // Demo mode - simulate OTP sent
    if (DEMO_MODE) {
      console.log(`[Swiggy Auth] DEMO MODE: OTP "123456" for ${formattedPhone}`);
      return NextResponse.json({
        success: true,
        message: 'OTP sent to your Swiggy registered phone number',
        phone: formattedPhone,
        demoMode: true,
        hint: 'Demo mode: Use OTP 123456',
      });
    }

    // Production mode - Call Swiggy MCP to send OTP
    const { SwiggyMCPClient } = await import('@/lib/swiggy-mcp');
    const result = await SwiggyMCPClient.sendOtp(formattedPhone);

    if (!result.success) {
      console.error(`[Swiggy Auth] Failed to send OTP: ${result.error}`);
      return NextResponse.json(
        { error: result.error || 'Failed to send OTP to Swiggy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your Swiggy registered phone number',
      phone: formattedPhone,
    });

  } catch (error) {
    console.error('[Swiggy Auth] Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
