const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// fetch wishlist with product details + images
exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
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

    // first time? create empty wishlist
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId },
        include: { items: true }
      });
    }

    res.json(wishlist);
  } catch (error) {
    next(error);
  }
};

// add product to wishlist
exports.addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId }
      });
    }

    // upsert so adding same product twice won't crash
    const wishlistItem = await prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId
        }
      },
      update: {},
      create: {
        wishlistId: wishlist.id,
        productId
      }
    });

    res.status(201).json(wishlistItem);
  } catch (error) {
    next(error);
  }
};

// remove product from wishlist
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId }
    });

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    await prisma.wishlistItem.delete({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId
        }
      }
    });

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    // if not found, still return success — no big deal
    res.json({ message: 'Item removed from wishlist' });
  }
};
