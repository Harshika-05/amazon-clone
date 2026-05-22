const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, sortBy, sortOrder, page, limit, minPrice, maxPrice } = req.query;
    let filter = {};

    if (search) {
      filter.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    if (category) {
      filter.categoryId = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.gte = parseFloat(minPrice);
      if (maxPrice) filter.price.lte = parseFloat(maxPrice);
    }

    // Sorting
    let orderBy = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder === 'desc' ? 'desc' : 'asc';
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.name = 'asc'; // default
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNum - 1) * pageSize;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: filter,
        include: {
          images: true,
          category: true
        },
        orderBy,
        skip,
        take: pageSize
      }),
      prisma.product.count({ where: filter })
    ]);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};
