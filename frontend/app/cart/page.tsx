"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Shopping Cart</h1>
            <span className="text-gray-600 font-medium text-lg bg-white/80 px-4 py-2 rounded-full border border-gray-200">{cartItems.length} items</span>
        </div>

        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Trash2 className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Cart Items Section */}
          <div className="lg:col-span-8">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center border border-gray-200">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-200">
                    <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">Looks like you haven't added anything to your cart yet.</p>
                <Link href="/home">
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-10 py-6 text-lg rounded-xl transition-all hover:shadow-lg hover:-translate-y-1">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-8">
                  {cartItems.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="flex flex-col sm:flex-row gap-6 py-6 border-b border-gray-100 last:border-0 group transition-all hover:bg-gray-50/50 rounded-2xl p-4 -mx-4"
                    >
                      {/* Product Image */}
                      <div className="relative w-full sm:w-32 h-32 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <img
                          src={Array.isArray(item.imageUrl) ? item.imageUrl[0] : item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1 hover:text-gray-700 transition-colors cursor-pointer">
                                <Link href={`/product/${item.productId}`}>{item.name}</Link>
                            </h3>
                            <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span> In Stock
                            </p>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            ₹{Number(item.price).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-end justify-between mt-4 sm:mt-0">
                          {/* Quantity Controls */}
                          <div className="flex items-center bg-gray-100 rounded-xl p-1 shadow-inner">
                            <button
                              onClick={() => updateQuantity(item.cartItemId, Number(item.quantity) - 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:text-gray-900 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                              disabled={loading || Number(item.quantity) <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-bold text-gray-900">
                              {Number(item.quantity)}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.cartItemId, Number(item.quantity) + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:text-gray-900 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                              disabled={loading}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 group/trash"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4 transition-transform group-hover/trash:rotate-12" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Section */}
          {cartItems.length > 0 && (
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6 sm:p-8 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600 text-lg">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-lg">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium bg-green-50 px-3 py-0.5 rounded-full text-sm">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-lg">
                    <span>Tax (8%)</span>
                    <span className="font-semibold text-gray-900">₹{(total * 0.08).toFixed(2)}</span>
                  </div>

                  <div className="border-t-2 border-dashed border-gray-100 my-6 pt-6">
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-4xl font-extrabold text-gray-900 tracking-tight">₹{(total + total * 0.08).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <Link href="/checkout" className="block">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-7 text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                      Checkout <ArrowRight className="w-6 h-6" />
                    </Button>
                  </Link>
                  
                  <Link href="/home" className="block">
                    <Button variant="outline" className="w-full py-6 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-2xl font-medium border-gray-200 flex items-center justify-center gap-2 transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Continue Shopping
                    </Button>
                  </Link>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400 bg-gray-50 py-3 rounded-xl border border-gray-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Secure Checkout
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

