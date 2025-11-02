import React, { useState } from 'react';
import SearchBar from './SearchBar';
import Link from 'next/link';

const Navbar = () => {
    const categories=['Electronics', 'Books', 'Clothing', 'Home', 'Toys']
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
            
            <SearchBar 
                onFilterChange={onFilterChange} 
                categories={categories} 
            />

            <div className="flex gap-3 mr-10">
                <a href="#" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded mr-1">
                    Hello, {user}
                </a>
                <a href="#" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded mr-1">
                    Returns & Orders
                </a>
                <a href="/cart" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded">
                    Cart
                </a>
            </div>
        </nav>
    );
};

export default Navbar;