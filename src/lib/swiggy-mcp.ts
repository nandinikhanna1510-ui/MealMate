/**
 * Swiggy MCP (Model Context Protocol) Client
 *
 * This module provides a client for interacting with Swiggy's MCP server
 * for Instamart grocery ordering.
 */

// Types for Swiggy MCP responses
export interface SwiggyAddress {
  id: string;
  swiggyAddressId: string;
  label: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export interface SwiggyProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  discount: number;
  unit: string;
  quantity: string;
  imageUrl: string;
  inStock: boolean;
  category: string;
}

export interface SwiggyCartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface SwiggyCart {
  id: string;
  items: SwiggyCartItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  itemCount: number;
}

export interface SwiggyAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  swiggyUserId?: string;
  error?: string;
}

export interface SwiggyOtpResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface SwiggyOrderResult {
  success: boolean;
  orderId?: string;
  swiggyOrderId?: string;
  estimatedDelivery?: string;
  orderStatus?: string;
  deliveryAddress?: string;
  totalAmount?: number;
  error?: string;
}

// MCP Tool definitions for Claude
export const SWIGGY_MCP_TOOLS = [
  {
    name: 'swiggy_search_products',
    description: 'Search for grocery products on Swiggy Instamart. Returns a list of matching products with prices and availability.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Product search query (e.g., "onion", "toor dal", "milk")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'swiggy_add_to_cart',
    description: 'Add a product to the Swiggy Instamart cart',
    input_schema: {
      type: 'object' as const,
      properties: {
        productId: {
          type: 'string',
          description: 'The product ID from search results',
        },
        quantity: {
          type: 'number',
          description: 'Quantity to add (default: 1)',
        },
      },
      required: ['productId'],
    },
  },
  {
    name: 'swiggy_get_cart',
    description: 'Get the current Swiggy Instamart cart contents',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'swiggy_remove_from_cart',
    description: 'Remove an item from the cart',
    input_schema: {
      type: 'object' as const,
      properties: {
        productId: {
          type: 'string',
          description: 'The product ID to remove',
        },
      },
      required: ['productId'],
    },
  },
  {
    name: 'swiggy_clear_cart',
    description: 'Clear all items from the cart',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'order_complete',
    description: 'Call this when you have finished adding all items to the cart. This signals that the cart is ready for checkout.',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: {
          type: 'string',
          description: 'A brief summary of items added and any items that could not be found',
        },
      },
      required: ['summary'],
    },
  },
];

/**
 * Swiggy MCP Client
 * Handles communication with Swiggy's MCP server
 */
export class SwiggyMCPClient {
  private mcpEndpoint: string;
  private accessToken: string;
  private addressId: string;
  private cartId: string | null = null;

  constructor(accessToken: string, addressId: string) {
    this.mcpEndpoint = process.env.SWIGGY_MCP_INSTAMART_URL || 'https://mcp.swiggy.com/im';
    this.accessToken = accessToken;
    this.addressId = addressId;
  }

  /**
   * Make a request to Swiggy MCP server
   */
  private async mcpRequest<T>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const response = await fetch(this.mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Address-Id': this.addressId,
        ...(this.cartId && { 'X-Cart-Id': this.cartId }),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Swiggy MCP error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Swiggy MCP error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // Update cart ID if returned
    if (data.result?.cartId) {
      this.cartId = data.result.cartId;
    }

    return data.result;
  }

  /**
   * Send OTP to phone number for Swiggy authentication
   */
  static async sendOtp(phone: string): Promise<SwiggyOtpResult> {
    const mcpEndpoint = process.env.SWIGGY_MCP_INSTAMART_URL || 'https://mcp.swiggy.com/im';

    const response = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'auth/send-otp',
        params: { phone },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to send OTP',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        message: data.error.message || 'Failed to send OTP',
        error: JSON.stringify(data.error),
      };
    }

    return {
      success: true,
      message: data.result?.message || 'OTP sent successfully',
    };
  }

  /**
   * Verify OTP and get access tokens
   */
  static async verifyOtp(phone: string, otp: string): Promise<SwiggyAuthResult> {
    const mcpEndpoint = process.env.SWIGGY_MCP_INSTAMART_URL || 'https://mcp.swiggy.com/im';

    const response = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'auth/verify-otp',
        params: { phone, otp },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Failed to verify OTP',
      };
    }

    return {
      success: true,
      accessToken: data.result.accessToken,
      refreshToken: data.result.refreshToken,
      expiresIn: data.result.expiresIn,
      swiggyUserId: data.result.userId,
    };
  }

  /**
   * Get user's saved addresses from Swiggy
   */
  static async getAddresses(accessToken: string): Promise<SwiggyAddress[]> {
    const mcpEndpoint = process.env.SWIGGY_MCP_INSTAMART_URL || 'https://mcp.swiggy.com/im';

    const response = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'user/addresses',
        params: {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get addresses: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to get addresses');
    }

    return (data.result?.addresses || []).map((addr: Record<string, unknown>) => ({
      id: addr.id,
      swiggyAddressId: addr.id,
      label: addr.annotation || addr.label || null,
      addressLine1: addr.address || addr.addressLine1 || '',
      addressLine2: addr.landmark || addr.addressLine2 || null,
      city: addr.city || '',
      pincode: addr.pincode || addr.zipcode || '',
      latitude: addr.lat || addr.latitude || null,
      longitude: addr.lng || addr.longitude || null,
      isDefault: addr.isDefault || false,
    }));
  }

  /**
   * Search for products on Instamart
   */
  async searchProducts(query: string, limit: number = 5): Promise<SwiggyProduct[]> {
    const result = await this.mcpRequest<{ products: SwiggyProduct[] }>(
      'instamart/search',
      { query, limit }
    );
    return result.products || [];
  }

  /**
   * Add product to cart
   */
  async addToCart(productId: string, quantity: number = 1): Promise<SwiggyCart> {
    const result = await this.mcpRequest<{ cart: SwiggyCart }>(
      'instamart/cart/add',
      { productId, quantity }
    );
    return result.cart;
  }

  /**
   * Remove product from cart
   */
  async removeFromCart(productId: string): Promise<SwiggyCart> {
    const result = await this.mcpRequest<{ cart: SwiggyCart }>(
      'instamart/cart/remove',
      { productId }
    );
    return result.cart;
  }

  /**
   * Get current cart
   */
  async getCart(): Promise<SwiggyCart> {
    const result = await this.mcpRequest<{ cart: SwiggyCart }>(
      'instamart/cart/get',
      {}
    );
    return result.cart;
  }

  /**
   * Clear cart
   */
  async clearCart(): Promise<void> {
    await this.mcpRequest('instamart/cart/clear', {});
    this.cartId = null;
  }

  /**
   * Get cart ID for checkout
   */
  getCartId(): string | null {
    return this.cartId;
  }

  /**
   * Place order with Swiggy Instamart
   * This is the final step that converts a cart into an actual order
   */
  async placeOrder(
    addressId: string,
    paymentMethod: string = 'COD'
  ): Promise<SwiggyOrderResult> {
    if (!this.cartId) {
      return {
        success: false,
        error: 'No cart to place order for. Please build a cart first.',
      };
    }

    const result = await this.mcpRequest<{
      orderId: string;
      swiggyOrderId: string;
      estimatedDelivery: string;
      orderStatus: string;
      deliveryAddress: string;
      totalAmount: number;
    }>('instamart/order/place', {
      cartId: this.cartId,
      addressId,
      paymentMethod,
    });

    return {
      success: true,
      orderId: result.orderId,
      swiggyOrderId: result.swiggyOrderId,
      estimatedDelivery: result.estimatedDelivery,
      orderStatus: result.orderStatus,
      deliveryAddress: result.deliveryAddress,
      totalAmount: result.totalAmount,
    };
  }

  /**
   * Execute a tool call from Claude
   */
  async executeTool(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case 'swiggy_search_products':
        return await this.searchProducts(
          toolInput.query as string,
          (toolInput.limit as number) || 5
        );

      case 'swiggy_add_to_cart':
        return await this.addToCart(
          toolInput.productId as string,
          (toolInput.quantity as number) || 1
        );

      case 'swiggy_get_cart':
        return await this.getCart();

      case 'swiggy_remove_from_cart':
        return await this.removeFromCart(toolInput.productId as string);

      case 'swiggy_clear_cart':
        await this.clearCart();
        return { success: true, message: 'Cart cleared' };

      case 'order_complete':
        return {
          success: true,
          message: 'Order processing complete',
          summary: toolInput.summary,
          cartId: this.cartId,
        };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

/**
 * Refresh Swiggy access token using refresh token
 */
export async function refreshSwiggyToken(refreshToken: string): Promise<SwiggyAuthResult> {
  const mcpEndpoint = process.env.SWIGGY_MCP_INSTAMART_URL || 'https://mcp.swiggy.com/im';

  const response = await fetch(mcpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'auth/refresh',
      params: { refreshToken },
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      error: `HTTP ${response.status}`,
    };
  }

  const data = await response.json();

  if (data.error) {
    return {
      success: false,
      error: data.error.message || 'Failed to refresh token',
    };
  }

  return {
    success: true,
    accessToken: data.result.accessToken,
    refreshToken: data.result.refreshToken,
    expiresIn: data.result.expiresIn,
  };
}
