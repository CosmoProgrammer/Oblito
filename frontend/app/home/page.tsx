'use client';

import ProductCard from "@/components/ProductCard";
import { use, useEffect, useState } from "react";
import { ProductProps } from "@/types/ProductProps";


export default function HomePage() {
    const [user, setUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch(`http://localhost:8000/auth/user`, {
                    credentials: 'include',
                    method: 'GET',
                });
                if(res.ok){
                    const data = await res.json();
                    setUser(data.user.email);
                }
            } catch (err) {
                console.error('Error fetching user:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, []);


    const featuredProducts: ProductProps[] = [
  { 
    id: "1", 
    name: "Smart Speaker", 
    description: "Voice-controlled smart speaker with Alexa. Plays music, answers questions, and more.", 
    price: 49.99, 
    imageUrl: "https://placehold.co/600x400/232f3e/ffffff?text=Speaker",
    rating: 4.7
  },
  { 
    id: "2", 
    name: "Wireless Earbuds", 
    description: "True wireless earbuds with active noise cancellation and 24-hour battery life.", 
    price: 129.50, 
    imageUrl: "https://placehold.co/600x400/ffffff/000000?text=Earbuds",
    rating: 4.5
  },
  { 
    id: "3", 
    name: "4K Streaming Stick", 
    description: "Stream in brilliant 4K, HDR, and Dolby Vision. Includes remote.", 
    price: 39.99, 
    imageUrl: "https://placehold.co/600x400/00aae4/ffffff?text=Streaming",
    rating: 4.8
  },
  { 
    id: "4", 
    name: "E-Reader Tablet", 
    description: "A high-resolution display that reads like real paper, even in bright sunlight.", 
    price: 139.99, 
    imageUrl: "https://placehold.co/600x400/f8f8f8/000000?text=E-Reader",
    rating: 4.9
  }
];

const bookDeals: ProductProps[] = [
  { 
    id: "5", 
    name: "The Midnight Library", 
    description: "A novel by Matt Haig, a dazzling story about all the choices that go into a life well-lived.", 
    price: 14.99, 
    imageUrl: "https://placehold.co/600x400/0a3d62/ffffff?text=Book+1",
    rating: 4.6
  },
  { 
    id: "6", 
    name: "Atomic Habits", 
    description: "An easy & proven way to build good habits & break bad ones. By James Clear.", 
    price: 12.50, 
    imageUrl: "https://placehold.co/600x400/f0932b/ffffff?text=Book+2",
    rating: 4.8
  },
  { 
    id: "7", 
    name: "Project Hail Mary", 
    description: "A lone astronaut must save the earth from disaster in this sci-fi thriller.", 
    price: 17.99, 
    imageUrl: "https://placehold.co/600x400/1e3799/ffffff?text=Book+3",
    rating: 4.7
  },
  { 
    id: "8", 
    name: "Dune", 
    description: "The spice extends life. The spice expands consciousness. The spice is vital to space travel.", 
    price: 10.99, 
    imageUrl: "https://placehold.co/600x400/d35400/ffffff?text=Book+4",
    rating: 4.9
  }
];

function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.target.value;    
    setSearchQuery(query);

    if(query == ""){
        setAppliedSearch("");
    }
}

function handleAppliedSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); 
        setAppliedSearch(searchQuery);
    }

    const filteredProducts = featuredProducts.filter(product =>
        product.name.toLowerCase().startsWith(appliedSearch.toLowerCase())
    );
    const filteredBooks = bookDeals.filter(product =>
        product.name.toLowerCase().startsWith(appliedSearch.toLowerCase())
    );
    return (
        <div className="max-w-[1500px] mx-auto p-[20px] grow bg-[#FFE4C4] w-full">
            <h1>Home</h1>
            {loading ? (
                <p>Loading...</p>
            ) : user ? (
                <p>Welcome, {user}!</p>
            ) : (
                <p>You are not logged in.</p>
            )}

            <div className="grid grid-cols-4 gap-[24px] justify-items-center p-[20px]">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-[24px] justify-items-center p-[20px]">
            {filteredBooks.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

        </div>
    );
}