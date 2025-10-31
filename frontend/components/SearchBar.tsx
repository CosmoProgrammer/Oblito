"use client";

import React, { useState } from 'react';
import SearchCategories from './SearchCategories';

// Define the props for the SearchBar
interface SearchBarProps {
    categories: string[]; // A list of categories to show
    onFilterChange: (searchTerm: string, categories: string[]) => void; // Updated to send an array
}

const SearchBar: React.FC<SearchBarProps> = ({ categories, onFilterChange }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value;    
        setSearchQuery(query);

        if(query === "") {
            onFilterChange("", selectedCategories);
        }
    };

    const handleCategoryChange = (category: string) => {
        const newCategories = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category)
            : [...selectedCategories, category];
        
        setSelectedCategories(newCategories);
        onFilterChange(searchQuery, newCategories);
    };

    const handleAppliedSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onFilterChange(searchQuery, selectedCategories);
    };

    return (
        <form 
            className="grow flex items-center max-w-5xl mx-4" 
            onSubmit={handleAppliedSearch}
        >
            <input 
                type="text" 
                placeholder="Search Oblito..." 
                value={searchQuery} 
                onChange={handleSearchChange}
                className="w-full p-2.5 text-base border-none rounded-l-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#febd69]"
            />
            <button 
                type="submit"
                className="bg-[#febd69] hover:bg-[#f3a847] px-4 py-2.5 rounded-r-md border-none cursor-pointer transition-colors"
            >
                🔍
            </button>

            <div className="ml-3">
                <SearchCategories 
                    categories={categories} 
                    selectedCategories={selectedCategories} 
                    onCategoryChange={handleCategoryChange} 
                />
            </div>
        </form>
    );
};

export default SearchBar;

