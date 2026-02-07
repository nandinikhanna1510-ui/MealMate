import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Demo mode - simulates order placement
const DEMO_MODE = true;

// Simulate order placement with realistic response
function simulateOrderPlacement(
  cartTotal: number,
  addressLabel: string,
  addressLine: string
): {
  swiggyOrderId: string;
  estimatedDelivery: string;
  orderStatus: string;
  deliveryAddress: string;
} {
  // Generate realistic Swiggy order ID
  const orderId = `SWGY${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  // Randomize delivery time (25-45 mins for express, 1-2 hours for standard)
  const isExpress = Math.random() > 0.3;
  const estimatedDelivery = isExpress
    ? `${25 + Math.floor(Math.random() * 20)}-${35 + Math.floor(Math.random() * 15)} mins`
    : `${60 + Math.floor(Math.random() * 30)}-${90 + Math.floor(Math.random() * 30)} mins`;

  return {
    swiggyOrderId: orderId,
    estimatedDelivery,
    orderStatus: 'CONFIRMED',
    deliveryAddress: `${addressLabel}: ${addressLine}`,
  };
}

/**
 * POST /api/order/checkout
 * Place order directly via MealMate (COD only for now)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, addressId, paymentMethod = 'COD' } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!addressId) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    // Only COD supported for now
    if (paymentMethod !== 'COD') {
      return NextResponse.json(
        { error: 'Only Cash on Delivery (COD) is supported at this time' },
        { status: 400 }
      );
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (order.status !== 'CART_READY') {
      return NextResponse.json(
        { error: `Order cannot be placed. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Get the delivery address
    const swiggySession = await prisma.swiggySession.findUnique({
      where: { userId: user.id },
      include: { addresses: true },
    });

    const address = swiggySession?.addresses.find(
      (a) => a.id === addressId || a.swiggyAddressId === addressId
    );

    const addressLabel = address?.label || 'Address';
    const addressLine = address
      ? `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city} - ${address.pincode}`
      : 'Selected address';

    console.log(`[Checkout] Placing order ${orderId} for user ${user.id} (Demo Mode: ${DEMO_MODE})`);

    // Demo mode - simulate order placement
    if (DEMO_MODE) {
      const result = simulateOrderPlacement(
        order.estimatedTotal || 0,
        addressLabel,
        addressLine
      );

      // Update order in database
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          swiggyOrderId: result.swiggyOrderId,
          paymentMethod,
          orderPlacedAt: new Date(),
          estimatedDelivery: result.estimatedDelivery,
          deliveryAddress: result.deliveryAddress,
          deliveryAddressId: addressId,
        },
      });

      console.log(`[Checkout] Order ${orderId} confirmed with Swiggy ID: ${result.swiggyOrderId}`);

      return NextResponse.json({
        success: true,
        orderId: updatedOrder.id,
        swiggyOrderId: result.swiggyOrderId,
        estimatedDelivery: result.estimatedDelivery,
        orderStatus: 'CONFIRMED',
        deliveryAddress: result.deliveryAddress,
        totalAmount: order.estimatedTotal,
        paymentMethod,
        demoMode: true,
        message: 'Order placed successfully! (Demo Mode)',
      });
    }

    // Production mode - use Swiggy MCP to place order
    const { SwiggyMCPClient } = await import('@/lib/swiggy-mcp');

    if (!swiggySession || !swiggySession.isActive) {
      return NextResponse.json(
        { error: 'Swiggy session expired. Please reconnect your account.' },
        { status: 400 }
      );
    }

    // Create MCP client and place order
    const mcpClient = new SwiggyMCPClient(swiggySession.accessToken, addressId);

    // If we have a cart ID from the order, use it
    if (order.swiggyCartId) {
      // Set the cart ID on the client
      // Note: In production, we'd need to ensure cart is still valid
    }

    const result = await mcpClient.placeOrder(addressId, paymentMethod);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to place order with Swiggy' },
        { status: 500 }
      );
    }

    // Update order in database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        swiggyOrderId: result.swiggyOrderId,
        paymentMethod,
        orderPlacedAt: new Date(),
        estimatedDelivery: result.estimatedDelivery,
        deliveryAddress: result.deliveryAddress,
        deliveryAddressId: addressId,
      },
    });

    console.log(`[Checkout] Order ${orderId} confirmed with Swiggy ID: ${result.swiggyOrderId}`);

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      swiggyOrderId: result.swiggyOrderId,
      estimatedDelivery: result.estimatedDelivery,
      orderStatus: result.orderStatus,
      deliveryAddress: result.deliveryAddress,
      totalAmount: result.totalAmount || order.estimatedTotal,
      paymentMethod,
      demoMode: false,
      message: 'Order placed successfully!',
    });

  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to place order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
