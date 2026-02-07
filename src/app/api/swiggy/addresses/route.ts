import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SwiggyMCPClient } from '@/lib/swiggy-mcp';
import prisma from '@/lib/db';

/**
 * Get user's Swiggy delivery addresses
 * GET /api/swiggy/addresses
 */
export async function GET(request: NextRequest) {
  try {
    // User must be logged into MealMate
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to MealMate first' },
        { status: 401 }
      );
    }

    // Get user's Swiggy session
    const swiggySession = await prisma.swiggySession.findUnique({
      where: { userId: user.id },
      include: { addresses: true },
    });

    if (!swiggySession || !swiggySession.isActive) {
      return NextResponse.json(
        { error: 'Swiggy account not connected', needsSwiggyAuth: true },
        { status: 400 }
      );
    }

    // Check if we need to refresh addresses from Swiggy
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    if (forceRefresh || swiggySession.addresses.length === 0) {
      try {
        // Fetch fresh addresses from Swiggy
        const addresses = await SwiggyMCPClient.getAddresses(swiggySession.accessToken);

        // Update stored addresses
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

        return NextResponse.json({
          success: true,
          addresses: addresses.map((addr) => ({
            id: addr.swiggyAddressId,
            label: addr.label,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2,
            city: addr.city,
            pincode: addr.pincode,
            isDefault: addr.isDefault,
          })),
          refreshed: true,
        });

      } catch (refreshError) {
        console.error('[Swiggy Addresses] Failed to refresh:', refreshError);

        // If refresh fails, return cached addresses
        if (swiggySession.addresses.length > 0) {
          return NextResponse.json({
            success: true,
            addresses: swiggySession.addresses.map((addr) => ({
              id: addr.swiggyAddressId,
              label: addr.label,
              addressLine1: addr.addressLine1,
              addressLine2: addr.addressLine2,
              city: addr.city,
              pincode: addr.pincode,
              isDefault: addr.isDefault,
            })),
            refreshed: false,
            warning: 'Using cached addresses',
          });
        }

        return NextResponse.json(
          { error: 'Failed to fetch addresses', details: String(refreshError) },
          { status: 500 }
        );
      }
    }

    // Return cached addresses
    return NextResponse.json({
      success: true,
      addresses: swiggySession.addresses.map((addr) => ({
        id: addr.swiggyAddressId,
        label: addr.label,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        pincode: addr.pincode,
        isDefault: addr.isDefault,
      })),
      refreshed: false,
    });

  } catch (error) {
    console.error('[Swiggy Addresses] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get addresses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
