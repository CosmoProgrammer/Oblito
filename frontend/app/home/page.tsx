"use client";

import ProductCard from "@/components/ProductCard";
import { useEffect, useState } from "react";
import { setCategoryMap } from "@/app/utils/categoryMap";
import { useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Filter, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  imageURLs: string[];
  categoryId: string;
  creatorId: string;
  createdAt: string;
}

interface PaginationData {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface Category {
  id: string;
  name: string;
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 12,
  });
  const [loading, setLoading] = useState(true);

  // Get search and category filters from URL params
  const searchTerm = searchParams.get("search") || "";
  const categoriesParam = searchParams.get("categories") || "";
  const selectedCategories = categoriesParam ? categoriesParam.split(",") : [];

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`http://localhost:8000/auth/user`, {
          credentials: "include",
          method: "GET",
        });
        if (res.ok) {
          const data = await res.json();
          console.log("User fetched:", data);
          setUser(data.user.firstName);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    }

    async function fetchCategories() {
      try {
        const res = await fetch(`http://localhost:8000/categories`, {
          credentials: "include",
          method: "GET",
        });
        if (res.ok) {
          const data = await res.json();
          console.log("Categories fetched:", data);
          setCategories(data);
          setCategoryMap(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    
    fetchUser();
    fetchCategories();
    fetchProducts(1);
  }, []);

  // Refetch products when search params change
  useEffect(() => {
    fetchProducts(1);
  }, [searchTerm, categoriesParam]);

  async function fetchProducts(page: number = 1) {
    setLoading(true);
    try {
      let url = `http://localhost:8000/products?page=${page}&limit=${pagination.limit}`;

      // Add search parameter if exists
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      // Add category parameters if exist
      if (selectedCategories.length > 0) {
        selectedCategories.forEach((catId) => {
          url += `&categories=${encodeURIComponent(catId)}`;
        });
      }

      console.log("🌐 Fetching from:", url);

      const res = await fetch(url, {
        credentials: "include",
        method: "GET",
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setPagination(data.pagination);
        console.log("✅ Fetched products:", data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (page: number) => {
    fetchProducts(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPaginationItems = () => {
    const items = [];
    const { currentPage, totalPages } = pagination;
    const maxVisible = 5;

    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          className={
            currentPage === 1
              ? "pointer-events-none opacity-50"
              : "cursor-pointer hover:bg-gray-100 rounded-md"
          }
        />
      </PaginationItem>
    );

    // Calculate page range
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            className="cursor-pointer hover:bg-gray-100 rounded-md"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Middle pages
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink
            onClick={() => handlePageChange(page)}
            isActive={page === currentPage}
            className={`cursor-pointer rounded-md ${page === currentPage ? 'bg-[#febd69] text-black font-bold hover:bg-[#f5a623]' : 'hover:bg-gray-100'}`}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            className="cursor-pointer hover:bg-gray-100 rounded-md"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100 rounded-md"}
        />
      </PaginationItem>
    );

    return items;
  };

  // Get category names for display
  const getCategoryNames = (ids: string[]) => {
    if (!categories.length) return ids.join(", ");
    return ids.map(id => {
      const category = categories.find(cat => cat.id === id);
      return category ? category.name : id;
    }).join(", ");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Discover Products</h1>
          {user && <p className="text-gray-500 mt-1">Welcome back, {user}</p>}
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || selectedCategories.length > 0) && (
        <div className="mb-8 bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <Filter className="w-5 h-5 text-[#febd69] mt-0.5 flex-shrink-0" />
          <div className="flex-grow">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">Active Filters</h3>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Search: {searchTerm}
                </span>
              )}
              {selectedCategories.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Categories: {getCategoryNames(selectedCategories)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {loading && !products.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-[400px] animate-pulse shadow-sm border border-gray-100"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 text-center max-w-md">
                {searchTerm || selectedCategories.length > 0
                  ? "We couldn't find any products matching your filters. Try adjusting your search or categories."
                  : "No products are currently available."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-16">
          <Pagination>
            <PaginationContent>{renderPaginationItems()}</PaginationContent>
          </Pagination>
          <div className="text-center text-gray-500 text-sm mt-4">
            Showing page {pagination.currentPage} of {pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
}