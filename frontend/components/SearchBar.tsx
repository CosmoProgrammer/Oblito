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
            // If the search box is cleared, immediately trigger filter change
            onFilterChange("", selectedCategories);
        }
    };

    const handleCategoryChange = (category: string) => {
        // Create a new array based on whether the category is already selected
        const newCategories = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category) // Remove category
            : [...selectedCategories, category]; // Add category
        
        setSelectedCategories(newCategories);
        // Immediately trigger a filter change when a checkbox is toggled
        onFilterChange(searchQuery, newCategories);
    };

    const handleAppliedSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Trigger the filter change with the current query and categories
        onFilterChange(searchQuery, selectedCategories);
    };

    return (
        <form className="nav-search" onSubmit={handleAppliedSearch}>
            
            <SearchCategories 
                categories={categories} 
                selectedCategories={selectedCategories} 
                onCategoryChange={handleCategoryChange} 
            />

            <input 
                type="text" 
                placeholder="Search Oblito..." 
                value={searchQuery} 
                onChange={handleSearchChange} 
            />
            <button type="submit">🔍</button>
        </form>
    );
};

export default SearchBar;

