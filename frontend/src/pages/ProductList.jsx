import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from 'lucide-react';
import axios from 'axios';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import styles from './ProductList.module.css';
import API_BASE_URL from '../config';

// hero banner slides — rotates every 5s
const HERO_SLIDES = [
  {
    title: 'Mega Home Sale',
    subtitle: 'Drying racks',
    price: 'Starting ₹999',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://m.media-amazon.com/images/I/611Xiu-OsEL._AC_SL1500_.jpg',
  },
  {
    title: 'Electronics Fest',
    subtitle: 'Top Headphones',
    price: 'Up to 60% off',
    bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Fashion Deals',
    subtitle: 'Trending Styles',
    price: 'Starting ₹499',
    bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Best Sellers in Books',
    subtitle: 'Top Reads',
    price: 'Under ₹500',
    bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
  },
];

const SORT_OPTIONS = [
  { label: 'Featured', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name: A to Z', value: 'name_asc' },
  { label: 'Name: Z to A', value: 'name_desc' },
];

const LIMIT = 12;

const ProductList = () => {
  // state for products, filters, and loading
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const location = useLocation();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  // scroll to category section if url has a hash
  useEffect(() => {
    if (location.hash && !loading && categories.length > 0) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          const yOffset = -120;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash, loading, categories]);

  // Reset page when search query or sort changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  // fetch products from api with current filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (sortBy) {
          const [field, order] = sortBy.split('_');
          params.append('sortBy', field);
          params.append('sortOrder', order);
        }
        params.append('page', page);
        params.append('limit', LIMIT);

        const response = await axios.get(`${API_BASE_URL}/api/products?${params.toString()}`);
        const { products: fetchedProducts, pagination: pag } = response.data;

        setProducts(fetchedProducts);
        setPagination(pag);

        // group products by category for homepage grid
        const categoryMap = {};
        fetchedProducts.forEach((product) => {
          const catName = product.category?.name || 'Other';
          if (!categoryMap[catName]) categoryMap[catName] = [];
          categoryMap[catName].push(product);
        });
        setCategories(Object.entries(categoryMap));
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchQuery, sortBy, page]);

  // Auto-rotate hero
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => setHeroIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const nextSlide = () => setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  // search results mode — different layout than homepage
  if (searchQuery) {
    return (
      <div className={styles.searchSection}>
        <div className={styles.searchHeader}>
          <h2 className={styles.searchTitle}>Results for "{searchQuery}"</h2>
          <div className={styles.searchControls}>
            <span className={styles.resultCount}>
              {pagination.totalCount} result{pagination.totalCount !== 1 ? 's' : ''}
            </span>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className={styles.noResults}>
            <p>No products found for "{searchQuery}".</p>
            <Link to="/" className={styles.backHomeBtn}>Browse all products</Link>
          </div>
        ) : (
          <>
            <div className={styles.searchGrid}>
              {products.map((product) => (
                <div key={product.id} className={styles.searchCard}>
                  <div
                    className={styles.wishlistIcon}
                    onClick={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product.id)}
                  >
                    <Heart
                      size={20}
                      color={isInWishlist(product.id) ? '#e77600' : '#a6a6a6'}
                      fill={isInWishlist(product.id) ? '#e77600' : 'none'}
                    />
                  </div>
                  <Link to={`/product/${product.id}`} className={styles.searchCardImageContainer}>
                    <img
                      src={product.images[0]?.url || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      className={styles.searchCardImage}
                    />
                  </Link>
                  <Link to={`/product/${product.id}`} className={styles.searchCardBody}>
                    <div className={styles.searchCardName}>{product.name}</div>
                    <div className={styles.searchCardPrice}>
                      <span className={styles.searchCardPriceCurrency}>₹</span>
                      {product.price.toLocaleString('en-IN')}
                    </div>
                  </Link>
                  <button
                    className={styles.cardAddToCartBtn}
                    onClick={(e) => { e.preventDefault(); addToCart(product.id, 1); }}
                  >
                    <ShoppingCart size={14} />
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Homepage mode ──
  const slide = HERO_SLIDES[heroIndex];

  return (
    <>
      {/* Hero Carousel */}
      <div className={styles.heroSection}>
        <div className={styles.heroSlide} style={{ background: slide.bg }}>
          <div className={styles.heroContent}>
            <div className={styles.heroTitle}>{slide.title}</div>
            <div className={styles.heroSubtitle}>{slide.subtitle}</div>
            <div className={styles.heroPrice}>{slide.price}</div>
          </div>
          <img src={slide.image} alt={slide.title} className={styles.heroImage} />
        </div>
        <button className={`${styles.heroArrow} ${styles.heroArrowLeft}`} onClick={prevSlide} aria-label="Previous slide">
          <ChevronLeft size={40} />
        </button>
        <button className={`${styles.heroArrow} ${styles.heroArrowRight}`} onClick={nextSlide} aria-label="Next slide">
          <ChevronRight size={40} />
        </button>
        <div className={styles.gradientFade}></div>
      </div>

      {/* category cards + horizontal product rows */}
      <div className={styles.categorySections}>
        <div className={styles.categoryCardsRow}>
          {categories.map(([catName, catProducts]) => (
            <div key={catName} className={styles.categoryCard}>
              <h2 className={styles.categoryCardTitle}>{catName}</h2>
              <div className={styles.categoryCardGrid}>
                {/* show max 4 products per category card */}
                {catProducts.slice(0, 4).map((product) => (
                  <Link to={`/product/${product.id}`} key={product.id} className={styles.categoryCardItem}>
                    <img
                      src={product.images[0]?.url || 'https://via.placeholder.com/120'}
                      alt={product.name}
                      className={styles.categoryCardImage}
                    />
                    <span className={styles.categoryCardLabel}>
                      {product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}
                    </span>
                  </Link>
                ))}
              </div>
              <span className={styles.categoryCardSeeMore}>See more</span>
            </div>
          ))}
        </div>

        {/* Horizontal Product Rows by Category */}
        {categories.map(([catName, catProducts]) => (
          <div
            key={catName}
            id={`category-${catName.replace(/&/g, 'and').replace(/\s+/g, '-').toLowerCase()}`}
            className={styles.productRowSection}
          >
            <div className={styles.productRowHeader}>
              <h2 className={styles.productRowTitle}>Best Sellers in {catName}</h2>
              <span className={styles.productRowSeeAll}>See all deals</span>
            </div>
            <div className={styles.productRow}>
              {catProducts.map((product) => (
                <div key={product.id} className={styles.productRowItem}>
                  <Link to={`/product/${product.id}`} className={styles.productRowItemLink}>
                    <img
                      src={product.images[0]?.url || 'https://via.placeholder.com/190'}
                      alt={product.name}
                      className={styles.productRowItemImage}
                    />
                    <div className={styles.productRowItemName}>{product.name}</div>
                    <div className={styles.productRowItemRating}>★★★★☆</div>
                    <div className={styles.productRowItemPrice}>
                      <span className={styles.productRowItemPriceCurrency}>₹</span>
                      {product.price.toLocaleString('en-IN')}
                    </div>
                  </Link>
                  <button
                    className={styles.cardAddToCartBtn}
                    onClick={() => addToCart(product.id, 1)}
                  >
                    <ShoppingCart size={14} />
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductList;
