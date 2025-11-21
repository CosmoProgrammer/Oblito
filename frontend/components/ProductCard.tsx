import Link from 'next/link';
import type { ProductProps } from "../types/ProductProps";
import { useCart } from '@/app/cart/cart_util';
import { use } from 'react';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: ProductProps;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { name, description, price, imageURLs, id } = product;
  const { addItemToCart,addedMsg } = useCart();

  function addToCartHandler(e: React.MouseEvent) {
    e.preventDefault();
    addItemToCart(id, 1);
  }

  return (
    <Link href={`/product/${product.id}`} className="group block h-full w-full">
      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full relative">
        
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={imageURLs[0]}
            alt={name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-gray-700 transition-colors">
            {name}
          </h3>

          <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
            {description}
          </p>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
            <p className="text-xl font-extrabold text-gray-900">
              ${price}
            </p>
            
            <button
              className="bg-gray-900 hover:bg-gray-800 text-white p-2.5 rounded-xl transition-all duration-200 shadow-sm active:scale-95"
              type="button"
              onClick={addToCartHandler}
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
          
          {addedMsg && (
            <p className="absolute bottom-20 left-0 right-0 text-center text-xs font-bold text-green-600 bg-green-50 py-1 px-2 mx-4 rounded-md animate-in fade-in slide-in-from-bottom-2">
              {addedMsg}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}



