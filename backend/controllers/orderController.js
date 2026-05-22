const { PrismaClient } = require('@prisma/client');
const { sendOrderConfirmation, sendOrderCancellation } = require('../services/emailService');
const prisma = new PrismaClient();

// Global store for in-memory email preview URLs
global.emailPreviews = global.emailPreviews || {};

exports.placeOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { shippingAddress } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let totalAmount = 0;
    const orderItemsData = cart.items.map(item => {
      totalAmount += item.product.price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.product.price
      };
    });

    // Create Order and clear cart in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      const order = await prisma.order.create({
        data: {
          userId,
          shippingAddress,
          totalAmount,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      // Update user's default address
      await prisma.user.update({
        where: { id: userId },
        data: { defaultAddress: shippingAddress }
      });

      return order;
    });

    // Send order confirmation email (fast with static Ethereal credentials)
    sendOrderConfirmation({
      toEmail: req.user.email,
      orderId: result.id,
      items: result.items,
      totalAmount: result.totalAmount,
      shippingAddress: result.shippingAddress,
    }).then(emailResult => {
      if (emailResult && emailResult.previewUrl) {
        global.emailPreviews[result.id] = emailResult.previewUrl;
      }
    }).catch(err => console.error('Order email failed:', err));

    // Return our custom redirect URL instantly
    res.json({ 
      ...result, 
      emailPreviewUrl: `${req.protocol}://${req.get('host')}/api/orders/${result.id}/email-preview` 
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Ensure user owns order
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { include: { images: true } } }
        }
      }
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// ─── Cancel Order ─────────────────────────────────────────────────────────────
// Amazon rule: only PENDING orders (not yet shipped) can be cancelled.
// Stock is restored atomically in a transaction.
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // optional cancellation reason

    // Fetch the order with its items
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Ownership check
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorised to cancel this order' });
    }

    // Only PENDING orders can be cancelled (Amazon rule: once shipped, no cancellation)
    if (order.status !== 'PENDING') {
      return res.status(400).json({
        error: `This order cannot be cancelled because it is already ${order.status.toLowerCase()}.`
      });
    }

    // Cancel order and restore stock in a single atomic transaction
    const cancelled = await prisma.$transaction(async (tx) => {
      // Restore stock for every item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }

      // Update order status to CANCELLED and store the reason
      return tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          ...(reason ? { cancellationReason: reason } : {})
        },
        include: {
          items: { include: { product: { include: { images: true } } } }
        }
      });
    });

    // Send cancellation email (fast with static Ethereal credentials)
    sendOrderCancellation({
      toEmail: req.user.email,
      orderId: cancelled.id,
      items: cancelled.items,
      totalAmount: cancelled.totalAmount,
      reason: reason || 'No reason provided',
    }).then(emailResult => {
      if (emailResult && emailResult.previewUrl) {
        global.emailPreviews[`cancel_${cancelled.id}`] = emailResult.previewUrl;
      }
    }).catch(err => console.error('Cancel email failed:', err));

    // Return our custom redirect URL instantly
    res.json({ 
      ...cancelled, 
      emailPreviewUrl: `${req.protocol}://${req.get('host')}/api/orders/cancel_${cancelled.id}/email-preview` 
    });
  } catch (error) {
    next(error);
  }
};

// ─── Email Preview Redirect ───────────────────────────────────────────────────
// This endpoint is opened in a new tab by the frontend.
// It waits until the email is sent (by checking the global store), then redirects.
exports.getEmailPreview = (req, res) => {
  const { id } = req.params;
  const url = global.emailPreviews[id];

  if (url) {
    return res.redirect(url);
  }

  // If email is still being generated, show a loading page that auto-refreshes
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="2">
        <title>Loading Email Preview...</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f3f3f3; margin: 0; }
          .loader { text-align: center; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #ff9900; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <h2>Generating Email Preview...</h2>
          <p style="color: #666;">This may take a few seconds.</p>
        </div>
      </body>
    </html>
  `);
};
