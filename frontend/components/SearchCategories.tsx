"use client";

import React, { useEffect, useState, useRef } from 'react';

interface SearchCategoriesProps {
    categories: string[];
    selectedCategories: string[];
    onCategoryChange: (category:string) => void;
}

const SearchCategories: React.FC<SearchCategoriesProps> = ({ categories, selectedCategories, onCategoryChange }) => { 
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={searchBoxRef}>
            {/* Toggle button */}
            <button 
                type="button" 
                className="w-32 h-10 bg-gray-100 text-gray-700 border-r border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#febd69] rounded-l-md rounded-r-md flex items-center justify-center gap-1"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                Categories ▾
            </button>
            
            {/* Dropdown menu */}
            {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    {categories.map((category) => (
                        <div 
                            key={category} 
                            className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                            <input 
                                type="checkbox" 
                                id={`category-${category}`}
                                value={category}
                                checked={selectedCategories.includes(category)}
                                onChange={() => onCategoryChange(category)}
                                className="h-4 w-4 text-[#febd69] rounded border-gray-300 focus:ring-[#febd69]"
                            />
                            <label 
                                htmlFor={`category-${category}`}
                                className="ml-2 text-sm text-gray-700 cursor-pointer"
                            >
                                {category}
                            </label>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SearchCategories;