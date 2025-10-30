import React, { useState } from 'react';
import '@/app/home/home.css';

interface NavbarProps {
    user: string | null;
    onSearch?: (searchTerm: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onSearch }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value;    
        setSearchQuery(query);

        if(query === "") {
            onSearch && onSearch("");
        }
    };

    const handleAppliedSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSearch && onSearch(searchQuery);
    };

    return (
        <nav className="main-nav">
            <div className="nav-logo">Oblito</div>
            <form className="nav-search" onSubmit={handleAppliedSearch}>
                <input 
                    type="text" 
                    placeholder="Search Oblito..." 
                    value={searchQuery} 
                    onChange={handleSearchChange} 
                />
                <button type="submit">🔍</button>
            </form>

            <div className="nav-links">
                <a href="#">Hello, {user}</a>
                <a href="#">Returns & Orders</a>
                <a href="#">Cart</a>
            </div>
        </nav>
    );
};

export default Navbar;