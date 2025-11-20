"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchCategories from './SearchCategories';

// Define the props for the SearchBar
interface Category {
    id: string;
    name: string;
}

interface QuickSearchResult {
    id: string;
    name: string;
    price: string;
    imageURLs?: string[];
}

interface SearchBarProps {
    categories: Category[] | string[]; // A list of categories to show
    onFilterChange?: (searchTerm: string, categories: string[]) => void; // Updated to send an array
}

const SearchBar: React.FC<SearchBarProps> = ({ categories, onFilterChange }) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
    const [quickSearchResults, setQuickSearchResults] = useState<QuickSearchResult[]>([]);
    const [showQuickSearch, setShowQuickSearch] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchBoxRef = useRef<HTMLDivElement>(null);

    const API_BASE_URL = "http://localhost:8000";

    // Quick search as user types
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 1) {
                performQuickSearch(searchQuery);
            } else {
                setQuickSearchResults([]);
                setShowQuickSearch(false);
            }
        }, 300); // Debounce search

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close quick search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
                setShowQuickSearch(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const performQuickSearch = async (query: string) => {
        setSearchLoading(true);
        try {
            console.log("🔍 Quick search for:", query);
            const res = await fetch(`${API_BASE_URL}/products/quick-search/${encodeURIComponent(query)}`, {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            });

            const data = await res.json();
            console.log("Quick search results:", data);

            if (res.ok) {
                const results = Array.isArray(data) ? data : data.products || [];
                setQuickSearchResults(results.slice(0, 5)); // Show top 5 results
                setShowQuickSearch(results.length > 0);
            }
        } catch (err) {
            console.error("Error in quick search:", err);
            setQuickSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleCategoryChange = (categoryName: string) => {
        const newCategories = selectedCategoryNames.includes(categoryName)
            ? selectedCategoryNames.filter(c => c !== categoryName)
            : [...selectedCategoryNames, categoryName];
        
        setSelectedCategoryNames(newCategories);
        
        // Call optional callback if provided
        if (onFilterChange) {
            onFilterChange(searchQuery, newCategories);
        }

        // Navigate with query params - send category names directly
        navigateWithFilters(searchQuery, newCategories);
    };

    const handleAppliedSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Call optional callback if provided
        if (onFilterChange) {
            onFilterChange(searchQuery, selectedCategoryNames);
        }

        // Navigate with query params - send category names directly
        navigateWithFilters(searchQuery, selectedCategoryNames);
        setShowQuickSearch(false);
    };

    const handleQuickSearchResult = (productId: string) => {
        // Navigate to product page
        router.push(`/product/${productId}`);
        setShowQuickSearch(false);
        setSearchQuery("");
    };

    const navigateWithFilters = (search: string, categoryNames: string[]) => {
        const params = new URLSearchParams();
        
        if (search.trim()) {
            params.set('search', search);
        }
        
        if (categoryNames.length > 0) {
            params.set('categories', categoryNames.join(','));
        }

        const queryString = params.toString();
        const url = queryString ? `/home?${queryString}` : '/home';
        
        console.log("🔗 Navigating to:", url);
        router.push(url);
    };

    // Get category names for display
    const getCategoryNames = () => {
        return categories.map(cat => 
            typeof cat === 'object' ? cat.name : cat
        );
    };

    return (
        <div 
            className="grow flex items-center max-w-5xl mx-4 relative" 
            ref={searchBoxRef}
        >
            <form 
                className="w-full flex items-center relative"
                onSubmit={handleAppliedSearch}
            >
                <div className="w-full relative">
                    <input 
                        type="text" 
                        placeholder="Search Oblito..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.trim().length > 1 && setShowQuickSearch(true)}
                        className="w-full p-2.5 text-base border-none rounded-l-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#febd69]"
                    />

                    {/* Quick Search Dropdown */}
                    {showQuickSearch && quickSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-lg z-50 max-h-96 overflow-y-auto">
                            {searchLoading && (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    Searching...
                                </div>
                            )}
                            {!searchLoading && quickSearchResults.map((result) => (
                                <div
                                    key={result.id}
                                    onClick={() => handleQuickSearchResult(result.id)}
                                    className="flex gap-3 p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors"
                                >
                                    {result.imageURLs && result.imageURLs[0] && (
                                        <img 
                                            src={result.imageURLs[0]} 
                                            alt={result.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {result.name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            ${result.price}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    type="submit"
                    className="bg-[#febd69] hover:bg-[#f3a847] px-4 py-2.5 rounded-r-md border-none cursor-pointer transition-colors"
                >
                    🔍
                </button>
            </form>

            <div className="ml-3">
                <SearchCategories 
                    categories={getCategoryNames()} 
                    selectedCategories={selectedCategoryNames} 
                    onCategoryChange={handleCategoryChange} 
                />
            </div>
        </div>
    );
};

export default SearchBar;

