"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';

// Define the shape of the props this component will receive
type ProductInteractionsProps = {
  product: {
    price: number;
    rating: number;
    description: string;
  };
};

export function ProductInteractions({ product }: ProductInteractionsProps) {
  // All client-side interactive logic lives here
  const [quantity, setQuantity] = useState(1);

  function increaseQuantity() {
    setQuantity(prevQuantity => prevQuantity + 1);
  }

  function decreaseQuantity() {
    // Prevent quantity from going below 1
    setQuantity(prevQuantity => (prevQuantity > 1 ? prevQuantity - 1 : 1));
  }

  return (
    // We start from Price, as Title/Category are in the server page
    <>
      {/* Price */}
      <div className="flex items-center gap-4">
        <span className="text-4xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
      </div>

      {/* Ratings */}
      <div className="flex items-center gap-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-gray-600 text-sm">{product.rating.toFixed(1)} • 122 reviews</span>
      </div>

      {/* Quantity Selector */}
      <div>
        <label className="text-gray-700 font-medium mb-2 block">Quantity:</label>
        <div className="flex items-center border rounded-lg w-fit">
          <button onClick={decreaseQuantity} className="px-3 py-1 text-lg hover:bg-gray-100">−</button>
          <span className="px-4 py-1 border-x text-lg font-medium select-none">{quantity}</span>
          <button onClick={increaseQuantity} className="px-3 py-1 text-lg hover:bg-gray-100">+</button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button className="w-full sm:w-auto bg-[#febd69] hover:bg-[#f5a623] text-black font-medium py-3 px-10 rounded-lg transition-colors">
        Add to Cart
      </button>

      {/* Description */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
        <p className="text-gray-600 leading-relaxed">{product.description}</p>
      </div>
    </>
  );
}
