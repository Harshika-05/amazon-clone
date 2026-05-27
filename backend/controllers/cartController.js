const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// fetch cart with product details + images
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            }
          }
        }
      }
    });

    // first time? create empty cart
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true }
      });
    }

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // if already in cart, bump quantity instead of duplicating
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId
      }
    });

    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + (quantity || 1) }
      });
      res.json(updatedItem);
    } else {
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: quantity || 1
        }
      });
      res.json(newItem);
    }
  } catch (error) {
    next(error);
  }
};

// change quantity of a specific cart item
exports.updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity }
    });

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
};

// delete one item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.cartItem.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
