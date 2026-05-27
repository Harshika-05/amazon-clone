const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// get reviews + calculate avg rating
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // average = sum of ratings / count
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });
  } catch (error) {
    next(error);
  }
};

// create or update — one review per user per product
exports.upsertReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please provide a valid productId and rating (1-5)' });
    }

    const review = await prisma.review.upsert({
      where: {
        userId_productId: { userId, productId }
      },
      update: { rating, comment },
      create: { userId, productId, rating, comment },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

// only owner can delete their review
exports.deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await prisma.review.delete({
      where: {
        userId_productId: { userId, productId }
      }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    // prisma error P2025 = record not found
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Review not found' });
    }
    next(error);
  }
};
