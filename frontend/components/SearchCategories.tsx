"use client";

import React, { useState } from 'react';

interface SearchCategoriesProps {
    categories: string[];
    selectedCategories: string[];
    onCategoryChange: (category:string) => void;
}

const SearchCategories: React.FC<SearchCategoriesProps> = ({ categories, selectedCategories, onCategoryChange }) => { 
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="nav-search-category">
                {/* This button toggles the dropdown */}
                <button 
                    type="button" 
                    className="category-toggle-button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    Categories ▾
                </button>
                
                {/* This is the dropdown menu with checkboxes */}
                {isDropdownOpen && (
                    <div className="category-dropdown">
                        {categories.map((category) => (
                            <div key={category} className="category-item">
                                <input 
                                    type="checkbox" 
                                    id={`category-${category}`}
                                    value={category}
                                    checked={selectedCategories.includes(category)}
                                    onChange={() => onCategoryChange(category)} 
                                />
                                <label htmlFor={`category-${category}`}>{category}</label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
    );

}
export default SearchCategories;