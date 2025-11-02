"use client"; // Custom hooks that use state must be client-side
import { useState } from 'react';

// Define a type for a cart item for better type safety
type CartItem = {
  id: string;
  quantity: number;
};

// This key can be exported if other parts of the app need it (like a cart page)
export const CART_KEY = "oblito_cart";

/**
 * This is the pure, non-React logic for updating localStorage.
 * It's kept separate so it's not tied to React.
 */
function updateCartInStorage(productId: string, quantity: number) {
  if (!productId || quantity <= 0) {
    console.error("Invalid product ID or quantity");
    return;
  }

  // Get the current cart from localStorage
  const raw = localStorage.getItem(CART_KEY);
  const current: CartItem[] = raw ? JSON.parse(raw) : [];

  // Find if the item already exists in the cart
  const existing = current.find(item => item.id === productId);

  if (existing) {
    // Update quantity, ensuring it doesn't exceed a max limit (e.g., 999)
    existing.quantity = Math.min(999, existing.quantity + quantity);
  } else {
    // Add the new item to the cart
    current.push({ id: productId, quantity });
  }

  // Save the updated cart back to localStorage
  localStorage.setItem(CART_KEY, JSON.stringify(current));
}


// --- This is the new custom hook ---
// It wraps the cart logic and adds React state (the message)
export function useCart() {
  // State for the message lives INSIDE the hook
  const [addedMsg, setAddedMsg] = useState<string | null>(null);

  /**
   * This is the function your component will call.
   * It calls the storage logic AND sets the message state.
   */
  const addItemToCart = (productId: string, quantity: number) => {
    // 1. Call the pure logic to update the cart
    updateCartInStorage(productId, quantity);

    // 2. Set the local state to show a message
    setAddedMsg(`Added ${quantity} item(s) to cart!`);

    // 3. Clear the message after 3 seconds
    setTimeout(() => setAddedMsg(null), 3000);
  };

  // Return the message (so the component can display it)
  // and the function (so the component can call it)
  return { addedMsg, addItemToCart };
}
