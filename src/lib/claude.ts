import Anthropic from '@anthropic-ai/sdk';
import { SwiggyMCPClient, SWIGGY_MCP_TOOLS, SwiggyCart } from './swiggy-mcp';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables manually (workaround for Turbopack)
function loadEnvVars() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading env vars:', error);
  }
}

// Load env vars on module initialization
loadEnvVars();

// Initialize Anthropic client lazily
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export interface GroceryItem {
  name: string;
  quantity: string;
  unit: string;
  category: string;
}

export interface OrderRequest {
  groceryItems: GroceryItem[];
  allergens: string[];
  familySize: number;
  accessToken: string;
  addressId: string;
}

export interface OrderResult {
  success: boolean;
  cartId?: string;
  itemsAdded: number;
  itemsNotFound: string[];
  totalEstimate?: number;
  cart?: SwiggyCart;
  message: string;
}

// System prompt for the grocery ordering agent
const GROCERY_AGENT_PROMPT = `You are a helpful grocery shopping assistant for MealMate app. Your job is to help users order groceries from Swiggy Instamart.

You have access to Swiggy Instamart through MCP (Model Context Protocol). You can:
1. Search for products by name using swiggy_search_products
2. Add items to the cart using swiggy_add_to_cart
3. View cart contents using swiggy_get_cart
4. Remove items using swiggy_remove_from_cart
5. Clear the cart using swiggy_clear_cart

IMPORTANT RULES:
1. Always search for the exact item name first
2. If exact match not found, search for close alternatives (e.g., "red onion" instead of "onion")
3. Pay attention to quantity and unit (e.g., "500g tomatoes" vs "1kg tomatoes")
4. NEVER add items containing allergens the user has specified - check product descriptions!
5. Prefer items that are in stock and have good value (price vs mrp)
6. If an item is not found after 2 search attempts, note it and move on
7. Add items one by one to ensure cart is built correctly

When adding items:
- Match quantities as closely as possible to what's requested
- If exact quantity not available, choose the closest larger size
- For produce (vegetables, fruits), prefer fresh options
- Check the "inStock" field before adding

WORKFLOW:
1. For each grocery item in the list:
   a. Call swiggy_search_products with the item name
   b. Review results - check inStock status and allergens
   c. Select best matching product
   d. Call swiggy_add_to_cart with productId and appropriate quantity
2. After processing ALL items, call order_complete with a summary

After completing the cart, call order_complete with:
- A summary of what was added
- List any items that couldn't be found
- Provide the estimated total

CRITICAL: You MUST call order_complete when you are done processing all items. This signals the cart is ready.`;

/**
 * Build the grocery order using Claude + MCP tools
 * This implements an agentic loop where Claude uses tools to build the cart
 */
export async function buildGroceryOrderWithMCP(request: OrderRequest): Promise<OrderResult> {
  const { groceryItems, allergens, familySize, accessToken, addressId } = request;
  const anthropic = getAnthropicClient();

  // Initialize MCP client for Swiggy
  const mcpClient = new SwiggyMCPClient(accessToken, addressId);

  // Build the user message with grocery list
  const groceryList = groceryItems
    .map((item) => `- ${item.name}: ${item.quantity} ${item.unit} (${item.category})`)
    .join('\n');

  const allergenWarning =
    allergens.length > 0
      ? `\n\n⚠️ ALLERGEN ALERT: The user is allergic to: ${allergens.join(', ')}.
DO NOT add any products containing these ingredients. Check product descriptions carefully.`
      : '';

  const userMessage = `Please help me order the following groceries from Swiggy Instamart for a family of ${familySize}:

${groceryList}
${allergenWarning}

Please:
1. Search for each item on Instamart
2. Add appropriate quantities to the cart
3. Let me know if any items are not available
4. Call order_complete when you're done with a summary`;

  try {
    // Initialize messages array for the agentic loop
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: userMessage,
      },
    ];

    let itemsNotFound: string[] = [];
    let itemsAdded = 0;
    let finalCart: SwiggyCart | undefined;
    let orderComplete = false;
    let iterations = 0;
    const maxIterations = 50; // Safety limit

    console.log('[Claude MCP] Starting agentic loop for cart building');

    // Agentic loop - keep calling Claude until it signals completion
    while (!orderComplete && iterations < maxIterations) {
      iterations++;
      console.log(`[Claude MCP] Iteration ${iterations}`);

      // Call Claude with tools
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: GROCERY_AGENT_PROMPT,
        tools: SWIGGY_MCP_TOOLS as Anthropic.Tool[],
        messages,
      });

      console.log(`[Claude MCP] Response stop_reason: ${response.stop_reason}`);

      // Check if Claude wants to use tools
      if (response.stop_reason === 'tool_use') {
        // Process each tool call
        const toolResults: Anthropic.MessageParam['content'] = [];

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            console.log(`[Claude MCP] Tool call: ${block.name}`, JSON.stringify(block.input));

            try {
              // Execute the tool using our MCP client
              const result = await mcpClient.executeTool(
                block.name,
                block.input as Record<string, unknown>
              );

              console.log(`[Claude MCP] Tool result for ${block.name}:`, JSON.stringify(result).slice(0, 200));

              // Check for order_complete signal
              if (block.name === 'order_complete') {
                orderComplete = true;
                finalCart = await mcpClient.getCart();

                // Parse the summary for items not found
                const summary = (block.input as { summary?: string }).summary || '';
                const notFoundMatch = summary.match(/not found[:\s]*([^.]+)/i);
                if (notFoundMatch) {
                  itemsNotFound = notFoundMatch[1]
                    .split(/,|and/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                }
              }

              // Track items added
              if (block.name === 'swiggy_add_to_cart') {
                itemsAdded++;
              }

              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(result),
              });
            } catch (toolError) {
              console.error(`[Claude MCP] Tool error for ${block.name}:`, toolError);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify({
                  error: toolError instanceof Error ? toolError.message : 'Unknown error',
                }),
                is_error: true,
              });
            }
          }
        }

        // Add assistant response and tool results to messages
        messages.push({
          role: 'assistant',
          content: response.content,
        });

        messages.push({
          role: 'user',
          content: toolResults as Anthropic.ToolResultBlockParam[],
        });
      } else if (response.stop_reason === 'end_turn') {
        // Claude finished without tool calls - extract any final message
        console.log('[Claude MCP] End turn reached');

        // If we haven't explicitly completed, try to get the cart
        if (!orderComplete) {
          try {
            finalCart = await mcpClient.getCart();
            orderComplete = true;
          } catch {
            console.log('[Claude MCP] Could not get final cart');
          }
        }
        break;
      } else {
        // Unexpected stop reason
        console.log(`[Claude MCP] Unexpected stop_reason: ${response.stop_reason}`);
        break;
      }
    }

    if (iterations >= maxIterations) {
      console.warn('[Claude MCP] Max iterations reached');
    }

    // Build the result
    const cartId = mcpClient.getCartId();

    return {
      success: orderComplete && itemsAdded > 0,
      cartId: cartId || undefined,
      itemsAdded,
      itemsNotFound,
      totalEstimate: finalCart?.total,
      cart: finalCart,
      message: orderComplete
        ? `Successfully added ${itemsAdded} items to cart. ${itemsNotFound.length > 0 ? `Could not find: ${itemsNotFound.join(', ')}` : ''}`
        : 'Cart building incomplete. Please try again.',
    };
  } catch (error) {
    console.error('[Claude MCP] Error:', error);
    return {
      success: false,
      itemsAdded: 0,
      itemsNotFound: groceryItems.map((i) => i.name),
      message: `Error building order: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Legacy function - Build the grocery order using Claude (without MCP)
 * Kept for backward compatibility
 */
export async function buildGroceryOrder(request: Omit<OrderRequest, 'accessToken' | 'addressId'>): Promise<OrderResult> {
  const { groceryItems, allergens, familySize } = request;
  const anthropic = getAnthropicClient();

  // Build the user message with grocery list
  const groceryList = groceryItems
    .map((item) => `- ${item.name}: ${item.quantity} ${item.unit} (${item.category})`)
    .join('\n');

  const allergenWarning =
    allergens.length > 0
      ? `\n\n⚠️ ALLERGEN ALERT: The user is allergic to: ${allergens.join(', ')}.
DO NOT add any products containing these ingredients. Check product descriptions carefully.`
      : '';

  const userMessage = `Please help me order the following groceries from Swiggy Instamart for a family of ${familySize}:

${groceryList}
${allergenWarning}

Please:
1. Search for each item
2. Add appropriate quantities to the cart
3. Let me know if any items are not available
4. Provide the cart summary when done`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: GROCERY_AGENT_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract the response text
    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse the response to extract order information
    const result: OrderResult = {
      success: true,
      itemsAdded: groceryItems.length,
      itemsNotFound: [],
      message: responseText,
    };

    return result;
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      success: false,
      itemsAdded: 0,
      itemsNotFound: groceryItems.map((i) => i.name),
      message: `Error building order: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Generate a formatted shopping prompt for manual use
export function generateShoppingPrompt(request: Omit<OrderRequest, 'accessToken' | 'addressId'>): string {
  const { groceryItems, allergens, familySize } = request;

  let prompt = `🛒 **MealMate Grocery Order**

Hi Claude! Please help me order groceries from Swiggy Instamart.

**Family Size:** ${familySize} people

**Shopping List:**
`;

  // Group items by category
  const byCategory: Record<string, GroceryItem[]> = {};
  groceryItems.forEach((item) => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  });

  // Format items by category
  Object.entries(byCategory).forEach(([category, items]) => {
    prompt += `\n📦 **${category.charAt(0).toUpperCase() + category.slice(1)}:**\n`;
    items.forEach((item) => {
      prompt += `   • ${item.name} - ${item.quantity} ${item.unit}\n`;
    });
  });

  // Add allergen warnings
  if (allergens.length > 0) {
    prompt += `\n⚠️ **IMPORTANT - ALLERGEN ALERT:**
I am allergic to: **${allergens.join(', ')}**
Please ensure NONE of the products contain these ingredients.
Check product labels and descriptions carefully.
If unsure about an item, skip it and let me know.\n`;
  }

  prompt += `\n**Instructions:**
1. Search for each item on Swiggy Instamart
2. Add the closest matching product to my cart
3. If exact item not found, suggest an alternative
4. Skip any items containing my allergens
5. Once done, show me the cart summary

Thank you! 🙏`;

  return prompt;
}

// Check if Claude API is configured
export function isClaudeConfigured(): boolean {
  loadEnvVars();
  return !!process.env.ANTHROPIC_API_KEY;
}
