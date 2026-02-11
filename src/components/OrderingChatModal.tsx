'use client';

import { useState, useEffect, useRef } from 'react';
import { GroceryItem } from '@/types';
import {
  OrderState,
  OrderingState,
  ChatMessage,
  QuickAction,
  DeliveryAddress,
  DEMO_ADDRESSES,
  initializeOrderState,
  generateUserMessage,
  generateAddressConfirmMessage,
  generateProcessingMessage,
  generateHandoffMessage,
  generateEditCartMessage,
  generateCancelMessage,
  generateFinalClaudePrompt,
  calculateEstimate,
} from '@/lib/ordering-flow';

interface OrderingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  groceryItems: GroceryItem[];
  familySize: number;
}

export function OrderingChatModal({
  isOpen,
  onClose,
  groceryItems,
  familySize,
}: OrderingChatModalProps) {
  const [orderState, setOrderState] = useState<OrderState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && groceryItems.length > 0) {
      setOrderState(initializeOrderState(groceryItems, familySize));
      setPromptCopied(false);
    }
  }, [isOpen, groceryItems, familySize]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [orderState?.messages]);

  // Handle action button clicks
  const handleAction = async (action: QuickAction) => {
    if (!orderState) return;

    switch (action.action) {
      case 'SELECT_ADDRESS': {
        const addressId = action.data?.addressId as string;
        const address = DEMO_ADDRESSES.find(a => a.id === addressId);
        if (address) {
          await selectAddress(address, action.label);
        }
        break;
      }

      case 'NEW_ADDRESS': {
        // For now, show a message that this feature is coming soon
        addBotMessage("📍 Custom address entry coming soon! For now, please select one of the saved addresses above.");
        break;
      }

      case 'PLACE_ORDER': {
        await handlePlaceOrder();
        break;
      }

      case 'EDIT_CART': {
        handleEditCart();
        break;
      }

      case 'BACK_TO_CART': {
        if (orderState.selectedAddress) {
          const confirmMsg = generateAddressConfirmMessage(
            orderState.selectedAddress,
            orderState.groceryItems,
            orderState.estimatedTotal
          );
          setOrderState(prev => prev ? {
            ...prev,
            currentState: 'CART_REVIEW',
            messages: [...prev.messages, confirmMsg],
          } : null);
        }
        break;
      }

      case 'CANCEL': {
        handleCancel();
        break;
      }

      case 'OPEN_CLAUDE': {
        openClaudeDesktop();
        break;
      }

      case 'COPY_PROMPT': {
        await copyPromptToClipboard();
        break;
      }

      case 'CLOSE': {
        onClose();
        break;
      }

      case 'SHOW_REMOVE_OPTIONS': {
        // Show items that can be removed
        addBotMessage(`Select an item to remove:\n\n${orderState.groceryItems.map((item, i) => `${i + 1}. ${item.name}`).join('\n')}\n\n(This feature is simplified - use the Grocery List edit mode for full control)`);
        break;
      }
    }
  };

  // Add a bot message with typing animation
  const addBotMessage = (content: string, actions?: QuickAction[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setOrderState(prev => {
        if (!prev) return null;
        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'bot',
          content,
          timestamp: new Date(),
          actions,
        };
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
        };
      });
      setIsTyping(false);
    }, 500);
  };

  // Select address and move to cart review
  const selectAddress = async (address: DeliveryAddress, label: string) => {
    // Add user's selection
    const userMsg = generateUserMessage(label);
    setOrderState(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMsg],
      selectedAddress: address,
    } : null);

    // Show typing indicator
    setIsTyping(true);

    // After a brief delay, show cart confirmation
    setTimeout(() => {
      const confirmMsg = generateAddressConfirmMessage(
        address,
        orderState!.groceryItems,
        orderState!.estimatedTotal
      );
      setOrderState(prev => prev ? {
        ...prev,
        currentState: 'CART_REVIEW',
        messages: [...prev.messages, confirmMsg],
      } : null);
      setIsTyping(false);
    }, 800);
  };

  // Handle place order - prepare for Claude handoff
  const handlePlaceOrder = async () => {
    if (!orderState?.selectedAddress) return;

    // Add user confirmation
    const userMsg = generateUserMessage('✅ Place Order');
    setOrderState(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMsg],
      currentState: 'PROCESSING',
    } : null);

    setIsTyping(true);

    // Generate and copy the prompt
    const prompt = generateFinalClaudePrompt(
      orderState.groceryItems,
      orderState.selectedAddress,
      orderState.familySize
    );

    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }

    // Show processing then handoff message
    setTimeout(() => {
      const processingMsg = generateProcessingMessage();
      setOrderState(prev => prev ? {
        ...prev,
        messages: [...prev.messages, processingMsg],
      } : null);

      setTimeout(() => {
        const handoffMsg = generateHandoffMessage(
          orderState.groceryItems,
          orderState.selectedAddress!
        );
        setOrderState(prev => prev ? {
          ...prev,
          currentState: 'HANDOFF',
          messages: [...prev.messages, handoffMsg],
        } : null);
        setIsTyping(false);
      }, 1500);
    }, 500);
  };

  // Handle edit cart
  const handleEditCart = () => {
    const userMsg = generateUserMessage('✏️ Edit Items');
    const editMsg = generateEditCartMessage(orderState!.groceryItems);

    setOrderState(prev => prev ? {
      ...prev,
      currentState: 'EDIT_CART',
      messages: [...prev.messages, userMsg, editMsg],
    } : null);
  };

  // Handle cancel
  const handleCancel = () => {
    const userMsg = generateUserMessage('❌ Cancel');
    const cancelMsg = generateCancelMessage();

    setOrderState(prev => prev ? {
      ...prev,
      currentState: 'COMPLETE',
      messages: [...prev.messages, userMsg, cancelMsg],
    } : null);
  };

  // Open Claude Desktop
  const openClaudeDesktop = () => {
    window.open('claude://', '_blank');
  };

  // Copy prompt to clipboard
  const copyPromptToClipboard = async () => {
    if (!orderState?.selectedAddress) return;

    const prompt = generateFinalClaudePrompt(
      orderState.groceryItems,
      orderState.selectedAddress,
      orderState.familySize
    );

    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      addBotMessage('✅ Prompt copied to clipboard! Paste it in Claude Desktop.');
      setTimeout(() => setPromptCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      addBotMessage('❌ Failed to copy. Please try again.');
    }
  };

  if (!isOpen || !orderState) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-xl">🛒</span>
              </div>
              <div>
                <h2 className="font-bold">Order Groceries</h2>
                <p className="text-white/80 text-xs">
                  {orderState.groceryItems.length} items • via Swiggy Instamart
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {orderState.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                }`}
              >
                {/* Message content with markdown-style formatting */}
                <div className="text-sm whitespace-pre-wrap">
                  {message.content.split('\n').map((line, i) => {
                    // Bold text
                    const formattedLine = line.replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong>$1</strong>'
                    );
                    return (
                      <p
                        key={i}
                        className={i > 0 ? 'mt-1' : ''}
                        dangerouslySetInnerHTML={{ __html: formattedLine }}
                      />
                    );
                  })}
                </div>

                {/* Action buttons */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleAction(action)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          action.variant === 'primary'
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : action.variant === 'danger'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer with status */}
        <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${
                orderState.currentState === 'PROCESSING'
                  ? 'bg-yellow-400 animate-pulse'
                  : orderState.currentState === 'HANDOFF' || orderState.currentState === 'COMPLETE'
                  ? 'bg-green-400'
                  : 'bg-purple-400'
              }`} />
              <span>
                {orderState.currentState === 'WELCOME' && 'Select delivery address'}
                {orderState.currentState === 'CART_REVIEW' && 'Review your order'}
                {orderState.currentState === 'EDIT_CART' && 'Editing cart'}
                {orderState.currentState === 'PROCESSING' && 'Processing...'}
                {orderState.currentState === 'HANDOFF' && 'Ready for Claude'}
                {orderState.currentState === 'COMPLETE' && 'Order complete'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Powered by</span>
              <span className="text-xs font-medium text-orange-600">Swiggy</span>
              <span className="text-xs text-gray-400">+</span>
              <span className="text-xs font-medium text-purple-600">Claude</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
