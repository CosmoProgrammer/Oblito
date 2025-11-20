"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Filter, Check } from 'lucide-react';

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
        <div className="relative h-full" ref={searchBoxRef}>
            {/* Toggle button */}
            <button 
                type="button" 
                className={`h-full px-4 border-l border-gray-200 text-sm font-medium flex items-center gap-2 rounded-none transition-colors ${
                    isDropdownOpen || selectedCategories.length > 0 
                        ? "bg-gray-200 text-gray-900" 
                        : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Filter</span>
                {selectedCategories.length > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 bg-gray-700 text-white text-[10px] font-bold rounded-full ml-1">
                        {selectedCategories.length}
                    </span>
                )}
            </button>
            
            {/* Dropdown menu */}
            {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categories</p>
                        {selectedCategories.length > 0 && (
                            <span className="text-xs text-gray-700 font-bold">
                                {selectedCategories.length} selected
                            </span>
                        )}
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2 custom-scrollbar">
                        {categories.map((category) => {
                            const isSelected = selectedCategories.includes(category);
                            return (
                                <label 
                                    key={category} 
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                                        isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                            isSelected ? "bg-gray-700 border-gray-700" : "border-gray-300 bg-white"
                                        }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={`text-sm ${isSelected ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                            {category}
                                        </span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        value={category}
                                        checked={isSelected}
                                        onChange={() => onCategoryChange(category)}
                                        className="hidden"
                                    />
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchCategories;