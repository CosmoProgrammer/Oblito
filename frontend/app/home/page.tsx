'use client';

import ProductCard from "@/components/ProductCard";
import { use, useEffect, useState,useMemo } from "react";
import {  allProducts} from "../data/products";

export default function HomePage() {
    const [user, setUser] = useState<string | null>(null);
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
        fetchUser();
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
                 {allProducts.map((product) => (
                   <ProductCard key={product.id} product={product} />
                 ))}
               </div>
        </div>
    );
}