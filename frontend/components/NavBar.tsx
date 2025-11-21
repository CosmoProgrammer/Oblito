"use client";

import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import Link from 'next/link';
import { User, Package, ShoppingCart, Menu } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

const Navbar = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 gap-8">
                    
                    {/* Logo */}
                    <Link href="/home" className="flex-shrink-0 flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md group-hover:bg-gray-700 transition-colors duration-300">
                            <span className="text-white group-hover:text-gray-200 font-bold text-xl">O</span>
                        </div>
                        <span className="text-2xl font-extrabold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors">Oblito</span>
                    </Link>
                    
                    {/* Search Bar */}
                    <div className="hidden md:block flex-1 max-w-2xl">
                         {categories.length > 0 && (
                            <SearchBar 
                                onFilterChange={onFilterChange} 
                                categories={categories}
                            />
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/profile" className="flex flex-col items-center group">
                            <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                                <User className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-900 uppercase tracking-wide">Profile</span>
                        </Link>
                        
                        <Link href="/returns-and-orders" className="flex flex-col items-center group">
                            <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                                <Package className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-900 uppercase tracking-wide">Orders</span>
                        </Link>
                        
                        <Link href="/cart" className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95">
                            <ShoppingCart className="w-5 h-5" />
                            <span className="font-bold text-sm">Cart</span>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-5">
                        <div className="px-2">
                            {categories.length > 0 && (
                                <SearchBar 
                                    categories={categories}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 px-2">
                            <Link href="/profile" className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                                <User className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">Profile</span>
                            </Link>
                            <Link href="/returns-and-orders" className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                                <Package className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">Orders</span>
                            </Link>
                            <Link href="/cart" className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                                <ShoppingCart className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">Cart</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;