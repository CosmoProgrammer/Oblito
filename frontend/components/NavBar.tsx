"use client"; // Required for useState and useEffect

import React, { useState, useEffect } from 'react'; // Import useEffect
import SearchBar from './SearchBar';
import Link from 'next/link';
import { Button } from "@/components/ui/button"; 

const Navbar = () => {
    const categories=['Electronics', 'Books', 'Clothing', 'Home', 'Toys']
    const onFilterChange = (searchTerm: string, categories: string[]) => {
        // Handle filter change logic here
        console.log('Search Term:', searchTerm);
        console.log('Selected Categories:', categories);
    }

    const [user, setUser] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch(`http://localhost:8000/auth/user`, {
                    credentials: "include", // Don't forget this!
                    method: "GET",
                });
                if (res.ok) {
                    const data = await res.json();
                    console.log("Navbar user fetched:", data);
                    setUser(data.user.firstName); 
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("Error fetching user:", err);
                setUser(null); 
            }
        }

        fetchUser();
    }, []); 
    
    const handleSignOut = async () => {
        console.log("Signing out (frontend only)");
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <nav className="bg-[#131921] text-white px-3 py-2.5 flex items-center justify-between w-full">

            <Link href="/home">
            <div className="text-2xl font-bold text-[#febd69] ml-2">Oblito</div>
            </Link>
            
            <SearchBar 
                onFilterChange={onFilterChange} 
                categories={categories} 
            />

            <div className="flex gap-1.5 items-center mr-2 mb-1.5">
                {user ? (
                    <span className="text-sm font-medium whitespace-nowrap mt-1.5">
                        Hello, {user}
                    </span>
                ) : (
                    // Replaced Link with D<a>
                    <a href="/login" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded p-1 whitespace-nowrap mt-1.5">
                        Hello, Sign In
                    </a>
                )}
                <Link href="/returns-and-orders" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded p-1 whitespace-nowrap mt-1.5">
                    Returns & Orders
                </Link>
                <Link href="/cart" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded whitespace-nowrap p-1 mt-1.5">
                    Cart 
                </Link>
                {user && (
                    <Button 
                        onClick={handleSignOut}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm h-8 px-3 py-1 mt-1"
                    >
                        Sign Out
                    </Button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;