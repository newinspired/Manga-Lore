require("dotenv").config(); // 🔑 charge .env en local

const functions = require("firebase-functions");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

exports.createCheckoutSession = functions.https.onRequest(
  async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: "http://localhost:5173/success",
        cancel_url: "http://localhost:5173/checkout",
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
