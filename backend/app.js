const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const path    = require("path");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ─── Stripe Webhook (raw body required — must be before express.json) ─────────
if (process.env.STRIPE_WEBHOOK_SECRET) {
  app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      const sig    = req.headers["stripe-signature"];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      const { _failOrders } = require("./controllers/paymentController");
      const Order   = require("./models/Order");
      const Payment = require("./models/Payment");

      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        await Order.updateMany(
          { stripePaymentId: pi.id, status: "payment_pending" },
          { status: "pending", paymentStatus: "paid" }
        );
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: pi.id },
          { status: "paid" }
        );
      }

      if (event.type === "payment_intent.payment_failed") {
        const pi = event.data.object;
        const failureMsg = pi.last_payment_error?.message || "Payment failed";
        const order = await Order.findOne({ stripePaymentId: pi.id });
        if (order) {
          await _failOrders(pi.id, order.customer, failureMsg);
        }
      }

      res.json({ received: true });
    }
  );
}

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ─── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "API is running", env: process.env.NODE_ENV })
);

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/admin",    require("./routes/adminRoutes"));
app.use("/api/stores",   require("./routes/storeRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders",   require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));

// ─── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
