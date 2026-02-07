import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      // Get specific order
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: user.id,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        order: {
          id: order.id,
          status: order.status,
          totalItems: order.totalItems,
          estimatedTotal: order.estimatedTotal,
          groceryItems: JSON.parse(order.groceryItems),
          allergenWarnings: order.allergenWarnings ? JSON.parse(order.allergenWarnings) : [],
          errorMessage: order.errorMessage,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      });
    }

    // Get all orders for user
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalItems: order.totalItems,
        estimatedTotal: order.estimatedTotal,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get order status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
