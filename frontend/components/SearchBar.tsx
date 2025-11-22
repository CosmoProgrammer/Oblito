"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchCategories from './SearchCategories';
import { Search, ArrowRight, Loader2 } from 'lucide-react';

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
    onFilterChange?: (searchTerm: string, categories: string[], minPrice?: number, maxPrice?: number) => void; // Updated to send an array
}

const SearchBar: React.FC<SearchBarProps> = ({ categories, onFilterChange }) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
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
            onFilterChange(searchQuery, newCategories, minPrice, maxPrice);
        }

        // Navigate with query params - send category names directly
        navigateWithFilters(searchQuery, newCategories, minPrice, maxPrice);
    };

    const handleAppliedSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Call optional callback if provided
        if (onFilterChange) {
            onFilterChange(searchQuery, selectedCategoryNames, minPrice, maxPrice);
        }

        // Navigate with query params - send category names directly
        navigateWithFilters(searchQuery, selectedCategoryNames, minPrice, maxPrice);
        setShowQuickSearch(false);
    };

    const handleQuickSearchResult = (productId: string) => {
        // Navigate to product page
        router.push(`/product/${productId}`);
        setShowQuickSearch(false);
        setSearchQuery("");
    };

    const navigateWithFilters = (search: string, categoryNames: string[], minP?: number, maxP?: number) => {
        const params = new URLSearchParams();
        
        if (search.trim()) {
            params.set('search', search);
        }
        
        if (categoryNames.length > 0) {
            params.set('categories', categoryNames.join(','));
        }

        if (minP !== undefined) {
            params.set('minPrice', minP.toString());
        }

        if (maxP !== undefined) {
            params.set('maxPrice', maxP.toString());
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
            className="relative w-full group z-30" 
            ref={searchBoxRef}
        >
            <form 
                className="relative flex items-center w-full"
                onSubmit={handleAppliedSearch}
            >
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search for products..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.trim().length > 1 && setShowQuickSearch(true)}
                        className="block w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent text-gray-900 placeholder-gray-500 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-400/50 rounded-l-2xl transition-all duration-200 text-sm font-medium"
                    />
                </div>

                {/* Categories Dropdown */}
                <div className="h-full">
                    <SearchCategories 
                        categories={getCategoryNames()} 
                        selectedCategories={selectedCategoryNames} 
                        onCategoryChange={handleCategoryChange} 
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        onMinPriceChange={setMinPrice}
                        onMaxPriceChange={setMaxPrice}
                    />
                </div>

                <button 
                    type="submit"
                    className="h-full bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-r-xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
            </form>

            {/* Quick Search Dropdown */}
            {showQuickSearch && quickSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-40">
                    {searchLoading && (
                        <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                        </div>
                    )}
                    {!searchLoading && (
                        <div className="py-2">
                            <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Suggestions</p>
                            {quickSearchResults.map((result) => (
                                <div
                                    key={result.id}
                                    onClick={() => handleQuickSearchResult(result.id)}
                                    className="flex gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors items-center"
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                        {result.imageURLs && result.imageURLs[0] ? (
                                            <img 
                                                src={result.imageURLs[0]} 
                                                alt={result.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Search className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {result.name}
                                        </p>
                                        <p className="text-xs text-gray-600 font-bold">
                                            ${result.price}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;

