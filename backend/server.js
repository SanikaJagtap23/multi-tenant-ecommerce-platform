const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

connectDB();

const app = express();

// Stripe webhook needs raw body — mount before express.json()
if (process.env.STRIPE_WEBHOOK_SECRET) {
  app.post(
    "/api/orders/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      const sig = req.headers["stripe-signature"];
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === "payment_intent.succeeded") {
        const Order = require("./models/Order");
        const pi = event.data.object;
        await Order.findOneAndUpdate(
          { stripePaymentId: pi.id },
          { paymentStatus: "paid" }
        );
      }

      res.json({ received: true });
    }
  );
}

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running", env: process.env.NODE_ENV });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/stores", require("./routes/storeRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
