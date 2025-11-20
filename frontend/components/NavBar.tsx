"use client";

import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
}

const Navbar = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch categories from backend
        async function fetchCategories() {
            try {
                const res = await fetch('http://localhost:8000/categories', {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                    console.log("Categories loaded:", data);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchCategories();
    }, []);

    const onFilterChange = (searchTerm: string, categories: string[]) => {
        // Handle filter change logic here
        console.log('Search Term:', searchTerm);
        console.log('Selected Categories:', categories);
    }

    const [user, setUser] = useState<string>('');

    return (
        <nav className="bg-[#131921] text-white px-3 py-2.5 flex items-center justify-between w-full">

            <Link href="/home">
            <div className="text-2xl font-bold text-[#febd69] ml-2">Oblito</div>
            </Link>
            
            {categories.length > 0 && (
                <SearchBar 
                    onFilterChange={onFilterChange} 
                    categories={categories}
                />
            )}

            <div className="flex gap-3 mr-10">
                <Link href="/profile" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded px-2 py-1 whitespace-nowrap">
                    My Profile
                </Link>
                <Link href="/returns-and-orders" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded px-2 py-1 whitespace-nowrap">
                    Returns & Orders
                </Link>
                <Link href="/cart" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded px-2 py-1 whitespace-nowrap">
                    Cart 
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;