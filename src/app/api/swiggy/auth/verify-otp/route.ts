import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// Demo mode - set to true to simulate Swiggy OTP verification
const DEMO_MODE = true;
const DEMO_OTP = '123456';

// Demo addresses for testing
const DEMO_ADDRESSES = [
  {
    swiggyAddressId: 'addr_demo_home',
    label: 'Home',
    addressLine1: '123 MG Road, Koramangala',
    addressLine2: 'Near Forum Mall',
    city: 'Bangalore',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245,
    isDefault: true,
  },
  {
    swiggyAddressId: 'addr_demo_work',
    label: 'Work',
    addressLine1: '456 Whitefield Main Road',
    addressLine2: 'Tech Park, Building 5',
    city: 'Bangalore',
    pincode: '560066',
    latitude: 12.9698,
    longitude: 77.7500,
    isDefault: false,
  },
];

/**
 * Verify Swiggy OTP and store authentication tokens
 * POST /api/swiggy/auth/verify-otp
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
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Clean and format phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;

    console.log(`[Swiggy Auth] Verifying OTP for ${formattedPhone}, user ${user.id}`);

    // Demo mode - verify with demo OTP
    if (DEMO_MODE) {
      if (otp !== DEMO_OTP) {
        return NextResponse.json(
          { error: 'Invalid OTP. Demo mode: Use 123456' },
          { status: 400 }
        );
      }

      // Create demo session
      const demoAccessToken = `demo_token_${user.id}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create or update Swiggy session
      const swiggySession = await prisma.swiggySession.upsert({
        where: { userId: user.id },
        update: {
          swiggyUserId: `swiggy_demo_${cleanPhone}`,
          swiggyPhone: formattedPhone,
          accessToken: demoAccessToken,
          refreshToken: `demo_refresh_${user.id}`,
          expiresAt,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          swiggyUserId: `swiggy_demo_${cleanPhone}`,
          swiggyPhone: formattedPhone,
          accessToken: demoAccessToken,
          refreshToken: `demo_refresh_${user.id}`,
          expiresAt,
          isActive: true,
        },
      });

      // Clear old addresses and insert demo ones
      await prisma.swiggyAddress.deleteMany({
        where: { swiggySessionId: swiggySession.id },
      });

      await prisma.swiggyAddress.createMany({
        data: DEMO_ADDRESSES.map((addr) => ({
          swiggySessionId: swiggySession.id,
          swiggyAddressId: addr.swiggyAddressId,
          label: addr.label,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          pincode: addr.pincode,
          latitude: addr.latitude,
          longitude: addr.longitude,
          isDefault: addr.isDefault,
        })),
      });

      console.log(`[Swiggy Auth] DEMO MODE: Session created for user ${user.id}`);

      return NextResponse.json({
        success: true,
        message: 'Swiggy account connected successfully (Demo Mode)',
        swiggyUserId: `swiggy_demo_${cleanPhone}`,
        addressCount: DEMO_ADDRESSES.length,
        addresses: DEMO_ADDRESSES.map((addr) => ({
          id: addr.swiggyAddressId,
          label: addr.label,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          pincode: addr.pincode,
          isDefault: addr.isDefault,
        })),
        demoMode: true,
      });
    }

    // Production mode - Verify OTP with Swiggy MCP
    const { SwiggyMCPClient } = await import('@/lib/swiggy-mcp');
    const authResult = await SwiggyMCPClient.verifyOtp(formattedPhone, otp);

    if (!authResult.success || !authResult.accessToken) {
      console.error(`[Swiggy Auth] OTP verification failed: ${authResult.error}`);
      return NextResponse.json(
        { error: authResult.error || 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Calculate token expiration
    const expiresAt = authResult.expiresIn
      ? new Date(Date.now() + authResult.expiresIn * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

    // Create or update Swiggy session
    const swiggySession = await prisma.swiggySession.upsert({
      where: { userId: user.id },
      update: {
        swiggyUserId: authResult.swiggyUserId,
        swiggyPhone: formattedPhone,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        swiggyUserId: authResult.swiggyUserId,
        swiggyPhone: formattedPhone,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt,
        isActive: true,
      },
    });

    console.log(`[Swiggy Auth] Session created/updated for user ${user.id}`);

    // Fetch and store user's Swiggy addresses
    try {
      const addresses = await SwiggyMCPClient.getAddresses(authResult.accessToken);

      // Clear old addresses and insert new ones
      await prisma.swiggyAddress.deleteMany({
        where: { swiggySessionId: swiggySession.id },
      });

      if (addresses.length > 0) {
        await prisma.swiggyAddress.createMany({
          data: addresses.map((addr) => ({
            swiggySessionId: swiggySession.id,
            swiggyAddressId: addr.swiggyAddressId,
            label: addr.label,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2,
            city: addr.city,
            pincode: addr.pincode,
            latitude: addr.latitude,
            longitude: addr.longitude,
            isDefault: addr.isDefault,
          })),
        });
      }

      console.log(`[Swiggy Auth] Saved ${addresses.length} addresses for user ${user.id}`);

      return NextResponse.json({
        success: true,
        message: 'Swiggy account connected successfully',
        swiggyUserId: authResult.swiggyUserId,
        addressCount: addresses.length,
        addresses: addresses.map((addr) => ({
          id: addr.swiggyAddressId,
          label: addr.label,
          addressLine1: addr.addressLine1,
          city: addr.city,
          pincode: addr.pincode,
          isDefault: addr.isDefault,
        })),
      });

    } catch (addressError) {
      console.error('[Swiggy Auth] Failed to fetch addresses:', addressError);

      // Still return success since authentication worked
      return NextResponse.json({
        success: true,
        message: 'Swiggy account connected. Please add an address in the Swiggy app.',
        swiggyUserId: authResult.swiggyUserId,
        addressCount: 0,
        addresses: [],
      });
    }

  } catch (error) {
    console.error('[Swiggy Auth] Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
