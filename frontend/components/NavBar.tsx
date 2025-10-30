import React, { useState } from 'react';

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
        <nav className="bg-[#131921] text-white px-5 py-2.5 flex items-center gap-5">
            <div className="text-2xl font-bold text-[#febd69]">Oblito</div>
            <form className="grow flex" onSubmit={handleAppliedSearch}>
                <input 
                    type="text" 
                    placeholder="Search Oblito..." 
                    value={searchQuery} 
                    onChange={handleSearchChange}
                    className="w-full p-2.5 text-base border-none rounded-l-md text-black bg-white"
                />
                <button type="submit" className="bg-[#febd69] border-none px-4 cursor-pointer rounded-r-md text-xl">
                    🔍
                </button>
            </form>

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