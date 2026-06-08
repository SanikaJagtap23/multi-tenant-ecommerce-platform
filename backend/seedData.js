require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Store = require("./models/Store");
const Product = require("./models/Product");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/multi_tenant_ecommerce";

const img = (seed) =>
  `https://picsum.photos/seed/${seed}/500/500`;

// ─── DATA ─────────────────────────────────────────────────────────────────────

const VENDORS_DATA = [
  // ── 1. Electronics ──────────────────────────────────────────────────────────
  {
    user: {
      name: "Abhishek Kumar",
      email: "abhishek@tradezy.com",
      password: "vendor123",
      role: "vendor",
    },
    store: {
      name: "Abhishek Electronics",
      description: "Premium electronics and gadgets at best prices",
      category: "Electronics",
      address: "Shop 12, MG Road, Pune",
      contactEmail: "abhishek@tradezy.com",
      contactPhone: "9876543210",
    },
    products: [
      {
        name: "Apple MacBook Air M2",
        price: 89999, comparePrice: 109999,
        category: "Electronics", stock: 15, sku: "ELEC-001",
        description: "Apple MacBook Air with M2 chip, 8GB RAM, 256GB SSD. Ultra-thin and powerful laptop for professionals.",
        images: [img("macbook-laptop")],
      },
      {
        name: "Samsung Galaxy S24",
        price: 74999, comparePrice: 84999,
        category: "Electronics", stock: 25, sku: "ELEC-002",
        description: "Samsung Galaxy S24 with Snapdragon 8 Gen 3, 256GB storage, AI-powered camera system.",
        images: [img("samsung-smartphone")],
      },
      {
        name: "Sony WH-1000XM5 Headphones",
        price: 24999, comparePrice: 34999,
        category: "Electronics", stock: 30, sku: "ELEC-003",
        description: "Industry-leading noise canceling wireless headphones with 30-hour battery life.",
        images: [img("headphones-sony")],
      },
      {
        name: "Apple Watch Series 9",
        price: 41900, comparePrice: 48000,
        category: "Electronics", stock: 20, sku: "ELEC-004",
        description: "Apple Watch Series 9 with S9 chip, Always-On Retina display, health and fitness monitoring.",
        images: [img("apple-watch")],
      },
      {
        name: "Canon EOS R50 Mirrorless Camera",
        price: 62999, comparePrice: 72000,
        category: "Electronics", stock: 10, sku: "ELEC-005",
        description: "Canon EOS R50 with 24.2MP sensor, 4K video, compact body — ideal for content creators.",
        images: [img("canon-camera")],
      },
      {
        name: "iPad Air 5th Generation",
        price: 59900, comparePrice: 69000,
        category: "Electronics", stock: 18, sku: "ELEC-006",
        description: "iPad Air with M1 chip, 10.9-inch Liquid Retina display, 64GB storage, Wi-Fi model.",
        images: [img("ipad-tablet")],
      },
      {
        name: 'Samsung 55" 4K QLED Smart TV',
        price: 49999, comparePrice: 65000,
        category: "Electronics", stock: 8, sku: "ELEC-007",
        description: "Samsung 55-inch 4K QLED Smart TV, Crystal UHD, HDR10+, Tizen OS with built-in apps.",
        images: [img("samsung-smart-tv")],
      },
      {
        name: "Logitech MX Keys Wireless Keyboard",
        price: 8999, comparePrice: 11000,
        category: "Electronics", stock: 45, sku: "ELEC-008",
        description: "Advanced wireless illuminated keyboard with smart backlighting, multi-device connectivity.",
        images: [img("logitech-keyboard")],
      },
      {
        name: "Sony PlayStation 5 Console",
        price: 49990, comparePrice: 54990,
        category: "Electronics", stock: 5, sku: "ELEC-009",
        description: "PlayStation 5 with DualSense controller, ultra-high-speed SSD, 4K gaming at 120fps.",
        images: [img("playstation-console")],
      },
      {
        name: "boAt Airdopes 141 TWS Earbuds",
        price: 1299, comparePrice: 2990,
        category: "Electronics", stock: 100, sku: "ELEC-010",
        description: "boAt Airdopes 141 with 42H total playback, ENx noise isolation, BEAST mode for gaming.",
        images: [img("boat-earbuds")],
      },
    ],
  },

  // ── 2. Fashion ──────────────────────────────────────────────────────────────
  {
    user: {
      name: "Pravin Patil",
      email: "pravin@tradezy.com",
      password: "vendor123",
      role: "vendor",
    },
    store: {
      name: "Pravin Fashion Hub",
      description: "Trendy clothing and accessories for all occasions",
      category: "Fashion",
      address: "B-45, Fashion Street, Mumbai",
      contactEmail: "pravin@tradezy.com",
      contactPhone: "9988776655",
    },
    products: [
      {
        name: "Men's Classic Polo T-Shirt",
        price: 799, comparePrice: 1499,
        category: "Fashion", stock: 80, sku: "FASH-001",
        description: "Premium cotton polo t-shirt for men. Breathable, comfortable, available in multiple colors.",
        images: [img("polo-tshirt-men")],
      },
      {
        name: "Slim Fit Stretch Denim Jeans",
        price: 1499, comparePrice: 2499,
        category: "Fashion", stock: 60, sku: "FASH-002",
        description: "Slim fit stretch denim jeans for men. Dark blue wash, 5-pocket design, all-day comfort.",
        images: [img("slim-denim-jeans")],
      },
      {
        name: "Women's Floral Midi Dress",
        price: 1299, comparePrice: 2199,
        category: "Fashion", stock: 50, sku: "FASH-003",
        description: "Beautiful floral printed midi dress for women. Perfect for casual outings and summer parties.",
        images: [img("floral-midi-dress")],
      },
      {
        name: "Men's Genuine Leather Jacket",
        price: 3499, comparePrice: 5999,
        category: "Fashion", stock: 25, sku: "FASH-004",
        description: "Genuine leather biker jacket for men. Premium quality, zipper pockets, stylish and durable.",
        images: [img("leather-jacket-men")],
      },
      {
        name: "Nike Air Max Running Sneakers",
        price: 7999, comparePrice: 10999,
        category: "Fashion", stock: 35, sku: "FASH-005",
        description: "Nike Air Max sneakers with Air cushioning, breathable mesh upper, durable rubber sole.",
        images: [img("nike-air-max-sneakers")],
      },
      {
        name: "Women's Banarasi Silk Saree",
        price: 2999, comparePrice: 4999,
        category: "Fashion", stock: 30, sku: "FASH-006",
        description: "Elegant Banarasi silk saree with zari border and pallu. Perfect for weddings and festivals.",
        images: [img("banarasi-silk-saree")],
      },
      {
        name: "Men's Cotton Kurta Pajama Set",
        price: 1199, comparePrice: 1999,
        category: "Fashion", stock: 55, sku: "FASH-007",
        description: "Traditional cotton kurta pajama set for men. Comfortable fit, ideal for festive occasions.",
        images: [img("kurta-pajama-set")],
      },
      {
        name: "Women's PU Leather Shoulder Bag",
        price: 1899, comparePrice: 3499,
        category: "Fashion", stock: 40, sku: "FASH-008",
        description: "Stylish PU leather shoulder handbag for women. Multiple compartments, adjustable strap.",
        images: [img("leather-handbag-women")],
      },
      {
        name: "Polarized UV400 Sunglasses",
        price: 599, comparePrice: 1200,
        category: "Fashion", stock: 90, sku: "FASH-009",
        description: "Polarized sunglasses with UV400 protection and metal frame. Reduces glare, stylish design.",
        images: [img("polarized-sunglasses")],
      },
      {
        name: "Men's Oxford Formal Shoes",
        price: 2299, comparePrice: 3999,
        category: "Fashion", stock: 30, sku: "FASH-010",
        description: "Classic leather Oxford formal shoes for men. Cushioned insole, perfect for office and events.",
        images: [img("oxford-formal-shoes")],
      },
    ],
  },

  // ── 3. Home & Living ────────────────────────────────────────────────────────
  {
    user: {
      name: "Riya Sharma",
      email: "riya@tradezy.com",
      password: "vendor123",
      role: "vendor",
    },
    store: {
      name: "Riya's Home Decor",
      description: "Beautiful home decor and furniture for your dream home",
      category: "Home & Living",
      address: "C-22, Decor Mall, Bangalore",
      contactEmail: "riya@tradezy.com",
      contactPhone: "9123456780",
    },
    products: [
      {
        name: "3-Seater Premium Fabric Sofa",
        price: 18999, comparePrice: 28000,
        category: "Home & Living", stock: 8, sku: "HOME-001",
        description: "Comfortable 3-seater sofa in premium fabric. Available in grey and beige, easy assembly.",
        images: [img("fabric-sofa-grey")],
      },
      {
        name: "Sheesham Wood 6-Seater Dining Table",
        price: 12999, comparePrice: 18000,
        category: "Home & Living", stock: 5, sku: "HOME-002",
        description: "Solid sheesham wood 6-seater dining table with natural finish. Durable and elegant.",
        images: [img("sheesham-dining-table")],
      },
      {
        name: "Modern LED Arc Floor Lamp",
        price: 2499, comparePrice: 3999,
        category: "Home & Living", stock: 20, sku: "HOME-003",
        description: "Modern LED arc floor lamp with adjustable brightness. Perfect for reading nooks and living rooms.",
        images: [img("led-floor-lamp")],
      },
      {
        name: "Velvet Cushion Covers Set of 2",
        price: 699, comparePrice: 1199,
        category: "Home & Living", stock: 50, sku: "HOME-004",
        description: "Soft velvet cushion covers with fillers. Set of 2 in complementary colors, 45x45 cm.",
        images: [img("velvet-cushion-cover")],
      },
      {
        name: "Blackout Curtains (2 Panels, 7ft)",
        price: 1899, comparePrice: 2999,
        category: "Home & Living", stock: 35, sku: "HOME-005",
        description: "Premium blackout curtains blocking 99% light. Thermal insulated, 7ft length, pack of 2.",
        images: [img("blackout-curtains")],
      },
      {
        name: "Hand-Painted Ceramic Vase",
        price: 499, comparePrice: 899,
        category: "Home & Living", stock: 60, sku: "HOME-006",
        description: "Hand-painted ceramic vase with floral design. Adds elegance to any room or office desk.",
        images: [img("ceramic-flower-vase")],
      },
      {
        name: "Abstract Canvas Wall Art 60x40cm",
        price: 1599, comparePrice: 2499,
        category: "Home & Living", stock: 25, sku: "HOME-007",
        description: "Modern abstract canvas wall art print, framed and ready to hang. Size: 60x40 cm.",
        images: [img("canvas-wall-art")],
      },
      {
        name: "6-Shelf Engineered Wood Bookshelf",
        price: 5999, comparePrice: 8999,
        category: "Home & Living", stock: 12, sku: "HOME-008",
        description: "Sturdy 6-shelf bookshelf in walnut finish. Holds up to 150kg, simple assembly.",
        images: [img("wood-bookshelf")],
      },
      {
        name: "King Size Hydraulic Storage Bed",
        price: 22999, comparePrice: 32000,
        category: "Home & Living", stock: 4, sku: "HOME-009",
        description: "King size hydraulic storage bed with padded headboard. Engineered wood, 400kg capacity.",
        images: [img("king-size-bed")],
      },
      {
        name: "12-Cup Programmable Coffee Maker",
        price: 3299, comparePrice: 4999,
        category: "Home & Living", stock: 22, sku: "HOME-010",
        description: "12-cup drip coffee maker with keep-warm plate, programmable timer, and permanent filter.",
        images: [img("coffee-maker-machine")],
      },
    ],
  },

  // ── 4. Sports & Fitness ─────────────────────────────────────────────────────
  {
    user: {
      name: "Karan Mehta",
      email: "karan@tradezy.com",
      password: "vendor123",
      role: "vendor",
    },
    store: {
      name: "Karan Sports World",
      description: "Your one-stop shop for all sports and fitness equipment",
      category: "Sports & Fitness",
      address: "D-8, Sports Complex, Delhi",
      contactEmail: "karan@tradezy.com",
      contactPhone: "9765432100",
    },
    products: [
      {
        name: "Adjustable Dumbbell Set 20kg",
        price: 3499, comparePrice: 5000,
        category: "Sports & Fitness", stock: 30, sku: "SPRT-001",
        description: "Adjustable chrome dumbbell set with stand. 2x10kg dumbbells with multiple weight plates.",
        images: [img("dumbbell-set-gym")],
      },
      {
        name: "Anti-Slip TPE Yoga Mat 6mm",
        price: 849, comparePrice: 1499,
        category: "Sports & Fitness", stock: 75, sku: "SPRT-002",
        description: "Premium TPE yoga mat with alignment lines. 6mm thick, non-slip surface, eco-friendly.",
        images: [img("yoga-mat-tpe")],
      },
      {
        name: "Nivia Marathon Running Shoes",
        price: 2299, comparePrice: 3499,
        category: "Sports & Fitness", stock: 45, sku: "SPRT-003",
        description: "Nivia Marathon running shoes with cushioned sole, lightweight, breathable mesh upper.",
        images: [img("running-shoes-sport")],
      },
      {
        name: "SG English Willow Cricket Bat",
        price: 2999, comparePrice: 4500,
        category: "Sports & Fitness", stock: 20, sku: "SPRT-004",
        description: "SG Grade 3 English willow cricket bat. Full cane handle, ideal for hard ball cricket.",
        images: [img("cricket-bat-willow")],
      },
      {
        name: "Cosco Professional Football Size 5",
        price: 699, comparePrice: 999,
        category: "Sports & Fitness", stock: 60, sku: "SPRT-005",
        description: "Cosco professional football, Size 5. Rubber bladder, machine stitched, all-weather use.",
        images: [img("football-cosco")],
      },
      {
        name: "Hero Sprint 26\" Mountain Bike",
        price: 8999, comparePrice: 12000,
        category: "Sports & Fitness", stock: 10, sku: "SPRT-006",
        description: "Hero Sprint 26-inch mountain bike with 21-speed Shimano gears, front suspension, disc brakes.",
        images: [img("mountain-bike-hero")],
      },
      {
        name: "MuscleBlaze Whey Protein 1kg",
        price: 1799, comparePrice: 2499,
        category: "Sports & Fitness", stock: 55, sku: "SPRT-007",
        description: "MuscleBlaze Whey Protein 1kg, Chocolate flavour. 25g protein per serving, no added sugar.",
        images: [img("whey-protein-powder")],
      },
      {
        name: "Yonex Badminton Racket Set",
        price: 1299, comparePrice: 2000,
        category: "Sports & Fitness", stock: 35, sku: "SPRT-008",
        description: "Yonex badminton starter set with 2 rackets and 3 shuttlecocks. Ideal for beginners.",
        images: [img("badminton-racket")],
      },
      {
        name: "Boldfit Insulated Steel Water Bottle 1L",
        price: 499, comparePrice: 799,
        category: "Sports & Fitness", stock: 100, sku: "SPRT-009",
        description: "1-litre insulated stainless steel bottle. Keeps cold 24hr, hot 12hr, BPA-free lid.",
        images: [img("steel-water-bottle")],
      },
      {
        name: "Resistance Bands Set of 5",
        price: 599, comparePrice: 999,
        category: "Sports & Fitness", stock: 80, sku: "SPRT-010",
        description: "Set of 5 latex resistance bands with different resistance levels. Perfect for home workouts.",
        images: [img("resistance-bands-fitness")],
      },
    ],
  },

  // ── 5. Books ────────────────────────────────────────────────────────────────
  {
    user: {
      name: "Sneha Joshi",
      email: "sneha@tradezy.com",
      password: "vendor123",
      role: "vendor",
    },
    store: {
      name: "Sneha's Book Corner",
      description: "Books for every reader — fiction, non-fiction, education and more",
      category: "Books",
      address: "E-3, Knowledge Park, Hyderabad",
      contactEmail: "sneha@tradezy.com",
      contactPhone: "9654321098",
    },
    products: [
      {
        name: "The Alchemist — Paulo Coelho",
        price: 199, comparePrice: 350,
        category: "Books", stock: 100, sku: "BOOK-001",
        description: "Bestselling philosophical novel about following your dreams. Paperback, English edition.",
        images: [img("alchemist-novel-book")],
      },
      {
        name: "Class 12 Physics NCERT Textbook",
        price: 299, comparePrice: 450,
        category: "Books", stock: 80, sku: "BOOK-002",
        description: "NCERT Physics textbook for Class 12. Complete syllabus, solved examples, and exercises.",
        images: [img("ncert-physics-textbook")],
      },
      {
        name: "Atomic Habits — James Clear",
        price: 349, comparePrice: 499,
        category: "Books", stock: 90, sku: "BOOK-003",
        description: "Bestselling guide to building good habits and breaking bad ones. Paperback edition.",
        images: [img("atomic-habits-book")],
      },
      {
        name: "Harry Potter Books 1–3 Set",
        price: 999, comparePrice: 1499,
        category: "Books", stock: 40, sku: "BOOK-004",
        description: "Harry Potter complete paperback set of first 3 books. Great for children and young adults.",
        images: [img("harry-potter-books")],
      },
      {
        name: "A Brief History of Time — Hawking",
        price: 249, comparePrice: 399,
        category: "Books", stock: 65, sku: "BOOK-005",
        description: "Stephen Hawking's landmark book on cosmology, black holes, and the nature of time.",
        images: [img("brief-history-time")],
      },
      {
        name: "India After Gandhi — Ramachandra Guha",
        price: 699, comparePrice: 999,
        category: "Books", stock: 30, sku: "BOOK-006",
        description: "Comprehensive history of independent India. Must-read for history and politics enthusiasts.",
        images: [img("india-after-gandhi")],
      },
      {
        name: "Wings of Fire — APJ Abdul Kalam",
        price: 179, comparePrice: 299,
        category: "Books", stock: 120, sku: "BOOK-007",
        description: "Inspiring autobiography of Dr. APJ Abdul Kalam, former President of India.",
        images: [img("wings-of-fire-kalam")],
      },
      {
        name: "The Design of Everyday Things",
        price: 449, comparePrice: 699,
        category: "Books", stock: 25, sku: "BOOK-008",
        description: "Don Norman's classic on user-centered design. Essential for designers and engineers.",
        images: [img("design-everyday-things")],
      },
      {
        name: "Tinkle Comic Collection Vol. 1",
        price: 299, comparePrice: 499,
        category: "Books", stock: 55, sku: "BOOK-009",
        description: "Tinkle comic collection featuring Suppandi, Shikari Shambu, and more fan-favourite strips.",
        images: [img("tinkle-comic-book")],
      },
      {
        name: "Oxford Advanced Learner's Dictionary",
        price: 799, comparePrice: 1200,
        category: "Books", stock: 20, sku: "BOOK-010",
        description: "Oxford Advanced Learner's Dictionary 10th edition. Over 185,000 words and phrases.",
        images: [img("oxford-dictionary")],
      },
    ],
  },

  // ── 6. Beauty & Personal Care ────────────────────────────────────────────────
  {
    user: {
      name: "Sanika Jagtap",
      email: "sanu@tradezy.com",
      password: "vendor123",
      role: "vendor",
    },
    store: {
      name: "Sanika's Glamour Hub",
      description: "Premium beauty and personal care products for everyone",
      category: "Beauty & Personal Care",
      address: "F-18, Beauty Lane, Chennai",
      contactEmail: "pooja@tradezy.com",
      contactPhone: "9543210987",
    },
    products: [
      {
        name: "Lakme 9to5 Lipstick Set of 3",
        price: 799, comparePrice: 1199,
        category: "Beauty & Personal Care", stock: 70, sku: "BEAU-001",
        description: "Lakme 9to5 long-lasting lipstick set of 3 shades. Moisturizing matte formula.",
        images: [img("lakme-lipstick-set")],
      },
      {
        name: "Davidoff Cool Water EDT 100ml",
        price: 2499, comparePrice: 3500,
        category: "Beauty & Personal Care", stock: 25, sku: "BEAU-002",
        description: "Davidoff Cool Water Eau de Toilette for men. Fresh aquatic fragrance, 100ml bottle.",
        images: [img("davidoff-perfume-men")],
      },
      {
        name: "Lotus Herbals 3-Step Skincare Kit",
        price: 1299, comparePrice: 1999,
        category: "Beauty & Personal Care", stock: 40, sku: "BEAU-003",
        description: "Lotus Herbals skincare kit with face wash, toner, and moisturizer. Suits all skin types.",
        images: [img("lotus-skincare-kit")],
      },
      {
        name: "Head & Shoulders Anti-Dandruff Shampoo 400ml",
        price: 399, comparePrice: 549,
        category: "Beauty & Personal Care", stock: 90, sku: "BEAU-004",
        description: "Clinically proven anti-dandruff shampoo. Removes dandruff in 1 wash, gentle on scalp.",
        images: [img("head-shoulders-shampoo")],
      },
      {
        name: "Himalaya Purifying Neem Face Wash 150ml",
        price: 149, comparePrice: 249,
        category: "Beauty & Personal Care", stock: 120, sku: "BEAU-005",
        description: "Himalaya neem face wash. Removes excess oil, prevents pimples, ideal for oily skin.",
        images: [img("himalaya-neem-facewash")],
      },
      {
        name: "OPI Nail Polish Set of 6 Shades",
        price: 1199, comparePrice: 1799,
        category: "Beauty & Personal Care", stock: 50, sku: "BEAU-006",
        description: "OPI nail polish set with 6 trendy shades. Chip-resistant, long-lasting, quick dry.",
        images: [img("opi-nail-polish")],
      },
      {
        name: "Philips EssentialCare Hair Dryer 1200W",
        price: 1499, comparePrice: 2199,
        category: "Beauty & Personal Care", stock: 30, sku: "BEAU-007",
        description: "Philips 1200W hair dryer with 2 heat/speed settings, cold shot button, concentrator nozzle.",
        images: [img("philips-hair-dryer")],
      },
      {
        name: "Maybelline Sky High Mascara",
        price: 499, comparePrice: 799,
        category: "Beauty & Personal Care", stock: 65, sku: "BEAU-008",
        description: "Maybelline Sky High mascara. Buildable formula that volumizes and lengthens lashes all day.",
        images: [img("maybelline-mascara")],
      },
      {
        name: "Neutrogena Hydro Boost Gel Cream 50ml",
        price: 699, comparePrice: 999,
        category: "Beauty & Personal Care", stock: 45, sku: "BEAU-009",
        description: "Neutrogena Hydro Boost water gel moisturizer with hyaluronic acid. Lightweight, non-greasy.",
        images: [img("neutrogena-moisturizer")],
      },
      {
        name: "Lakme Sun Expert SPF 50 Sunscreen 100ml",
        price: 349, comparePrice: 499,
        category: "Beauty & Personal Care", stock: 80, sku: "BEAU-010",
        description: "Lakme Sun Expert SPF 50 PA+++ sunscreen. Protects from UVA/UVB rays, non-oily finish.",
        images: [img("lakme-sunscreen-spf50")],
      },
    ],
  },
  // ── 7. Toys & Games ─────────────────────────────────────────────────────────
  {
    user: {
      name: "Vikram Nair",
      email: "vikram@tradezy.com",
      password: "vendor123",
      role: "vendor",
    },
    store: {
      name: "Vikram's Toy Kingdom",
      description: "Fun toys and games for kids and families of all ages",
      category: "Toys & Games",
      address: "G-9, Fun Zone Mall, Kolkata",
      contactEmail: "vikram@tradezy.com",
      contactPhone: "9432109876",
    },
    products: [
      {
        name: "LEGO Classic Creative Box 900 Pieces",
        price: 3499, comparePrice: 4999,
        category: "Toys & Games", stock: 20, sku: "TOYS-001",
        description: "LEGO Classic 900-piece creative box with colourful bricks. Sparks imagination in kids aged 4+.",
        images: [img("lego-classic-creative-box")],
      },
      {
        name: "Monopoly Board Game Classic Edition",
        price: 899, comparePrice: 1299,
        category: "Toys & Games", stock: 35, sku: "TOYS-002",
        description: "The classic Monopoly board game. Buy, sell, trade properties. Fun for the whole family.",
        images: [img("monopoly-board-game")],
      },
      {
        name: "Nerf Elite 2.0 Blaster",
        price: 1499, comparePrice: 2199,
        category: "Toys & Games", stock: 28, sku: "TOYS-003",
        description: "Nerf Elite 2.0 motorized blaster with 24 darts. Fires up to 27 metres for ages 8+.",
        images: [img("nerf-blaster-kids")],
      },
      {
        name: "Hot Wheels 20-Car Gift Pack",
        price: 999, comparePrice: 1499,
        category: "Toys & Games", stock: 50, sku: "TOYS-004",
        description: "Hot Wheels 20-car gift set with die-cast metal cars in assorted styles and colours.",
        images: [img("hot-wheels-cars-pack")],
      },
      {
        name: "Rubik's Cube 3x3 Original",
        price: 299, comparePrice: 499,
        category: "Toys & Games", stock: 80, sku: "TOYS-005",
        description: "Original 3x3 Rubik's Cube. Smooth turning mechanism, vibrant colours, great brain teaser.",
        images: [img("rubiks-cube-puzzle")],
      },
      {
        name: "1:18 Scale Remote Control Car",
        price: 1299, comparePrice: 1999,
        category: "Toys & Games", stock: 22, sku: "TOYS-006",
        description: "1:18 scale RC car with full-function remote. Reaches up to 20km/h, rechargeable battery.",
        images: [img("remote-control-car-rc")],
      },
      {
        name: "Mega Bloks Building Blocks 1000 Pcs",
        price: 1799, comparePrice: 2799,
        category: "Toys & Games", stock: 18, sku: "TOYS-007",
        description: "1000-piece building blocks set. Compatible with major brands, ideal for ages 3 and above.",
        images: [img("building-blocks-kids")],
      },
      {
        name: "UNO Deluxe Card Game",
        price: 399, comparePrice: 599,
        category: "Toys & Games", stock: 75, sku: "TOYS-008",
        description: "UNO Deluxe card game with 112 cards. Fast-paced fun for 2–10 players, ages 7 and up.",
        images: [img("uno-card-game-family")],
      },
      {
        name: "Barbie Dreamhouse 3-Storey Playset",
        price: 8999, comparePrice: 12999,
        category: "Toys & Games", stock: 8, sku: "TOYS-009",
        description: "Barbie Dreamhouse 3-storey playset with 8 rooms, elevator, pool, and 70+ accessories.",
        images: [img("barbie-dreamhouse-playset")],
      },
      {
        name: "Magnetic Chess & Checkers Set",
        price: 699, comparePrice: 1099,
        category: "Toys & Games", stock: 40, sku: "TOYS-010",
        description: "Magnetic chess and checkers combo set. Foldable board, pieces stay in place while travelling.",
        images: [img("chess-checkers-board")],
      },
    ],
  },

  // ── 8. Food & Beverages ──────────────────────────────────────────────────────
  {
    user: {
      name: "Anita Desai",
      email: "anita@tradezy.com",
      password: "vendor123",
      role: "vendor",
    },
    store: {
      name: "Anita's Fresh Mart",
      description: "Premium food, snacks, and beverages delivered fresh to your door",
      category: "Food & Beverages",
      address: "H-5, Market Yard, Nagpur",
      contactEmail: "anita@tradezy.com",
      contactPhone: "9321098765",
    },
    products: [
      {
        name: "Haldiram's Aloo Bhujia 1kg",
        price: 349, comparePrice: 450,
        category: "Food & Beverages", stock: 100, sku: "FOOD-001",
        description: "Haldiram's crispy Aloo Bhujia 1kg pack. Made with chickpea flour, potato, and spices.",
        images: [img("haldirams-bhujia-snack")],
      },
      {
        name: "Tata Tea Premium 500g",
        price: 249, comparePrice: 320,
        category: "Food & Beverages", stock: 90, sku: "FOOD-002",
        description: "Tata Tea Premium 500g. Strong, rich flavour from the finest Assam and Darjeeling tea leaves.",
        images: [img("tata-tea-premium-pack")],
      },
      {
        name: "Amul Butter Salted 500g",
        price: 299, comparePrice: 350,
        category: "Food & Beverages", stock: 60, sku: "FOOD-003",
        description: "Amul Salted Butter 500g. Made from pure milk fat, great for cooking and spreading.",
        images: [img("amul-butter-dairy")],
      },
      {
        name: "Britannia Good Day Cookies Assorted Box",
        price: 199, comparePrice: 280,
        category: "Food & Beverages", stock: 120, sku: "FOOD-004",
        description: "Britannia Good Day assorted cookie box with butter, cashew, and pista variants.",
        images: [img("britannia-cookies-box")],
      },
      {
        name: "Maggi Masala Noodles Pack of 12",
        price: 189, comparePrice: 240,
        category: "Food & Beverages", stock: 150, sku: "FOOD-005",
        description: "Maggi 2-minute Masala Noodles pack of 12. India's favourite instant noodles.",
        images: [img("maggi-masala-noodles")],
      },
      {
        name: "Pure Organic Forest Honey 500g",
        price: 399, comparePrice: 599,
        category: "Food & Beverages", stock: 45, sku: "FOOD-006",
        description: "100% pure organic forest honey. No added sugar, raw and unprocessed. Rich in antioxidants.",
        images: [img("organic-honey-jar")],
      },
      {
        name: "India Gate Basmati Rice Premium 5kg",
        price: 699, comparePrice: 899,
        category: "Food & Beverages", stock: 40, sku: "FOOD-007",
        description: "India Gate Premium Basmati Rice 5kg. Long grain, aromatic, perfect for biryani and pulao.",
        images: [img("basmati-rice-premium")],
      },
      {
        name: "Lindt Dark Chocolate Gift Box",
        price: 899, comparePrice: 1299,
        category: "Food & Beverages", stock: 30, sku: "FOOD-008",
        description: "Lindt Excellence Dark Chocolate gift box with 70%, 85%, and 90% cocoa variants.",
        images: [img("dark-chocolate-gift-box")],
      },
      {
        name: "Tetley Green Tea Assorted 100 Bags",
        price: 349, comparePrice: 499,
        category: "Food & Beverages", stock: 65, sku: "FOOD-009",
        description: "Tetley Green Tea assorted pack of 100 bags. Includes original, mint, lemon, and ginger.",
        images: [img("tetley-green-tea")],
      },
      {
        name: "Premium Mixed Dry Fruits 500g",
        price: 699, comparePrice: 999,
        category: "Food & Beverages", stock: 35, sku: "FOOD-010",
        description: "Premium mixed dry fruits 500g — cashews, almonds, raisins, pistachios, and walnuts.",
        images: [img("mixed-dry-fruits-premium")],
      },
    ],
  },
];

// ─── RUNNER ───────────────────────────────────────────────────────────────────

const RESET = process.argv.includes("--reset");

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB\n");

  if (RESET) {
    const allSkus = VENDORS_DATA.flatMap((v) => v.products.map((p) => p.sku));
    const { deletedCount } = await Product.deleteMany({ sku: { $in: allSkus } });
    console.log(`[reset] Removed ${deletedCount} seeded products\n`);
  }

  for (const entry of VENDORS_DATA) {
    // 1. Find or create vendor
    let vendor = await User.findOne({ email: entry.user.email });
    if (!vendor) {
      vendor = await new User(entry.user).save();
      console.log(`[+] Created vendor : ${vendor.name} <${vendor.email}>`);
    } else {
      console.log(`[=] Vendor exists  : ${vendor.name} <${vendor.email}>`);
    }

    // 2. Find or create store
    let store = await Store.findOne({ owner: vendor._id });
    if (!store) {
      store = await Store.create({ ...entry.store, owner: vendor._id });
      console.log(`    [+] Created store : ${store.name}`);
    } else {
      console.log(`    [=] Store exists  : ${store.name}`);
    }

    // 3. Pad products up to 10 (safe to re-run)
    const existing = await Product.countDocuments({ store: store._id });
    const needed = 10 - existing;
    if (needed <= 0) {
      console.log(`    [=] Already has ${existing} products — skipping\n`);
      continue;
    }

    const toInsert = entry.products
      .slice(0, needed)
      .map((p) => ({ ...p, store: store._id, vendor: vendor._id }));

    await Product.insertMany(toInsert);
    console.log(`    [+] Added ${toInsert.length} products (total now: ${existing + toInsert.length})\n`);
  }

  console.log("Seeding complete!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
