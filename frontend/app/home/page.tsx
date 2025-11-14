'use client';

import ProductCard from "@/components/ProductCard";
import { use, useEffect, useState,useMemo } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string; // This is a string, like "12.99"
  stockQuantity: string; // This is also a string
  imageURLs: string[]; // This is an array of strings
  categoryId: string;
  creatorId: string;
  createdAt: string;
}

export default function HomePage() {
    const [user, setUser] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch(`http://localhost:8000/auth/user`, {
                    credentials: 'include',
                    method: 'GET',
                });
                if(res.ok){
                    const data = await res.json();
                    setUser(data.user.email);
                }
            } catch (err) {
                console.error('Error fetching user:', err);
            } finally {
                setLoading(false);
            }
        }
        async function fetchProducts() {
            try {
                const res = await fetch(`http://localhost:8000/products`, {
                    credentials: 'include',
                    method: 'GET',
                });
                if(res.ok){
                    const data = await res.json();
                    setProducts(data.products);
                    console.log(data);
                }
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
        fetchProducts();
    }, []);

    return (
        <div className="max-w-[1500px] mx-auto p-[20px] grow bg-[#FFE4C4] w-full">
            <h1>Home</h1>
            {loading ? (
                <p>Loading...</p>
            ) : user ? (
                <p>Welcome, {user}!</p>
            ) : (
                <p>You are not logged in.</p>
            )}


         <div className="grid grid-cols-4 gap-[24px] justify-items-center p-[20px]">
                 {products.map((product) => (
                   <ProductCard key={product.id} product={product} />
                 ))}
               </div>
        </div>
    );
}