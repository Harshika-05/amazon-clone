const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with expanded data...');

  // delete in correct order (child first, then parent) to avoid foreign key constraints
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  await prisma.category.deleteMany({});

  // 1. generate a default guest user so the app is immediately usable
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // upsert prevents creating duplicates if we run seed multiple times
  const user = await prisma.user.upsert({
    where: { email: 'guest@amazon-clone.com' },
    update: {},
    create: {
      name: 'Guest User',
      email: 'guest@amazon-clone.com',
      password: hashedPassword,
      defaultAddress: '123 Amazon Way, Bengaluru, Karnataka 560001',
    },
  });

  // 2. create product categories to filter products by
  const electronics = await prisma.category.create({ data: { name: 'Electronics' } });
  const books = await prisma.category.create({ data: { name: 'Books' } });
  const fashion = await prisma.category.create({ data: { name: 'Fashion' } });
  const home = await prisma.category.create({ data: { name: 'Home & Kitchen' } });

  // ═══════════════════════════════════════════
  // ELECTRONICS (5 products)
  // ═══════════════════════════════════════════

  // 3. populate products. include images dynamically via prisma relations
  await prisma.product.create({
    data: {
      name: 'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones',
      description: 'Industry Leading Noise Canceling with Auto Noise Canceling Optimizer. Crystal Clear Hands-Free Calling with 4 beamforming microphones. 30 hours battery life with quick charging (3 min charge for 3 hours of playback). Touch Sensor controls to pause play skip tracks, control volume, activate your voice assistant, and answer phone calls. Speak-to-Chat technology automatically reduces volume during conversations.',
      price: 29990.00,
      stock: 50,
      categoryId: electronics.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Apple iPhone 15 (128 GB) - Black',
      description: 'DYNAMIC ISLAND COMES TO IPHONE 15 — Dynamic Island bubbles up alerts and Live Activities — so you don\'t miss them while you\'re doing something else. You can see who\'s calling, track your next ride, check your flight status, and so much more. INNOVATIVE DESIGN — iPhone 15 features a durable color-infused glass and aluminum design. It\'s splash, water, and dust resistant. The Ceramic Shield front is tougher than any smartphone glass. And the 6.1" Super Retina XDR display is up to 2x brighter in the sun compared to iPhone 14.',
      price: 71999.00,
      stock: 120,
      categoryId: electronics.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Samsung 108 cm (43 inches) Crystal 4K iSmart Ultra HD Smart LED TV',
      description: 'Resolution: 4K Ultra HD (3840 x 2160) | Refresh Rate: 50 Hertz. Connectivity: 3 HDMI ports to connect set top box, Blu-ray speakers or a gaming console | 1 USB port to connect hard drives and other USB devices. Sound: 20 Watts Output | Dolby Digital Plus with Adaptive Sound technology for crystal clear dialogues. Smart TV Features: Official Tizen OS with pre-loaded OTT apps, iSmart AI Hub, Screen Mirroring, Auto Detection, Ambient Mode.',
      price: 28990.00,
      stock: 35,
      categoryId: electronics.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Logitech MX Master 3S - Wireless Performance Mouse',
      description: 'Any-surface tracking now at 8000 DPI: Use MX Master 3S cordless mouse to work on any surface — even glass — with the upgraded 8000 DPI sensor with customizable sensitivity. Quiet Clicks: Enjoy the same satisfying click feel with 90% less click noise thanks to the Quiet Click technology. MagSpeed electromagnetic scroll: Precise enough to stop on a pixel and fast enough to scroll 1,000 lines per second.',
      price: 10495.00,
      stock: 80,
      categoryId: electronics.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'boAt Airdopes 141 Bluetooth TWS Earbuds',
      description: 'boAt Airdopes 141 comes equipped with 8mm drivers that pump out immersive audio with clear sound. It houses a massive 650mAh charging case that combined with the 42mAh battery on each earbud, lasts up to 42 hours. Its low latency mode ensures a lag-free experience for a gaming sessions. Its IWP technology automatically connects the earbuds once the lid is opened.',
      price: 1299.00,
      stock: 200,
      categoryId: electronics.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  // ═══════════════════════════════════════════
  // BOOKS (4 products)
  // ═══════════════════════════════════════════

  await prisma.product.create({
    data: {
      name: 'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
      description: 'No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results. If you\'re having trouble changing your habits, the problem isn\'t you. The problem is your system.',
      price: 499.00,
      stock: 300,
      categoryId: books.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'The Psychology of Money: Timeless lessons on wealth, greed, and happiness',
      description: 'Doing well with money isn\'t necessarily about what you know. It\'s about how you behave. And behavior is hard to teach, even to really smart people. Money—investing, personal finance, and business decisions—is typically taught as a math-based field. But Morgan Housel, the award-winning Collaborative Fund partner, shows how history, psychology, and philosophy offer the best lens.',
      price: 295.00,
      stock: 150,
      categoryId: books.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Rich Dad Poor Dad: What the Rich Teach Their Kids About Money',
      description: 'Rich Dad Poor Dad is Robert Kiyosaki\'s best-selling book about the difference in mindset between the poor, middle class, and rich. In this book, Robert recounts growing up with two father figures and the ways they shaped his financial views. The \'Poor Dad\' represents his biological father, a well-educated man who nonetheless was unable to build wealth, while his \'Rich Dad\' was his best friend\'s father.',
      price: 399.00,
      stock: 100,
      categoryId: books.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Ikigai: The Japanese Secret to a Long and Happy Life',
      description: 'The people of Japan believe that everyone has an ikigai – a reason to jump out of bed each morning. According to the Japanese, everyone has an ikigai. Finding it requires a deep and often lengthy search of self. Such a search is regarded as being very important, since it is believed that discovery of one\'s ikigai brings satisfaction and meaning to life.',
      price: 250.00,
      stock: 120,
      categoryId: books.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  // ═══════════════════════════════════════════
  // FASHION (4 products)
  // ═══════════════════════════════════════════

  await prisma.product.create({
    data: {
      name: 'Levi\'s Men\'s 511 Slim Fit Jeans',
      description: 'A modern slim with room to move, the 511 Slim Fit Stretch Jeans are a classic since right now. These jeans sit below the waist with a slim fit from hip to ankle. Made with a variety of comfortable, innovative fabrics for ultimate versatility. Pair with a tee and sneakers for an easy, everyday look.',
      price: 2159.00,
      stock: 200,
      categoryId: fashion.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Puma Men\'s Dazzler Sneakers',
      description: 'Synthetic Leather Upper for comfort and style. Rubber Outsole for grip and traction on various surfaces. Lace closure for a snug fit that stays put. PUMA Formstrip at medial and lateral sides for the classic PUMA look. SoftFoam+ insole for superior step-in comfort that lasts all day.',
      price: 1499.00,
      stock: 150,
      categoryId: fashion.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Allen Solly Men\'s Regular Fit Polo T-Shirt',
      description: 'This classic polo from Allen Solly is crafted from premium cotton for breathable, all-day comfort. Features a ribbed collar, two-button placket, and the signature embroidered logo. Perfect for both casual and semi-formal occasions. Machine washable for easy care.',
      price: 849.00,
      stock: 180,
      categoryId: fashion.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Fastrack Analog Women\'s Watch - Rose Gold',
      description: 'This stylish timepiece from Fastrack features a sleek rose gold dial set on a stainless steel case. The metal strap adds an elegant touch to any outfit. Water resistant up to 30 meters, making it suitable for everyday wear. Quartz movement ensures accurate timekeeping.',
      price: 1695.00,
      stock: 90,
      categoryId: fashion.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  // ═══════════════════════════════════════════
  // HOME & KITCHEN (4 products)
  // ═══════════════════════════════════════════

  await prisma.product.create({
    data: {
      name: 'Pigeon Polypropylene Mini Handy and Compact Chopper',
      description: 'Made from high quality 100% food grade Plastic that is BPA free. Spring action mechanism that allows easy pulling and lasts long. Comes with 3 sharp stainless steel blades for easy and fine chopping. Compact and portable, perfect for small kitchens. Ideal for chopping vegetables, fruits, nuts, herbs, onions and more.',
      price: 199.00,
      stock: 500,
      categoryId: home.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1584990347449-a6fb1122a613?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Philips HL7756/00 Mixer Grinder 750W with 3 Jars',
      description: 'Newly designed powerful Turbo motor for continuous grinding with 750W power. 3 stainless steel multipurpose jars for wet grinding, chutney grinding and dry grinding. Advanced air ventilation system for faster cooling and longer motor life. Sturdy handles for firm grip. Special coupler design for easy locking of jars.',
      price: 3499.00,
      stock: 60,
      categoryId: home.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Prestige IRIS 750W Mixer Grinder with 3 Stainless Steel Jars',
      description: 'Prestige IRIS 750 Watt Mixer Grinder with 3 stainless steel jars (1.5L Wet Jar, 1.0L Dry Jar, 0.3L Chutney Jar). Powerful motor that handles tough ingredients with ease. Unique lid lock mechanism for safe operation. Stainless steel blades that deliver fine and consistent grinding.',
      price: 2899.00,
      stock: 75,
      categoryId: home.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Amazon Basics Stainless Steel 4-Piece Dinner Set',
      description: 'Set of 4 stainless steel dinner plates, ideal for everyday dining. Made from high-quality food-grade stainless steel that is durable and resistant to corrosion. Dishwasher safe for easy cleaning. Lightweight yet sturdy construction. Perfect for home, outdoor dining, and picnics.',
      price: 449.00,
      stock: 300,
      categoryId: home.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=800' }
        ]
      }
    }
  });

  console.log('Seeding completed successfully! 17 products across 4 categories.');
}

// execute the main function and handle any errors
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // always disconnect from db after seeding
    await prisma.$disconnect();
  });
