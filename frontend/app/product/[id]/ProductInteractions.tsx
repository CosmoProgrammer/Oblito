"use client";

import { use, useState } from 'react';
import { Star, ShoppingCart, Minus, Plus } from 'lucide-react'; 
import { useCart } from '@/app/cart/cart_util';

// Define the shape of the props this component will receive
type ProductInteractionsProps = {
  product: {
    price: string;
    // rating: number;
    description: string;
    id: string;
  };
};

export function ProductInteractions({ product }: ProductInteractionsProps) {
  // All client-side interactive logic lives here
  const [quantity, setQuantity] = useState(1);
  const { addItemToCart, addedMsg, isLoading } = useCart();
  

  function increaseQuantity() {
    setQuantity(prevQuantity => prevQuantity + 1);
  }

  function decreaseQuantity() {
    // Prevent quantity from going below 1
    setQuantity(prevQuantity => (prevQuantity > 1 ? prevQuantity - 1 : 1));
  }

    function addToCartHandler() {
        addItemToCart(product.id, quantity);
    }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
      {/* Quantity Selector */}
      <div className="flex items-center bg-gray-100 rounded-xl p-1.5 w-fit">
        <button 
          onClick={decreaseQuantity} 
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:text-gray-900 transition-all active:scale-95 disabled:opacity-50"
          disabled={quantity <= 1}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-12 text-center font-bold text-lg text-gray-900 select-none">{quantity}</span>
        <button 
          onClick={increaseQuantity} 
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:text-gray-900 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add to Cart Button */}
      <div className="flex-grow relative">
        <button 
          onClick={addToCartHandler}
          disabled={isLoading}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Adding...
            </span>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </>
          )}
        </button>
        
        {addedMsg && (
          <div className={`absolute top-full left-0 right-0 mt-2 text-center text-sm font-bold py-2 px-3 rounded-lg animate-in fade-in slide-in-from-top-2 ${addedMsg.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {addedMsg}
          </div>
        )}
      </div>
    </div>
  );
}
