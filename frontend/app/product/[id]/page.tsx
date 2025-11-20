"use client";
import { CarouselDemo } from './Carousel';
import { ProductInteractions } from './ProductInteractions';
import { ProductReviews } from './ProductReview';
import { useEffect, useState } from 'react';
import { use } from 'react';

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

  useEffect(() => {
    async function fetchCategories() {
      try {
        console.log("📂 Fetching categories...");
        const res = await fetch(`${API_BASE_URL}/categories`, {
          credentials: 'include',
          method: 'GET',
        });
        const data = await res.json();
        console.log("✅ Categories fetched:", data);
        
        if (res.ok) {
          setCategories(data);
        }
      } catch (err) {
        console.error('❌ Error fetching categories:', err);
      }
    }

    async function fetchProduct() {
      try {
        console.log("📦 Fetching product:", id);
        const res = await fetch(`${API_BASE_URL}/products/${id}`, {
          credentials: 'include',
          method: 'GET',
        });
        const data = await res.json();
        console.log("Full backend response:", data);
        
        if (res.ok) {
          const productData = data.product;
          console.log("Extracted product data:", productData);
          
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
        console.log("🏷️ Category name set to:", category.name);
      } else {
        console.warn("⚠️ Category not found for ID:", product.categoryId);
        setCategoryName("Unknown Category");
      }
    }
  }, [product, categories]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  if (!product) {
    return <div className="text-center py-12">Product not found</div>;
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-5 py-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="w-full lg:col-span-7">
          <CarouselDemo imageURLs={product.imageURLs} />
        </div>
        <div className="flex flex-col justify-start space-y-8 lg:col-span-5">
          <div>
            <h1 className="text-4xl font-semibold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{categoryName || 'Loading category...'}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-gray-900">${product.price}</span>
          </div>
          <ProductInteractions product={product} />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-5 pb-12 -mt-15">
        <ProductReviews 
          productId={product.id}
          productName={product.name}
          productRating={product.rating || 0}
        />
      </div>
    </div>
  );
}

