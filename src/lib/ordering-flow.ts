/**
 * Ordering Flow State Machine
 * Manages the conversation state for the embedded chat ordering experience
 */

import { GroceryItem } from '@/types';

// Conversation states
export type OrderingState =
  | 'WELCOME'
  | 'ADDRESS_SELECT'
  | 'CART_REVIEW'
  | 'EDIT_CART'
  | 'CONFIRM_ORDER'
  | 'PROCESSING'
  | 'HANDOFF'
  | 'COMPLETE'
  | 'ERROR';

// Message types
export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
  timestamp: Date;
  actions?: QuickAction[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'danger';
  action: string;
  data?: Record<string, unknown>;
}

// Address type
export interface DeliveryAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

// Order state
export interface OrderState {
  currentState: OrderingState;
  messages: ChatMessage[];
  groceryItems: GroceryItem[];
  selectedAddress: DeliveryAddress | null;
  familySize: number;
  estimatedTotal: { min: number; max: number };
  error?: string;
}

// Demo addresses (in production, these would come from Swiggy)
export const DEMO_ADDRESSES: DeliveryAddress[] = [
  {
    id: 'addr_home',
    label: 'Home',
    address: '123 MG Road, Koramangala',
    city: 'Bangalore',
    pincode: '560034',
    isDefault: true,
  },
  {
    id: 'addr_office',
    label: 'Office',
    address: '456 Tech Park, Whitefield',
    city: 'Bangalore',
    pincode: '560066',
  },
];

// Category emoji mapping
const CATEGORY_EMOJIS: Record<string, string> = {
  vegetables: '🥬',
  fruits: '🍎',
  dairy: '🥛',
  protein: '🍗',
  grains: '🌾',
  spices: '🌶️',
  pantry: '📦',
  other: '🛒',
};

// Estimate prices (rough averages for demo)
const PRICE_ESTIMATES: Record<string, number> = {
  vegetables: 40,
  fruits: 60,
  dairy: 50,
  protein: 150,
  grains: 80,
  spices: 30,
  pantry: 100,
  other: 50,
};

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate estimated total based on items
 */
export function calculateEstimate(items: GroceryItem[]): { min: number; max: number } {
  let baseTotal = 0;
  items.forEach(item => {
    const categoryPrice = PRICE_ESTIMATES[item.category] || 50;
    baseTotal += categoryPrice;
  });

  return {
    min: Math.round(baseTotal * 0.8),
    max: Math.round(baseTotal * 1.2),
  };
}

/**
 * Group items by category
 */
export function groupItemsByCategory(items: GroceryItem[]): Record<string, GroceryItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);
}

/**
 * Format cart summary for display
 */
export function formatCartSummary(items: GroceryItem[]): string {
  const grouped = groupItemsByCategory(items);
  let summary = '';

  Object.entries(grouped).forEach(([category, categoryItems]) => {
    const emoji = CATEGORY_EMOJIS[category] || '📦';
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    summary += `\n${emoji} **${categoryName}**\n`;
    categoryItems.forEach(item => {
      summary += `   • ${item.name} - ${item.quantity} ${item.unit}\n`;
    });
  });

  return summary;
}

/**
 * Generate welcome message
 */
export function generateWelcomeMessage(items: GroceryItem[], familySize: number): ChatMessage {
  const grouped = groupItemsByCategory(items);
  const estimate = calculateEstimate(items);

  const categorySummary = Object.entries(grouped)
    .map(([cat, catItems]) => `• ${catItems.length} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`)
    .join('\n');

  return {
    id: generateMessageId(),
    role: 'bot',
    content: `🛒 Hi! I'll help you order groceries from Swiggy Instamart.

You have **${items.length} items** in your list:
${categorySummary}

Estimated total: **₹${estimate.min} - ₹${estimate.max}**

Where should I deliver your groceries? 🏠`,
    timestamp: new Date(),
    actions: [
      ...DEMO_ADDRESSES.map(addr => ({
        id: `select_${addr.id}`,
        label: `${addr.label === 'Home' ? '🏠' : '🏢'} ${addr.label}`,
        variant: addr.isDefault ? 'primary' as const : 'secondary' as const,
        action: 'SELECT_ADDRESS',
        data: { addressId: addr.id },
      })),
      {
        id: 'new_address',
        label: '📍 New Address',
        variant: 'secondary',
        action: 'NEW_ADDRESS',
      },
    ],
  };
}

/**
 * Generate address confirmation message
 */
export function generateAddressConfirmMessage(
  address: DeliveryAddress,
  items: GroceryItem[],
  estimate: { min: number; max: number }
): ChatMessage {
  const cartSummary = formatCartSummary(items);

  return {
    id: generateMessageId(),
    role: 'bot',
    content: `Great! Delivering to:
📍 **${address.label}** - ${address.address}, ${address.city} ${address.pincode}

**Your Cart:**
${cartSummary}
━━━━━━━━━━━━━━━━━━━━
**Estimated Total:** ₹${estimate.min} - ₹${estimate.max}
**Payment:** Cash on Delivery
━━━━━━━━━━━━━━━━━━━━

Ready to place your order?`,
    timestamp: new Date(),
    actions: [
      {
        id: 'place_order',
        label: '✅ Place Order',
        icon: '✅',
        variant: 'primary',
        action: 'PLACE_ORDER',
      },
      {
        id: 'edit_cart',
        label: '✏️ Edit Items',
        icon: '✏️',
        variant: 'secondary',
        action: 'EDIT_CART',
      },
      {
        id: 'cancel',
        label: '❌ Cancel',
        icon: '❌',
        variant: 'danger',
        action: 'CANCEL',
      },
    ],
  };
}

/**
 * Generate user selection message
 */
export function generateUserMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    role: 'user',
    content,
    timestamp: new Date(),
  };
}

/**
 * Generate processing message
 */
export function generateProcessingMessage(): ChatMessage {
  return {
    id: generateMessageId(),
    role: 'bot',
    content: `🔄 Preparing your order for Swiggy Instamart...

This will open Claude Desktop to complete your order.`,
    timestamp: new Date(),
  };
}

/**
 * Generate handoff message (when we need to redirect to Claude Desktop)
 */
export function generateHandoffMessage(items: GroceryItem[], address: DeliveryAddress): ChatMessage {
  return {
    id: generateMessageId(),
    role: 'bot',
    content: `✅ Your order is ready!

To complete your order on Swiggy Instamart:

1. Click the button below to open Claude Desktop
2. The order prompt is already copied to your clipboard
3. Paste it in Claude and confirm the order

**Delivery to:** ${address.label} - ${address.address}
**Items:** ${items.length} items

⚠️ **Important:** Keep the Swiggy app closed while ordering through Claude.`,
    timestamp: new Date(),
    actions: [
      {
        id: 'open_claude',
        label: '🤖 Open Claude Desktop',
        variant: 'primary',
        action: 'OPEN_CLAUDE',
      },
      {
        id: 'copy_prompt',
        label: '📋 Copy Prompt Again',
        variant: 'secondary',
        action: 'COPY_PROMPT',
      },
      {
        id: 'done',
        label: '✅ Done',
        variant: 'secondary',
        action: 'CLOSE',
      },
    ],
  };
}

/**
 * Generate Claude prompt for final order
 */
export function generateFinalClaudePrompt(
  items: GroceryItem[],
  address: DeliveryAddress,
  familySize: number
): string {
  const grouped = groupItemsByCategory(items);
  const totalItems = items.length;
  const isLargeList = totalItems > 10;

  let prompt = `I need to order groceries from Swiggy Instamart.

**Delivery Address:** ${address.label} - ${address.address}, ${address.city} ${address.pincode}
**Family Size:** ${familySize} people

**Shopping List (${totalItems} items):**
`;

  // Format items compactly by category
  Object.entries(grouped).forEach(([category, categoryItems]) => {
    const emoji = CATEGORY_EMOJIS[category] || '📦';
    const itemList = categoryItems.map(item => `${item.name} (${item.quantity}${item.unit})`).join(', ');
    prompt += `\n${emoji} **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${itemList}`;
  });

  if (isLargeList) {
    prompt += `

**Instructions (Large Order):**
1. Process by CATEGORY to avoid timeouts
2. Search 2-3 items together when possible
3. Skip items not found after 1 search
4. Show brief summary after each category
5. Use my delivery address above
6. Show final cart with total when done

Start with ${Object.keys(grouped)[0]} category.`;
  } else {
    prompt += `

**Instructions:**
1. Search and add each item to cart
2. Use delivery address above
3. Show cart summary when done

Please build my cart!`;
  }

  return prompt;
}

/**
 * Generate edit cart message
 */
export function generateEditCartMessage(items: GroceryItem[]): ChatMessage {
  return {
    id: generateMessageId(),
    role: 'bot',
    content: `What would you like to change?

You currently have ${items.length} items in your cart.`,
    timestamp: new Date(),
    actions: [
      {
        id: 'remove_item',
        label: '➖ Remove Item',
        variant: 'secondary',
        action: 'SHOW_REMOVE_OPTIONS',
      },
      {
        id: 'back_to_cart',
        label: '↩️ Back to Cart',
        variant: 'primary',
        action: 'BACK_TO_CART',
      },
    ],
  };
}

/**
 * Generate cancel confirmation message
 */
export function generateCancelMessage(): ChatMessage {
  return {
    id: generateMessageId(),
    role: 'bot',
    content: `Order cancelled. You can start a new order anytime from your grocery list.`,
    timestamp: new Date(),
    actions: [
      {
        id: 'close',
        label: 'Close',
        variant: 'secondary',
        action: 'CLOSE',
      },
    ],
  };
}

/**
 * Initialize order state
 */
export function initializeOrderState(items: GroceryItem[], familySize: number): OrderState {
  const welcomeMessage = generateWelcomeMessage(items, familySize);

  return {
    currentState: 'WELCOME',
    messages: [welcomeMessage],
    groceryItems: items,
    selectedAddress: null,
    familySize,
    estimatedTotal: calculateEstimate(items),
  };
}
