"use client";

import ProductCard from "@/components/ProductCard";
import { useEffect, useState } from "react";
import { setCategoryMap } from "@/app/utils/categoryMap";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string; // This is a string, like "12.99"
  stockQuantity: string; // This is also a string
  imageURLs: string[]; // This is an array of strings
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

export default function HomePage() {
  const [user, setUser] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 12,
  });
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
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
          // Store the category map for global use
          setCategoryMap(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    fetchProducts(1);
    fetchCategories();
  }, []);

  async function fetchProducts(page: number = 1) {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8000/products?page=${page}&limit=${pagination.limit}`,
          {
            credentials: "include",
            method: "GET",
          }
        );
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products);
          setPagination(data.pagination);
          console.log("Fetched products:", data);
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
              : "cursor-pointer"
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
            className="cursor-pointer"
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
            className="cursor-pointer"
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
            className="cursor-pointer"
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
          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );

    return items;
  };

  return (
    <div className="max-w-[1500px] mx-auto p-[20px] grow bg-[#FFE4C4] w-full">
      <h1>Home</h1>
      {loading && !products.length ? (
        <p>Loading...</p>
      ) : user ? (
        <p>Welcome, {user}!</p>
      ) : (
        <p>You are not logged in.</p>
      )}

      <div className="grid grid-cols-4 gap-[24px] justify-items-center p-[20px]">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>{renderPaginationItems()}</PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Pagination Info */}
      <div className="text-center text-gray-600 mt-4">
        Showing page {pagination.currentPage} of {pagination.totalPages} (
        {pagination.totalCount} total products)
      </div>
    </div>
  );
}