"use client";

import { useEffect, useState } from "react";
import { getProductById } from "@/app/data/products";
import { Button } from "@/components/ui/button";

type CartItem = { id: string; quantity: number };

export default function CartPage() {
  const CART_KEY = "oblito_cart";
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return;
    try {
      setCartItems(JSON.parse(raw));
    } catch {
      setCartItems([]);
    }
  }, []);

  const saveItems = (next: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    setCartItems(next);
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    saveItems(cartItems.map(i => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const removeItem = (id: string) => {
    saveItems(cartItems.filter(i => i.id !== id));
  };

  const cartProducts = cartItems.map(i => {
      const product = getProductById(i.id);
      if (!product) return null;
      return { ...product, quantity: i.quantity };
    }).filter(Boolean) as (typeof import("@/app/data/products").allProducts[0] & { quantity: number })[];

  const total = cartProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FFE4C4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {cartProducts.length === 0 ? (
            <p className="text-gray-500 text-center">Your cart is empty</p>
          ) : (
            <>
              {cartProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div>
                      <h3 className="text-lg font-medium">{p.name}</h3>
                      <p className="text-sm text-gray-500">{p.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-gray-700">
                      <div className="text-sm">Price</div>
                      <div className="font-semibold">${p.price.toFixed(2)}</div>
                    </div>

                  <div>
                    <label className="sr-only">Quantity</label>
                    <div className="flex items-center border rounded-lg w-fit">
                        <button
                            onClick={() => updateQuantity(p.id, p.quantity - 1)}
                            className="px-3 py-1 text-lg hover:bg-gray-100"
                            aria-label={`Decrease quantity for ${p.name}`}
                        >
                        −
                        </button>
                        <span className="px-4 py-1 border-x text-lg font-medium select-none">
                            {p.quantity}
                        </span>
                        <button
                        onClick={() => updateQuantity(p.id, p.quantity + 1)}
                        className="px-3 py-1 text-lg hover:bg-gray-100"
                        aria-label={`Increase quantity for ${p.name}`}
                        >
                        +
                        </button>
                    </div>
                  </div>

                    <div className="text-right">
                      <div className="text-sm">Subtotal</div>
                      <div className="font-semibold">${(p.price * p.quantity).toFixed(2)}</div>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(p.id)}
                      aria-label={`Remove ${p.name}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold">${total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

