import { getProductById } from '@/app/data/products'; // Adjust path if needed
import Image from 'next/image';
import { notFound } from 'next/navigation';
//import { useRouter } from 'next/router';

// 1. Add the 'async' keyword here
export default async function ProductPage({params}: any) {
  
    const {id} = await params;
    console.log('Product ID from URL:', id);    
  // 3. Find the product data using that ID
  // (Removed the String() conversion as the log showed 'id' is already a string)
  const product =  getProductById(id);

  // 4. If no product is found, show a 404 page
  if (!product) {
    notFound();
  }

  // 5. If found, render the product details
  return (
    <div className="product-detail-container" style={{ padding: '40px', maxWidth: '1000px', margin: 'auto' }}>
      <h1>{product.name}</h1>
      <img 
        src={product.imageUrl} 
        alt={product.name} 
        width={600} 
        height={400} 
        style={{ borderRadius: '8px' }}
      />
      <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>{product.description}</p>
      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${product.price.toFixed(2)}</div>
      <p>Rating: {product.rating} / 5</p>
      <p>Category: {product.category}</p>
      <button style={{ padding: '10px 20px', fontSize: '1rem', background: '#febd69', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Add to Cart
      </button>
    </div>
  );
}

