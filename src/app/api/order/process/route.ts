import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, OrderStatus } from '@/lib/auth';
import { buildGroceryOrderWithMCP, isClaudeConfigured } from '@/lib/claude';

// Demo mode - set to true to simulate cart building (since real Swiggy MCP may not be available)
// TODO: Set to false and ensure Swiggy MCP + API credits before publishing
const DEMO_MODE = true;

// Simulate realistic pricing for grocery items (used in demo mode)
function estimateItemPrice(itemName: string, quantity: number): number {
  const basePrices: Record<string, number> = {
    // Vegetables
    'onion': 40, 'potato': 30, 'tomato': 50, 'carrot': 45, 'ginger': 80,
    'garlic': 60, 'green chilli': 30, 'capsicum': 60, 'cabbage': 35,
    'cauliflower': 45, 'spinach': 30, 'coriander': 20, 'mint': 25,
    'curry leaves': 15, 'beans': 55, 'peas': 70, 'brinjal': 40,
    // Fruits
    'banana': 50, 'apple': 150, 'orange': 80, 'mango': 120, 'lemon': 60,
    // Dairy
    'milk': 60, 'curd': 45, 'butter': 55, 'cheese': 120, 'paneer': 90,
    'ghee': 250, 'cream': 80,
    // Grains
    'rice': 70, 'wheat': 45, 'atta': 50, 'bread': 40, 'dosa batter': 60,
    'idli batter': 55, 'poha': 35, 'oats': 90,
    // Spices
    'turmeric': 25, 'chilli powder': 30, 'cumin': 45, 'coriander powder': 35,
    'garam masala': 50, 'salt': 25, 'pepper': 60, 'mustard seeds': 30,
    // Protein
    'chicken': 220, 'egg': 80, 'fish': 280, 'dal': 120, 'moong dal': 130,
    'chana dal': 110, 'toor dal': 125, 'rajma': 140, 'chickpeas': 90,
    // Pantry
    'oil': 150, 'sugar': 50, 'jaggery': 70, 'honey': 180, 'tea': 120,
    'coffee': 200, 'biscuit': 35,
  };

  const lowerName = itemName.toLowerCase();
  for (const [key, price] of Object.entries(basePrices)) {
    if (lowerName.includes(key)) {
      return Math.round(price * Math.max(0.5, quantity) * (0.9 + Math.random() * 0.2));
    }
  }
  // Default price for unknown items
  return Math.round((30 + Math.random() * 70) * Math.max(0.5, quantity));
}

// Simulate order processing with realistic delays and results (used in demo mode)
async function simulateOrderProcessing(
  groceryItems: Array<{ name: string; quantity: string; unit: string; category: string }>,
  allergens: string[]
): Promise<{
  itemsAdded: string[];
  itemsNotFound: string[];
  estimatedTotal: number;
  itemPrices: Record<string, number>;
}> {
  const itemsAdded: string[] = [];
  const itemsNotFound: string[] = [];
  const itemPrices: Record<string, number> = {};
  let estimatedTotal = 0;

  for (const item of groceryItems) {
    // 95% success rate for finding items
    const found = Math.random() > 0.05;

    if (found) {
      const quantity = parseFloat(item.quantity) || 1;
      const price = estimateItemPrice(item.name, quantity);
      itemPrices[item.name] = price;
      estimatedTotal += price;
      itemsAdded.push(item.name);
    } else {
      itemsNotFound.push(item.name);
    }
  }

  return {
    itemsAdded,
    itemsNotFound,
    estimatedTotal,
    itemPrices,
  };
}

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
    const { groceryItems, allergens = [], familySize = 2, addressId } = body;

    if (!groceryItems || !Array.isArray(groceryItems) || groceryItems.length === 0) {
      return NextResponse.json(
        { error: 'Grocery items are required' },
        { status: 400 }
      );
    }

    // Get Swiggy session for production mode
    let swiggySession = null;
    if (!DEMO_MODE) {
      swiggySession = await prisma.swiggySession.findUnique({
        where: { userId: user.id },
      });

      if (!swiggySession || !swiggySession.isActive) {
        return NextResponse.json(
          { error: 'Swiggy account not connected. Please connect your Swiggy account first.', needsSwiggyAuth: true },
          { status: 400 }
        );
      }

      if (!addressId) {
        return NextResponse.json(
          { error: 'Delivery address is required. Please select a delivery address.', needsAddress: true },
          { status: 400 }
        );
      }
    }

    // Create order record
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: OrderStatus.PROCESSING,
        groceryItems: JSON.stringify(groceryItems),
        totalItems: groceryItems.length,
        deliveryAddressId: addressId || null,
        allergenWarnings: allergens.length > 0 ? JSON.stringify(allergens) : null,
      },
    });

    console.log(`[Order ${order.id}] Processing ${groceryItems.length} items (Demo Mode: ${DEMO_MODE})`);

    // Production mode - Use Claude AI + Swiggy MCP
    if (!DEMO_MODE && swiggySession) {
      // Check if Claude API is configured
      if (!isClaudeConfigured()) {
        // Fall back to demo mode if Claude not configured
        console.log(`[Order ${order.id}] Claude API not configured, falling back to demo mode`);
        const { itemsAdded, itemsNotFound, estimatedTotal, itemPrices } =
          await simulateOrderProcessing(groceryItems, allergens);

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CART_READY,
            estimatedTotal,
          },
        });

        return NextResponse.json({
          success: true,
          orderId: order.id,
          itemsAdded,
          itemsNotFound,
          estimatedTotal,
          itemPrices,
          cartReady: true,
          demoMode: true,
          message: 'Demo mode: Claude API not configured. In production, this will use Claude AI + Swiggy MCP.',
        });
      }

      try {
        // Build cart using Claude + MCP
        console.log(`[Order ${order.id}] Building cart with Claude AI + Swiggy MCP`);

        const result = await buildGroceryOrderWithMCP({
          groceryItems,
          allergens,
          familySize,
          accessToken: swiggySession.accessToken,
          addressId,
        });

        if (result.success) {
          // Update order with cart details
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.CART_READY,
              swiggyCartId: result.cartId,
              estimatedTotal: result.totalEstimate,
            },
          });

          console.log(`[Order ${order.id}] Cart ready: ${result.itemsAdded} items, ₹${result.totalEstimate} total`);

          return NextResponse.json({
            success: true,
            orderId: order.id,
            cartId: result.cartId,
            itemsAdded: result.itemsAdded,
            itemsNotFound: result.itemsNotFound,
            estimatedTotal: result.totalEstimate,
            cart: result.cart,
            cartReady: true,
            demoMode: false,
            message: result.message,
          });
        } else {
          // Cart building failed
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.FAILED,
              errorMessage: result.message,
            },
          });

          return NextResponse.json(
            {
              success: false,
              orderId: order.id,
              error: 'Failed to build cart',
              details: result.message,
              itemsNotFound: result.itemsNotFound,
            },
            { status: 500 }
          );
        }
      } catch (mcpError) {
        console.error(`[Order ${order.id}] MCP Error:`, mcpError);

        // Update order with error
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.FAILED,
            errorMessage: mcpError instanceof Error ? mcpError.message : 'Unknown MCP error',
          },
        });

        return NextResponse.json(
          {
            success: false,
            orderId: order.id,
            error: 'Failed to connect to Swiggy',
            details: mcpError instanceof Error ? mcpError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Demo mode - Use simulation
    const { itemsAdded, itemsNotFound, estimatedTotal, itemPrices } =
      await simulateOrderProcessing(groceryItems, allergens);

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CART_READY,
        estimatedTotal,
      },
    });

    console.log(`[Order ${order.id}] Demo cart ready: ${itemsAdded.length} items added, ₹${estimatedTotal} total`);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      itemsAdded,
      itemsNotFound,
      estimatedTotal,
      itemPrices,
      cartReady: true,
      demoMode: DEMO_MODE,
      message: DEMO_MODE
        ? 'Demo mode: Cart simulated successfully. In production, this will use Claude AI + Swiggy MCP.'
        : 'Cart built successfully with Claude AI.',
    });

  } catch (error) {
    console.error('Order processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
