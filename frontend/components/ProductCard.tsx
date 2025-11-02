import Link from 'next/link';
import type { ProductProps } from "../types/ProductProps";
import { useCart } from '@/app/cart/cart_util';
import { use } from 'react';

interface ProductCardProps {
  product: ProductProps;
}


export default function ProductCard({ product }: ProductCardProps) {
  const { name, description, price, imageUrl, rating, id } = product;
  const { addItemToCart,addedMsg } = useCart();

  function addToCartHandler(productId: string) {
  addItemToCart(productId, 1);
}


  return (
    <div className="flex justify-center w-full h-full">
      <article className="bg-[#ebe6e6] w-[300px] max-w-[320px] rounded-[18px] shadow-lg overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full text-center">
        
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-[150px] object-cover flex-shrink-0"
        />

        <div className="p-4 flex flex-col flex-grow">
          <Link href={`/product/${product.id}`} className="no-underline hover:underline">
          <h3 className="text-lg font-semibold text-[#333] mb-2">{name}</h3>
          </Link>

          <p className="text-sm text-gray-500 mb-3 leading-tight flex-grow">
            {description}
          </p>

          <p className="text-yellow-500 font-medium mb-1">Rating: {rating}</p>

          <p className="text-2xl font-extrabold text-[#111] mb-4">
            ${price.toFixed(2)}
          </p>
        </div>

        <div className="mt-auto">
          <button
            className="w-full bg-[#ffb800] hover:bg-[#f1a800] hover: cursor-pointer text-white font-bold py-3 rounded-b-[18px] transition-colors"
            type="button"
            onClick={addToCartHandler.bind(null, id)}
          >
            Add to Cart
          </button>
          {addedMsg && (
        <p className="text-green-600 font-medium mt-3 transition-opacity duration-300">
          {addedMsg}
        </p>)}

        </div>
      </article>
    </div>
  );
}



