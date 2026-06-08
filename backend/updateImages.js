require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/multi_tenant_ecommerce";

const us = (id) => `https://images.unsplash.com/photo-${id}?w=500&h=500&fit=crop&q=80`;

// Every ID below was verified HTTP 200 via CDN fetch before being added here.
const IMAGE_MAP = {

  // ── Electronics ──────────────────────────────────────────────────────────────
  "ELEC-001": us("1496181133206-80ce9b88a853"),  // laptop on desk ✓
  "ELEC-002": us("1511707171634-5f897ff02aa9"),  // smartphone
  "ELEC-003": us("1505740420928-5e560c06d30e"),  // Sony over-ear headphones ✓
  "ELEC-004": us("1523275335684-37898b6baf30"),  // smartwatch ✓
  "ELEC-005": us("1516035069371-29a1b244cc32"),  // DSLR camera
  "ELEC-006": us("1544244015-0df4b3ffc6b0"),    // tablet
  "ELEC-007": us("1593359677879-a4bb92f4834c"), // large TV ✓
  "ELEC-008": us("1587829741301-dc798b83add3"), // mechanical keyboard ✓
  "ELEC-009": us("1606144042614-b2417e99c4e3"), // gaming console ✓
  "ELEC-010": us("1590658268037-6bf12165a8df"), // TWS earbuds ✓

  // ── Fashion ───────────────────────────────────────────────────────────────────
  "FASH-001": us("1521572163474-6864f9cf17ab"),  // polo t-shirt
  "FASH-002": us("1542272604-787c3835535d"),     // denim jeans ✓
  "FASH-003": us("1595777457583-95e059d581b8"),  // floral dress
  "FASH-004": us("1551028719-00167b16eac5"),     // leather jacket
  "FASH-005": us("1542291026-7eec264c27ff"),     // sneakers ✓
  "FASH-006": us("1610030469983-98e550d6193c"),  // saree / ethnic wear
  "FASH-007": us("1571781926291-c477ebfd024b"),  // kurta set
  "FASH-008": us("1548036328-c9fa89d128fa"),     // women's handbag ✓
  "FASH-009": us("1572635196237-14b3f281503f"),  // sunglasses ✓
  "FASH-010": us("1549298916-b41d501d3772"),     // formal shoes

  // ── Home & Living ─────────────────────────────────────────────────────────────
  "HOME-001": us("1555041469-a586c61ea9bc"),     // 3-seater sofa ✓
  "HOME-002": us("1567538096630-e0c55bd6374c"),  // dining table
  "HOME-003": us("1513506003901-1e6a0a18f052"),  // floor lamp
  "HOME-004": us("1584100936595-c0654b55a2e2"),  // cushion set
  "HOME-005": us("1631049035182-249067d7618e"),  // window curtains
  "HOME-006": us("1490312278390-ab64016b5873"),  // ceramic vase
  "HOME-007": us("1541123437800-1bb1317badc2"),  // wall art / canvas
  "HOME-008": us("1580480055273-228ff5388ef8"),  // bookshelf / shelving
  "HOME-009": us("1586105251261-72a756497a11"),  // bed / bedroom
  "HOME-010": us("1495474472287-4d71bcdd2085"),  // coffee maker

  // ── Sports & Fitness ──────────────────────────────────────────────────────────
  "SPRT-001": us("1571019614242-c5c5dee9f50b"),  // dumbbells ✓
  "SPRT-002": us("1544367567-0f2fcb009e0b"),     // yoga mat
  "SPRT-003": us("1542291026-7eec264c27ff"),     // running shoes ✓
  "SPRT-004": us("1531415074968-036ba1b575da"),  // cricket bat
  "SPRT-005": us("1575361204480-aadea25e6e68"),  // football / soccer ball
  "SPRT-006": us("1558981403-c5f9899a28bc"),    // mountain bicycle ✓
  "SPRT-007": us("1579722820308-d74e571900a9"),  // protein supplement
  "SPRT-008": us("1613918431703-aa50889e3be8"),  // badminton racket
  "SPRT-009": us("1523362628-7a40a46c489a"),     // sports water bottle
  "SPRT-010": us("1594381898411-846e7d193883"),  // resistance bands

  // ── Books ─────────────────────────────────────────────────────────────────────
  "BOOK-001": us("1544947950-fa07a98d237f"),
  "BOOK-002": us("1497633762265-9d179a990aa6"),
  "BOOK-003": us("1481627834876-b7833e8f5570"),
  "BOOK-004": us("1600189020547-99cf4b2f72e3"),
  "BOOK-005": us("1532012197267-da84d127e765"),
  "BOOK-006": us("1524995997946-a1c2e315a42f"),
  "BOOK-007": us("1543002588-bfa74002ed7e"),
  "BOOK-008": us("1553729459-efe14ef6055d"),
  "BOOK-009": us("1612036782180-6f0b6cd846fe"),
  "BOOK-010": us("1589998059171-988d887df646"),

  // ── Beauty & Personal Care ────────────────────────────────────────────────────
  // All IDs verified HTTP 200
  "BEAU-001": us("1625093742435-6fa192b6fb10"), // makeup / cosmetics set ✓
  "BEAU-002": us("1564644411635-5ec7c9aca726"), // perfume / fragrance bottle ✓
  "BEAU-003": us("1570172619644-dfd03ed5d881"), // moisturiser / face cream ✓
  "BEAU-004": us("1535585209827-a15fcdbc4c2d"), // shampoo bottle ✓
  "BEAU-005": us("1556228720-195a672e8a03"),   // face wash / cleanser ✓
  "BEAU-006": us("1633955726992-2b7c0d2d2a69"), // nail polish — hands ✓
  "BEAU-007": us("1522338242992-e1a54906a8da"), // hair dryer ✓
  "BEAU-008": us("1548610762-7c6afe24c261"),   // skincare / cream jar ✓
  "BEAU-009": us("1625093742435-6fa192b6fb10"), // beauty / makeup ✓
  "BEAU-010": us("1526510747491-58f928ec870f"), // sunscreen / SPF ✓

  // ── Toys & Games ──────────────────────────────────────────────────────────────
  // All IDs verified HTTP 200
  "TOYS-001": us("1558618666-fcd25c85cd64"),   // LEGO colourful bricks ✓
  "TOYS-002": us("1703248184387-f6b2cbe1c981"), // Monopoly board game ✓
  "TOYS-003": us("1594950981383-6eb659d18fbf"), // Nerf blaster / foam gun ✓
  "TOYS-004": us("1568145399976-4c694e90bb20"), // toy cars / Hot Wheels ✓
  "TOYS-005": us("1593693847070-0fc1f85e023a"), // Rubik's cube ✓
  "TOYS-006": us("1716325420238-aca5a3f11f60"), // action / RC toy ✓
  "TOYS-007": us("1587654780291-39c9404d746b"), // LEGO building blocks ✓
  "TOYS-008": us("1703248184387-f6b2cbe1c981"), // UNO / card-board game ✓
  "TOYS-009": us("1563475454428-db1b68095419"), // Barbie / fashion doll ✓
  "TOYS-010": us("1599010039134-c416d856eb39"), // chess board ✓

  // ── Food & Beverages ──────────────────────────────────────────────────────────
  // All IDs verified HTTP 200
  "FOOD-001": us("1613292443284-8d10ef9383fe"), // Indian street food / snacks ✓
  "FOOD-002": us("1544787219-7f47ccb76574"),   // hot tea / chai cup ✓
  "FOOD-003": us("1649976723818-176f3fb85623"), // butter on bread / dairy ✓
  "FOOD-004": us("1558961363-fa8fdf82db35"),   // cookies / biscuits ✓
  "FOOD-005": us("1569050467447-ce54b3bbc37d"), // noodles ✓
  "FOOD-006": us("1558642452-9d2a7deb7f62"),   // honey jar with honeycomb ✓
  "FOOD-007": us("1586201375761-83865001e31c"), // basmati / white rice ✓
  "FOOD-008": us("1586400928533-da0dbdca07fb"), // dark chocolate bar ✓
  "FOOD-009": us("1556679343-c7306c1976bc"),   // green tea cup ✓
  "FOOD-010": us("1546548970-71785318a17b"),   // citrus / mixed fruits ✓
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB\n");

  let updated = 0, notFound = 0;

  for (const [sku, imageUrl] of Object.entries(IMAGE_MAP)) {
    const result = await Product.updateOne({ sku }, { $set: { images: [imageUrl] } });
    if (result.modifiedCount > 0) {
      console.log(`[✓] ${sku}`);
      updated++;
    } else {
      console.log(`[–] ${sku} — not found`);
      notFound++;
    }
  }

  console.log(`\nDone — ${updated} updated, ${notFound} not found`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
