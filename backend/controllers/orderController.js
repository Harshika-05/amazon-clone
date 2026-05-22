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

    // Send order confirmation email
    const emailResult = await sendOrderConfirmation({
      toEmail: req.user.email,
      orderId: result.id,
      items: result.items,
      totalAmount: result.totalAmount,
      shippingAddress: result.shippingAddress,
    });

    if (!emailResult.success) {
      console.warn('Order confirmation email failed, but order was placed.');
    }

    res.json({ ...result });
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

    // Send cancellation email
    const emailResult = await sendOrderCancellation({
      toEmail: req.user.email,
      orderId: cancelled.id,
      items: cancelled.items,
      totalAmount: cancelled.totalAmount,
      reason: reason || 'No reason provided',
    });

    if (!emailResult.success) {
      console.warn('Order cancellation email failed, but order was cancelled.');
    }

    res.json({ ...cancelled });
  } catch (error) {
    next(error);
  }
};

// Email preview logic removed
