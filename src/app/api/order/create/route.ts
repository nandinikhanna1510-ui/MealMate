import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, OrderStatus } from '@/lib/auth';
import { buildGroceryOrder, generateShoppingPrompt, isClaudeConfigured } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { groceryItems, allergens = [], familySize = 2, useClaudeAPI = false } = body;

    if (!groceryItems || !Array.isArray(groceryItems) || groceryItems.length === 0) {
      return NextResponse.json(
        { error: 'Grocery items are required' },
        { status: 400 }
      );
    }

    // Create order record
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: OrderStatus.PENDING,
        groceryItems: JSON.stringify(groceryItems),
        totalItems: groceryItems.length,
        allergenWarnings: allergens.length > 0 ? JSON.stringify(allergens) : null,
      },
    });

    // If Claude API is requested and configured
    if (useClaudeAPI && isClaudeConfigured()) {
      // Update status to processing
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PROCESSING },
      });

      try {
        // Build the order using Claude
        const result = await buildGroceryOrder({
          groceryItems,
          allergens,
          familySize,
        });

        // Update order with results
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: result.success ? OrderStatus.CART_READY : OrderStatus.FAILED,
            estimatedTotal: result.totalEstimate,
            errorMessage: result.success ? null : result.message,
          },
        });

        return NextResponse.json({
          success: result.success,
          orderId: order.id,
          result,
        });
      } catch (error) {
        // Update order as failed
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        return NextResponse.json(
          {
            error: 'Failed to process order',
            orderId: order.id,
          },
          { status: 500 }
        );
      }
    }

    // Generate manual prompt (default behavior)
    const prompt = generateShoppingPrompt({
      groceryItems,
      allergens,
      familySize,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      mode: 'manual',
      prompt,
      message: 'Copy this prompt to Claude with Swiggy MCP connected',
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
