import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import styles from './OrderHistoryPage.module.css';
import API_BASE_URL from '../config';

// Real Amazon cancellation reasons
const CANCEL_REASONS = [
  'I want to change the delivery address',
  'I want to change payment method',
  'I found a better price elsewhere',
  'I ordered by mistake',
  'I want to change the quantity',
  'Item is no longer needed',
  'Expected delivery time is too long',
  'Other reason',
];

// color-code status: pending=green, shipped=blue, cancelled=red
const STATUS_CONFIG = {
  PENDING:   { label: 'Preparing for Dispatch', color: '#007600', dot: '#007600' },
  SHIPPED:   { label: 'Shipped',                color: '#007185', dot: '#007185' },
  DELIVERED: { label: 'Delivered',              color: '#007600', dot: '#007600' },
  CANCELLED: { label: 'Cancelled',              color: '#c40000', dot: '#c40000' },
};

const OrderHistoryPage = () => {
  // state for orders, tabs, and cancel modal
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('all');
  const [cancelModal, setCancelModal]     = useState(null); // { orderId, items }
  const [selectedReason, setSelectedReason] = useState('');
  const [cancelling, setCancelling]       = useState(false);

  const { user, token } = useAuth();
  const { showToast }   = useToast();
  const navigate        = useNavigate();

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchOrders();
  }, [token]);

  // load all past orders, newest first
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/orders/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // open cancel modal, send reason to backend
  const openCancelModal = (order) => {
    setSelectedReason('');
    setCancelModal(order);
  };

  // cancel order + restore stock on backend
  const handleCancelOrder = async () => {
    if (!selectedReason) return showToast('Please select a cancellation reason', 'error');
    setCancelling(true);
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/orders/${cancelModal.id}/cancel`,
        { reason: selectedReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state immediately
      setOrders(prev =>
        prev.map(o =>
          o.id === cancelModal.id
            ? { ...o, status: 'CANCELLED', cancellationReason: selectedReason }
            : o
        )
      );
      setCancelModal(null);
      showToast('Order cancelled successfully!', 'success');

    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // filter orders by tab (all / not shipped / cancelled)
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all')       return true;
    if (activeTab === 'pending')   return o.status === 'PENDING';
    if (activeTab === 'cancelled') return o.status === 'CANCELLED';
    return true;
  });

  if (loading) return <div className={styles.loading}>Loading your orders...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link to="/">Your Account</Link> › <span>Your Orders</span>
      </div>

      <div className={styles.header}>
        <h1>Your Orders</h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: 'all',       label: 'Orders' },
          { key: 'pending',   label: 'Not Yet Shipped' },
          { key: 'cancelled', label: 'Cancelled Orders' },
        ].map(tab => (
          <div
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Orders List */}
      <div className={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <div className={styles.noOrders}>
            <p>{activeTab === 'cancelled' ? 'No cancelled orders.' : 'You have not placed any orders yet.'}</p>
            <Link to="/" className={styles.continueShoppingBtn}>Start Shopping</Link>
          </div>
        ) : (
          filteredOrders.map(order => {
            const cfg     = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const canCancel = order.status === 'PENDING';

            return (
              <div key={order.id} className={`${styles.orderCard} ${order.status === 'CANCELLED' ? styles.cancelledCard : ''}`}>
                {/* Order Header */}
                <div className={styles.orderHeader}>
                  <div className={styles.headerGroup}>
                    <div className={styles.headerItem}>
                      <span className={styles.label}>ORDER PLACED</span>
                      <span className={styles.value}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className={styles.headerItem}>
                      <span className={styles.label}>TOTAL</span>
                      <span className={styles.value}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className={styles.headerItem}>
                      <span className={styles.label}>DISPATCH TO</span>
                      <span className={styles.value} style={{ color: '#007185', cursor: 'pointer' }}>
                        {user?.name || 'User'} ▾
                      </span>
                    </div>
                  </div>
                  <div className={styles.headerRight}>
                    <div className={styles.orderIdGroup}>
                      <span className={styles.label}>ORDER # {order.id.substring(0, 15)}...</span>
                      <Link to={`/order/${order.id}`} className={styles.orderLink}>View order details</Link>
                    </div>
                  </div>
                </div>

                {/* Order Body */}
                <div className={styles.orderBody}>
                  {/* Status Row */}
                  <div className={styles.deliveryStatus}>
                    <div className={styles.statusRow}>
                      <span className={styles.statusDot} style={{ backgroundColor: cfg.dot }} />
                      <h3 style={{ color: cfg.color }}>{cfg.label}</h3>
                    </div>
                    {order.status === 'CANCELLED' && order.cancellationReason && (
                      <p className={styles.cancelReason}>
                        Reason: <em>{order.cancellationReason}</em>
                      </p>
                    )}
                    {order.status !== 'CANCELLED' && (
                      <p>Shipping to: {order.shippingAddress}</p>
                    )}
                  </div>

                  {/* Items */}
                  <div className={styles.itemsList}>
                    {order.items.map(item => (
                      <div key={item.id} className={styles.itemRow}>
                        <div className={styles.itemImageContainer}>
                          <img
                            src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/100'}
                            alt={item.product?.name}
                            className={`${styles.itemImage} ${order.status === 'CANCELLED' ? styles.cancelledImage : ''}`}
                          />
                        </div>
                        <div className={styles.itemDetails}>
                          <Link to={`/product/${item.product?.id}`} className={styles.itemName}>
                            {item.product?.name}
                          </Link>
                          <div className={styles.itemMeta}>
                            <span>Qty: {item.quantity}</span>
                            <span className={styles.metaDot}>·</span>
                            <span>₹{Number(item.priceAtPurchase).toLocaleString('en-IN')} each</span>
                          </div>
                          <div className={styles.itemActions}>
                            <Link to={`/product/${item.product?.id}`} className={styles.actionBtn}>
                              Buy it again
                            </Link>
                            <Link to={`/product/${item.product?.id}`} className={styles.secondaryBtn}>
                              View item
                            </Link>
                          </div>
                        </div>
                        <div className={styles.rightActions}>
                          {canCancel && (
                            <button
                              className={styles.cancelBtn}
                              onClick={() => openCancelModal(order)}
                            >
                              Cancel order
                            </button>
                          )}
                          <Link to={`/product/${item.product?.id}`} className={styles.reviewBtn}>
                            Write a product review
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cancel button at bottom for multi-item orders */}
                  {canCancel && order.items.length > 1 && (
                    <div className={styles.cancelFooter}>
                      <button className={styles.cancelBtnLarge} onClick={() => openCancelModal(order)}>
                        Cancel entire order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Cancellation Modal ── */}
      {cancelModal && (
        <div className={styles.modalOverlay} onClick={() => setCancelModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Cancel Order</h2>
              <button className={styles.modalClose} onClick={() => setCancelModal(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalSubtext}>
                Please select a reason for cancellation. Your stock will be automatically restored.
              </p>

              {/* Order summary in modal */}
              <div className={styles.modalOrderSummary}>
                {cancelModal.items.slice(0, 2).map(item => (
                  <div key={item.id} className={styles.modalItem}>
                    <img
                      src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/60'}
                      alt={item.product?.name}
                      className={styles.modalItemImage}
                    />
                    <span className={styles.modalItemName}>{item.product?.name}</span>
                  </div>
                ))}
                {cancelModal.items.length > 2 && (
                  <p className={styles.moreItems}>+{cancelModal.items.length - 2} more item(s)</p>
                )}
              </div>

              {/* Reason selection */}
              <p className={styles.reasonLabel}>Why are you cancelling this order?</p>
              <div className={styles.reasonList}>
                {CANCEL_REASONS.map(reason => (
                  <label key={reason} className={styles.reasonOption}>
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalCancelBtn} onClick={() => setCancelModal(null)}>
                Keep Order
              </button>
              <button
                className={styles.modalConfirmBtn}
                onClick={handleCancelOrder}
                disabled={!selectedReason || cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
