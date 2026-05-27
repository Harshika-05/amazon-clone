import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import styles from './ProductDetail.module.css';
import API_BASE_URL from '../config';

const PLACEHOLDER_IMG = 'https://via.placeholder.com/500';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  // product data + image gallery state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);

  // review state — rating, comment, hover effect
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  // load reviews + pre-fill if user already reviewed
  const fetchReviews = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reviews/${id}`);
      setReviews(res.data.reviews);
      setAvgRating(res.data.averageRating);
      setTotalReviews(res.data.totalReviews);

      // Pre-fill if user already reviewed
      if (user) {
        const existing = res.data.reviews.find(r => r.userId === user.id);
        if (existing) {
          setUserRating(existing.rating);
          setUserComment(existing.comment || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  }, [id, user]);

  // load product details + images
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/products/${id}`);
        setProduct(response.data);
        setActiveImage(response.data.images?.[0]?.url || PLACEHOLDER_IMG);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (id) fetchReviews();
  }, [id, fetchReviews]);

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (!product) return <div className={styles.notFound}>Product not found</div>;

  // fake mrp = 40% markup, then calculate discount %
  const price = product.price;
  const mrp = Math.round(price * 1.4);
  const discountPct = Math.round(((mrp - price) / mrp) * 100);
  const emi = Math.round(price / 12);
  const inStock = product.stock > 0;

  const formatINR = (n) => Number(n).toLocaleString('en-IN');

  // add selected quantity to cart
  const handleAddToCart = () => addToCart(product.id, quantity);
  const handleBuyNow = () => {
    addToCart(product.id, quantity);
    navigate('/cart');
  };

  // submit new review (1-5 stars + optional comment)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (userRating === 0) return setReviewMessage('Please select a star rating.');
    setReviewSubmitting(true);
    setReviewMessage('');
    try {
      await axios.post(`${API_BASE_URL}/api/reviews`, {
        productId: id,
        rating: userRating,
        comment: userComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewMessage('Review submitted successfully!');
      await fetchReviews();
    } catch (err) {
      setReviewMessage('Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // let user delete their own review
  const handleDeleteReview = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRating(0);
      setUserComment('');
      setReviewMessage('Review deleted.');
      await fetchReviews();
    } catch (err) {
      setReviewMessage('Failed to delete review.');
    }
  };

  // render filled/empty stars based on rating
  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  };

  return (
    <div className={styles.container}>
      <div className={styles.productRow}>
      {/* ════════ LEFT: Image Gallery ════════ */}
      <div className={styles.imageSection}>
        <div className={styles.thumbnails}>
          {product.images.map((img, idx) => (
            <img
              key={idx}
              src={img.url}
              alt={`Thumbnail ${idx + 1}`}
              className={`${styles.thumbnail} ${activeImage === img.url ? styles.thumbnailActive : ''}`}
              onMouseEnter={() => setActiveImage(img.url)}
            />
          ))}
        </div>
        <div className={styles.mainImageContainer}>
          <img src={activeImage} alt={product.name} className={styles.mainImage} />
        </div>
      </div>

      {/* ════════ MIDDLE: Product Info ════════ */}
      <div className={styles.infoSection}>
        {/* Title */}
        <h1 className={styles.title}>{product.name}</h1>

        {/* Category */}
        {product.category?.name && (
          <span className={styles.categoryBadge}>in {product.category.name}</span>
        )}

        {/* Ratings */}
        <div className={styles.ratingsRow}>
          <span className={styles.ratingValue}>{avgRating || '—'}</span>
          <span className={styles.stars}>{renderStars(avgRating)}</span>
          <span className={styles.ratingCount}>({totalReviews} ratings)</span>
        </div>

        <div className={styles.divider} />

        {/* Price */}
        <div className={styles.priceBlock}>
          <div className={styles.dealBadge}>Limited time deal</div>

          <div className={styles.priceRow}>
            <span className={styles.discount}>-{discountPct}%</span>
            <span>
              <span className={styles.priceSymbol}>₹</span>
              <span className={styles.priceAmount}>{formatINR(price)}</span>
            </span>
          </div>

          <div className={styles.mrpRow}>
            <span className={styles.mrpLabel}>M.R.P.: </span>
            <span className={styles.mrpValue}>₹{formatINR(mrp)}</span>
          </div>

          <div className={styles.taxInfo}>Inclusive of all taxes</div>
        </div>

        <div className={styles.divider} />

        {/* Offers */}
        <div>
          <p className={styles.offersHeading}>Offers</p>
          <div className={styles.offersRow}>
            {/* Card 1 */}
            <div className={styles.offerCard}>
              <div className={styles.offerType}>Cashback</div>
              <div className={styles.offerDetail}>
                Upto ₹109 cashback as Amazon Pay Balance
              </div>
              <span className={styles.offerLink}>1 offer</span>
            </div>
            {/* Card 2 */}
            <div className={styles.offerCard}>
              <div className={styles.offerType}>Bank Offer</div>
              <div className={styles.offerDetail}>
                Upto ₹2,500 discount on select Credit Cards
              </div>
              <span className={styles.offerLink}>5 offers</span>
            </div>
            {/* Card 3 */}
            <div className={styles.offerCard}>
              <div className={styles.offerType}>No Cost EMI</div>
              <div className={styles.offerDetail}>
                EMI from ₹{formatINR(emi)}/month
              </div>
              <span className={styles.offerLink}>Details</span>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* About this item */}
        <h3 className={styles.aboutHeading}>About this item</h3>
        <p className={styles.description}>{product.description}</p>
      </div>

      {/* ════════ RIGHT: Buy Box ════════ */}
      <div className={styles.buyBox}>
        {/* Price */}
        <div className={styles.buyBoxPriceRow}>
          <span className={styles.buyBoxPriceSymbol}>₹</span>
          <span className={styles.buyBoxPriceAmount}>{formatINR(price)}</span>
        </div>

        {/* Delivery info */}
        <p className={styles.deliveryText}>
          <span className={styles.deliveryBold}>FREE delivery </span>
          <span className={styles.deliveryLink}>Details</span>
        </p>
        <p className={styles.deliverySubtext}>
          Or fastest delivery Tomorrow. Order within 5 hrs.
        </p>

        {/* Stock */}
        <div className={`${styles.stockStatus} ${inStock ? styles.inStock : styles.outOfStock}`}>
          {inStock ? 'In Stock' : 'Out of Stock'}
        </div>

        {/* Quantity */}
        {inStock && (
          <div className={styles.quantityRow}>
            <label htmlFor="qty" className={styles.quantityLabel}>Qty:</label>
            <select
              id="qty"
              className={styles.quantitySelect}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
        )}

        {/* Action buttons */}
        <button
          className={`${styles.actionBtn} ${styles.addToCartBtn}`}
          onClick={handleAddToCart}
          disabled={!inStock}
        >
          Add to Cart
        </button>
        <button
          className={`${styles.actionBtn} ${styles.buyNowBtn}`}
          onClick={handleBuyNow}
          disabled={!inStock}
        >
          Buy Now
        </button>
        <button 
          className={styles.wishlistBtn}
          onClick={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product.id)}
        >
          {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </button>

        <div className={styles.buyBoxDivider} />

        {/* Seller info */}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Ships from</span>
          <span className={styles.infoValue}>Amazon</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Sold by</span>
          <span className={styles.infoValue}>RetailEZ Pvt Ltd</span>
        </div>

        <div className={styles.buyBoxDivider} />

        <div className={styles.secureRow}>
          <span className={styles.secureLock}>🔒</span>
          <span className={styles.secureLabel}>Payment</span>
          <span className={styles.secureValue}>Secure transaction</span>
        </div>
      </div>
      </div>

      {/* reviews section — shows avg rating + all reviews */}
      <div className={styles.reviewsSection}>
        <h2 className={styles.reviewsTitle}>Customer Reviews</h2>
        <div className={styles.reviewsSummary}>
          <span className={styles.reviewsAvg}>{avgRating || '—'}</span>
          <span className={styles.reviewsStars}>{renderStars(avgRating)}</span>
          <span className={styles.reviewsCount}>{totalReviews} global rating{totalReviews !== 1 ? 's' : ''}</span>
        </div>

        {/* Write a review form */}
        {user ? (
          <form className={styles.reviewForm} onSubmit={handleSubmitReview}>
            <h3>Write a Review</h3>
            <div className={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`${styles.pickStar} ${(hoverRating || userRating) >= star ? styles.pickStarActive : ''}`}
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >★</span>
              ))}
            </div>
            <textarea
              className={styles.reviewTextarea}
              placeholder="Share your experience with this product..."
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              rows={4}
            />
            <div className={styles.reviewFormActions}>
              <button type="submit" className={styles.submitReviewBtn} disabled={reviewSubmitting}>
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
              {reviews.some(r => r.userId === user.id) && (
                <button type="button" className={styles.deleteReviewBtn} onClick={handleDeleteReview}>
                  Delete My Review
                </button>
              )}
            </div>
            {reviewMessage && <p className={styles.reviewMsg}>{reviewMessage}</p>}
          </form>
        ) : (
          <p className={styles.loginPrompt}>Please <a href="/login">log in</a> to write a review.</p>
        )}

        {/* Review list */}
        <div className={styles.reviewsList}>
          {reviews.length === 0 ? (
            <p className={styles.noReviews}>No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewerName}>{review.user?.name || 'Anonymous'}</span>
                  <span className={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
                <div className={styles.reviewStars}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
