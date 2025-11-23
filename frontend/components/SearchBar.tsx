"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchCategories from './SearchCategories';
import { Search, ArrowRight, Loader2, Sparkles } from 'lucide-react';

// Define the props for the SearchBar
interface Category {
    id: string;
    name: string;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'customer' | 'retailer' | 'wholesaler';
}

interface QuickSearchResult {
    id: string;
    name: string;
    price: string;
    imageURLs?: string[];
}

interface SearchBarProps {
    categories: Category[] | string[];
    user: User | null;
    onFilterChange?: (searchTerm: string, categories: string[], minPrice?: number, maxPrice?: number) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ categories, user, onFilterChange }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
    const [quickSearchResults, setQuickSearchResults] = useState<QuickSearchResult[]>([]);
    const [showQuickSearch, setShowQuickSearch] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchBoxRef = useRef<HTMLDivElement>(null);

    const isRecommendedActive = searchParams.get('recommended') === 'true';

    const API_BASE_URL = "http://localhost:8000";

    // Effect to sync state with URL params
    useEffect(() => {
        const searchTermFromUrl = searchParams.get('search') || '';
        const categoriesFromUrl = searchParams.get('categories')?.split(',') || [];
        const minPriceFromUrl = searchParams.get('minPrice');
        const maxPriceFromUrl = searchParams.get('maxPrice');

        setSearchQuery(searchTermFromUrl);
        setSelectedCategoryNames(categoriesFromUrl);
        setMinPrice(minPriceFromUrl ? Number(minPriceFromUrl) : undefined);
        setMaxPrice(maxPriceFromUrl ? Number(maxPriceFromUrl) : undefined);

        // If recommended is active, clear other filters
        if (isRecommendedActive) {
            setSearchQuery('');
            setSelectedCategoryNames([]);
            setMinPrice(undefined);
            setMaxPrice(undefined);
        }

    }, [searchParams, isRecommendedActive]);


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
            const res = await fetch(`${API_BASE_URL}/products/quick-search/${encodeURIComponent(query)}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) {
                const results = Array.isArray(data) ? data : data.products || [];
                setQuickSearchResults(results.slice(0, 5));
                setShowQuickSearch(results.length > 0);
            }
        } catch (err) {
            console.error("Error in quick search:", err);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleCategoryChange = (categoryName: string) => {
        const newCategories = selectedCategoryNames.includes(categoryName)
            ? selectedCategoryNames.filter(c => c !== categoryName)
            : [...selectedCategoryNames, categoryName];
        
        setSelectedCategoryNames(newCategories);
        navigateWithFilters(searchQuery, newCategories, minPrice, maxPrice);
    };

    const handlePriceChange = (minP?: number, maxP?: number) => {
        setMinPrice(minP);
        setMaxPrice(maxP);
        navigateWithFilters(searchQuery, selectedCategoryNames, minP, maxP);
    }

    const handleAppliedSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigateWithFilters(searchQuery, selectedCategoryNames, minPrice, maxPrice);
        setShowQuickSearch(false);
    };
    
    const handleRecommendedClick = () => {
        if (isRecommendedActive) {
            router.push('/home'); // Turn off recommendations
        } else {
            router.push('/home?recommended=true'); // Turn on recommendations
        }
    };

    const handleQuickSearchResult = (productId: string) => {
        router.push(`/product/${productId}`);
        setShowQuickSearch(false);
        setSearchQuery("");
    };

    const navigateWithFilters = (search: string, categoryNames: string[], minP?: number, maxP?: number) => {
        const params = new URLSearchParams();
        
        if (search.trim()) params.set('search', search);
        if (categoryNames.length > 0) params.set('categories', categoryNames.join(','));
        if (minP !== undefined) params.set('minPrice', minP.toString());
        if (maxP !== undefined) params.set('maxPrice', maxP.toString());
        // `recommended` param is implicitly removed because it's not added here

        const queryString = params.toString();
        const url = queryString ? `/home?${queryString}` : '/home';
        
        router.push(url);
    };

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
                        onMinPriceChange={(p) => handlePriceChange(p, maxPrice)}
                        onMaxPriceChange={(p) => handlePriceChange(minPrice, p)}
                    />
                </div>
                
                {/* Recommended Button */}
                {user && (
                    <button
                        type="button"
                        onClick={handleRecommendedClick}
                        className={`h-full p-3 transition-all flex items-center gap-2 text-sm font-semibold rounded-none border-y border-l border-gray-200 ${
                            isRecommendedActive 
                                ? 'bg-yellow-400/20 text-yellow-800 ring-1 ring-inset ring-yellow-400/50' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                        <Sparkles className={`w-4 h-4 ${isRecommendedActive ? 'text-yellow-600' : 'text-gray-500'}`} />
                        Recommended
                    </button>
                )}

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
