const express = require('express'); // web framework for node
const cors = require('cors'); // cross-origin resource sharing — lets frontend on diff port call our api
const { PrismaClient } = require('@prisma/client'); // ORM to talk to our postgres db
require('dotenv').config(); // loads .env file into process.env

const app = express(); // create the express app instance
const prisma = new PrismaClient(); // single prisma instance shared across the app

// allow frontend to call our api (without cors, browser blocks cross-origin requests)
app.use(cors());
// parse incoming json bodies so req.body works
app.use(express.json());

// keeps render + neon db from sleeping on free tier
app.get('/health', async (req, res) => {
  try {
    // Ping the database to keep Neon Postgres awake
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// --- register all api routes ---
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/review');

app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);

// catch-all for unhandled errors (4 params = express error middleware)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// use PORT from env (render sets this) or default 5000 for local dev
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
