"use client";
import { useState } from 'react';

const API_BASE_URL = "http://localhost:8000";

type CartItem = {
  cartItemId: string;
  quantity: number;
  productId: string;
};

/**
 * This is the pure, async logic for updating the cart via API.
 */
async function addItemToCartAPI(productId: string, quantity: number) {
  if (!productId || quantity <= 0) {
    console.error("Invalid product ID or quantity");
    return;
  }

  try {
    const payload = {
      shopInventoryId: productId,
      quantity,
    };

    console.log("Sending to POST /cart:", JSON.stringify(payload, null, 2));

    const res = await fetch(`${API_BASE_URL}/cart`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    
    console.log("Backend response:", res.status, data);
    
    if (!res.ok) {
      // Handle 401 Unauthorized specifically
      if (res.status === 401) {
        throw new Error("You must be logged in to add items to cart");
      }
      
      // Extract error message from errors array or message field
      let errorMsg = `Server error: ${res.status}`;
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMsg = data.errors[0].message || data.errors[0];
        console.log("Extracted error message:", errorMsg);
      } else if (data.message) {
        errorMsg = data.message;
      }
      console.error("Backend error details:", data);
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (err) {
    console.error("Error adding to cart:", err);
    throw err;
  }
}

// --- Custom hook for adding to cart ---
export function useCart() {
  const [addedMsg, setAddedMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addItemToCart = async (productId: string, quantity: number) => {
    console.log("addItemToCart called with:", { productId, quantity });
    setIsLoading(true);
    try {
      await addItemToCartAPI(productId, quantity);
      setAddedMsg(`Added ${quantity} item(s) to cart!`);
      setTimeout(() => setAddedMsg(null), 3000);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to add item to cart";
      setAddedMsg(errorMsg);
      console.error("Cart error details:", errorMsg);
      setTimeout(() => setAddedMsg(null), 5000); // Show error longer
    } finally {
      setIsLoading(false);
    }
  };

  return { addedMsg, addItemToCart, isLoading };
}
