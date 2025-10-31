import React, { useState } from 'react';
import SearchBar from './SearchBar';

const Navbar = () => {
        const categories=['Electronics', 'Books', 'Clothing', 'Home', 'Toys']
    const onFilterChange = (searchTerm: string, categories: string[]) => {
        // Handle filter change logic here
        console.log('Search Term:', searchTerm);
        console.log('Selected Categories:', categories);
    }

    const [user, setUser] = useState<string>('');

    
    return (
        <nav className="main-nav">
            <div className="nav-logo">Oblito</div>
            
            <SearchBar 
            onFilterChange={onFilterChange} 
            categories={categories} />

            <div className="flex gap-5">
                <a href="#" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded">
                    Hello, {user}
                </a>
                <a href="#" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded">
                    Returns & Orders
                </a>
                <a href="#" className="text-sm font-medium hover:outline hover:outline-[#febd69] hover:rounded">
                    Cart
                </a>
            </div>
        </nav>
    );
};

export default Navbar;