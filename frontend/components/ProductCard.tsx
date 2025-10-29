import type { ProductProps } from "../types/ProductProps";
import './ProductCard.css';

interface ProductCardProps {
  product: ProductProps;
}

export default function ProductCard({ product}: ProductCardProps) {
    const { name, description, price, imageUrl,rating } = product;

    return (
        <div className="product-card-wrapper">
        <div className="product-card">
            <img src={imageUrl} alt={name} className="product-image" />
            <h3 className="product-name">{name}</h3>
            <p className="product-description">{description}</p>
            <p className="product-rating">Rating: {rating}</p>
            <p className="product-price">${price.toFixed(2)}</p>
             <div className="product-card-button">
            <button className="btn btn-primary">Add to Cart</button>
        </div>
        </div>
       
        </div>
    );
}



