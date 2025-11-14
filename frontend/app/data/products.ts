import { ProductProps } from "@/types/ProductProps";    

    const featuredProducts: ProductProps[] = [
  { 
    id: "1", 
    name: "Smart Speaker", 
    description: "Voice-controlled smart speaker with Alexa. Plays music, answers questions, and more.", 
    price: 49.99, 
    imageUrl: "https://placehold.co/600x400/232f3e/ffffff?text=Speaker",
    rating: 4.7,
    category: "Electronics"
  },
  { 
    id: "2", 
    name: "Wireless Earbuds", 
    description: "True wireless earbuds with active noise cancellation and 24-hour battery life.", 
    price: 129.50, 
    imageUrl: "https://placehold.co/600x400/ffffff/000000?text=Earbuds",
    rating: 4.5,
    category: "Electronics"
  },
  { 
    id: "3", 
    name: "4K Streaming Stick", 
    description: "Stream in brilliant 4K, HDR, and Dolby Vision. Includes remote.", 
    price: 39.99, 
    imageUrl: "https://placehold.co/600x400/00aae4/ffffff?text=Streaming",
    rating: 4.8,
    category: "Electronics"
  },
  { 
    id: "4", 
    name: "E-Reader Tablet", 
    description: "A high-resolution display that reads like real paper, even in bright sunlight.", 
    price: 139.99, 
    imageUrl: "https://placehold.co/600x400/f8f8f8/000000?text=E-Reader",
    rating: 4.9,
    category: "Electronics"
  }
];

const bookDeals: ProductProps[] = [
  { 
    id: "5", 
    name: "The Midnight Library", 
    description: "A novel by Matt Haig, a dazzling story about all the choices that go into a life well-lived.", 
    price: 14.99, 
    imageUrl: "https://placehold.co/600x400/0a3d62/ffffff?text=Book+1",
    rating: 4.6,
    category: "Books"
  },
  { 
    id: "6", 
    name: "Atomic Habits", 
    description: "An easy & proven way to build good habits & break bad ones. By James Clear.", 
    price: 12.50, 
    imageUrl: "https://placehold.co/600x400/f0932b/ffffff?text=Book+2",
    rating: 4.8,
    category: "Books"
  },
  { 
    id: "7", 
    name: "Project Hail Mary", 
    description: "A lone astronaut must save the earth from disaster in this sci-fi thriller.", 
    price: 17.99, 
    imageUrl: "https://placehold.co/600x400/1e3799/ffffff?text=Book+3",
    rating: 4.7,
    category: "Books"
  },
  { 
    id: "8", 
    name: "Dune", 
    description: "The spice extends life. The spice expands consciousness. The spice is vital to space travel.", 
    price: 10.99, 
    imageUrl: "https://placehold.co/600x400/d35400/ffffff?text=Book+4",
    rating: 4.9,
    category: "Books"
  }
];

export const allProducts: ProductProps[] = [...featuredProducts, ...bookDeals];

// A helper function to find a product by its ID
export function getProductById(id: string): ProductProps | undefined {
  return allProducts.find(product => product.id === id);
}