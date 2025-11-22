"use client";
import { CarouselDemo } from './Carousel';
import { ProductInteractions } from './ProductInteractions';
import { ProductReviews } from './ProductReview';
import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

type Product = {
  id: string;
  name: string;
  price: string;
  categoryId: string;
  description: string;
  shopName?: string; // Add shopName to Product type
  stockQuantity?: string; // Add stockQuantity to Product type
  [key: string]: any;
};

const API_BASE_URL = "http://localhost:8000";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`, {
          credentials: 'include',
          method: 'GET',
        });
        const data = await res.json();
        if (res.ok) {
          setCategories(data);
        }
      } catch (err) {
        console.error('❌ Error fetching categories:', err);
      }
    }

    async function fetchProduct() {
      try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`, {
          credentials: 'include',
          method: 'GET',
        });
        const data = await res.json();
        
        if (res.ok) {
          const productData = data.product;
          if (productData && productData.id) {
            setProduct(productData);
          } else {
            setError("Invalid product data received");
          }
        } else {
          setError(`Failed to load product: ${data.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('❌ Error fetching product:', err);
        setError("Error loading product");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
    fetchProduct();
  }, [id]);

  // Update category name when product or categories change
  useEffect(() => {
    if (product && categories.length > 0) {
      const category = categories.find(cat => cat.id === product.categoryId);
      if (category) {
        setCategoryName(category.name);
      } else {
        setCategoryName("Unknown Category");
      }
    }
  }, [product, categories]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-red-600 font-medium mb-2">Something went wrong</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-12">Product not found</div>;
  }

  const stockQuantity = parseInt(String(product.stockQuantity || 0));
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Breadcrumb / Category */}
        <nav className="mb-8 text-sm font-medium text-gray-500">
          <Link href="/home" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/home?categories=${product.categoryId}`} className="hover:text-gray-900">{categoryName || 'Category'}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            
            {/* Left: Image Carousel */}
            <div className="p-8 lg:p-12 bg-gray-50/50 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="w-full max-w-xl">
                <CarouselDemo imageURLs={product.imageURLs} />
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="p-8 lg:p-12 flex flex-col">
              <div className="mb-auto">
                <div className="mb-4 flex items-center gap-3 flex-wrap">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#febd69]/20 text-yellow-800 text-xs font-bold uppercase tracking-wide">
                    {categoryName}
                  </span>
                  {product.shopName && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      <Store className="w-3.5 h-3.5" />
                      {product.shopName}
                    </div>
                  )}
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  {product.name}
                </h1>
                
                <div className="flex items-baseline gap-4 mb-8 border-b border-gray-100 pb-8">
                  <span className="text-4xl font-bold text-gray-900">${product.price}</span>
                  {product.stockQuantity && parseInt(product.stockQuantity) > 0 ? (
                    <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded text-sm">In Stock: {product.stockQuantity}</span>
                  ) : (
                    <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded text-sm">Out of Stock</span>
                  )}
                </div>

                {product.shopName && (
                  <div className="mb-4">
                    <span className="text-gray-700 text-sm">Sold by: </span>
                    <span className="font-medium text-gray-900">{product.shopName}</span>
                  </div>
                )}

                <div className="prose prose-gray max-w-none mb-8 text-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About this item</h3>
                  <p className="leading-relaxed">{product.description}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <ProductInteractions product={product} />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ProductReviews 
            productId={product.id}
            productName={product.name}
            productRating={product.rating || 0}
          />
        </div>
      </div>
    </div>
  );
}

