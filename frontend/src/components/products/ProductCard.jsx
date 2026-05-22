import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import styles from './ProductCard.module.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/200';

  return (
    <div className={styles.card}>
      <Link to={`/product/${product.id}`} className={styles.imageContainer}>
        <img src={imageUrl} alt={product.name} className={styles.image} />
      </Link>
      
      <Link to={`/product/${product.id}`} className={styles.title}>
        {product.name}
      </Link>

      <div className={styles.rating}>
        <span className={styles.stars}>★★★★☆</span>
        <span>4.2</span>
      </div>
      
      <div className={styles.priceContainer}>
        <span className={styles.currency}>₹</span>
        <span className={styles.price}>{product.price.toLocaleString('en-IN')}</span>
      </div>

      <button 
        className={styles.addToCartBtn}
        onClick={() => addToCart(product, 1)}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
