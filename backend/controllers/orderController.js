const { PrismaClient } = require('@prisma/client');
const { sendOrderConfirmation, sendOrderCancellation } = require('../services/emailService');
const prisma = new PrismaClient();



// convert cart into an order + clear the cart
exports.placeOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { shippingAddress } = req.body;

    // include = fetch related models along with main query (eager loading)
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
    // .map transforms each cart item into the shape needed for order items
    const orderItemsData = cart.items.map(item => {
      totalAmount += item.product.price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.product.price // lock price at purchase time
      };
    });

    // $transaction = if any query inside fails, all changes rollback (atomic)
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

      // save shipping address as default for next time
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
    next(error); // pass to express error handler middleware
  }
};

// get single order with product images
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

    // make sure user owns this order
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// all orders, newest first
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

// ─── cancel order ─────────────────────────────────────────────────────────────
// cancel — only if still pending, restore stock atomically
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

    // only the buyer can cancel
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorised to cancel this order' });
    }

    // only pending can be cancelled
    if (order.status !== 'PENDING') {
      return res.status(400).json({
        error: `This order cannot be cancelled because it is already ${order.status.toLowerCase()}.`
      });
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      // give back stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }

      // mark as cancelled
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

    // notify user via email
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

