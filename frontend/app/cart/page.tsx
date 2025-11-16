"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type CartItem = {
  cartItemId: string;
  quantity: string | number;
  productId: string;
  name: string;
  price: string | number;
  imageUrl: string | string[];
  stockAvailable: number;
};

const API_BASE_URL = "http://localhost:8000";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        // Convert quantities to numbers
        const items = (data.items || []).map((item: CartItem) => ({
          ...item,
          quantity: Number(item.quantity),
          price: Number(item.price),
        }));
        setCartItems(items);
      } else {
        setError("Failed to load cart");
      }
    } catch (err) {
      setError("Error loading cart");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Optimistic update - update UI immediately
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );

    try {
      const res = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (!res.ok) {
        // Revert on error
        fetchCart();
        setError("Error updating quantity");
      }
    } catch (err) {
      setError("Error updating quantity");
      console.error(err);
      // Revert on error
      fetchCart();
    }
  };

  const removeItem = async (cartItemId: string) => {
    // Optimistic update - remove from UI immediately
    setCartItems(prevItems =>
      prevItems.filter(item => item.cartItemId !== cartItemId)
    );

    try {
      const res = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        // Revert on error
        fetchCart();
        setError("Error removing item");
      }
    } catch (err) {
      setError("Error removing item");
      console.error(err);
      // Revert on error
      fetchCart();
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

  return (
    <div className="min-h-screen bg-[#FFE4C4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <Link href="/home">
                  <Button className="bg-[#febd69] hover:bg-[#f5a623] text-black">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={Array.isArray(item.imageUrl) ? item.imageUrl[0] : item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div>
                        <h3 className="text-lg font-medium">{item.name}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-gray-700">
                        <div className="text-sm">Price</div>
                        <div className="font-semibold">${Number(item.price).toFixed(2)}</div>
                      </div>

                      <div>
                        <label className="sr-only">Quantity</label>
                        <div className="flex items-center border rounded-lg w-fit">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, Number(item.quantity) - 1)}
                            className="px-3 py-1 text-lg hover:bg-gray-100 disabled:opacity-50"
                            aria-label={`Decrease quantity for ${item.name}`}
                            disabled={loading}
                          >
                            −
                          </button>
                          <span className="px-4 py-1 border-x text-lg font-medium select-none">
                            {Number(item.quantity)}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, Number(item.quantity) + 1)}
                            className="px-3 py-1 text-lg hover:bg-gray-100 disabled:opacity-50"
                            aria-label={`Increase quantity for ${item.name}`}
                            disabled={loading}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm">Subtotal</div>
                        <div className="font-semibold">${(Number(item.price) * Number(item.quantity)).toFixed(2)}</div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.cartItemId)}
                        aria-label={`Remove ${item.name}`}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary & Checkout */}
          {cartItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (est.)</span>
                  <span>${(total * 0.08).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 text-lg font-bold">
                <span>Total</span>
                <span>${(total + total * 0.08).toFixed(2)}</span>
              </div>

              <div className="space-y-3">
                <Button className="w-full bg-[#febd69] hover:bg-[#f5a623] text-black font-bold py-3 text-lg">
                  Proceed to Checkout
                </Button>
                <Link href="/home">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Secure checkout powered by Oblito
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

