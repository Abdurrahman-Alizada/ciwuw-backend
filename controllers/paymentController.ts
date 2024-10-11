import { Request, Response } from "express";
import OrderModel from "../models/orderModel";
import Stripe from "stripe";
import ProductModel from "../models/productModel";
import createLog from "../utils/createLog";

const createCustomer = async (req: Request, res: Response) => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const customer = await stripe.customers.create({
      name: req.body.name as string,
      email: req.body.email as string,
    });

    res.status(200).send(customer);
  } catch (error) {
    res.status(400).send({ success: false, msg: (error as Error).message });
  }
};

const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const { items, UserDetails, address, deliveryCharges } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items array" });
    }

    const line_items = items.map((item: any) => {
      if (
        !item.id ||
        !item.priceInCents ||
        !item.color ||
        !item.size ||
        !item.quantity
      ) {
        throw new Error("Invalid item details");
      }

      // Add metadata for product details
      return {
        price_data: {
          currency: "gbp",
          product_data: {
            name: item.name,
            description: `Color: ${item.color}, Size: ${item.size}`,
          },
          unit_amount: item.priceInCents,
        },
        quantity: item.quantity,
      };
    });

    // Calculate the total amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.priceInCents * item.quantity,
      0
    );

    // Add delivery charges as a separate line item
    const freeDeliveryThreshold = 80 * 100; // £80
    const deliveryChargeAmount =
      totalAmount > freeDeliveryThreshold ? 0 : deliveryCharges * 100;

    if (deliveryChargeAmount > 0) {
      line_items.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: "Delivery Fee",
            description: "Standard delivery fee",
          },
          unit_amount: deliveryChargeAmount,
        },
        quantity: 1,
      });
    }

    // Process and update stock
    const processedProducts: any = [];
    for (const item of items) {
      const product: any = await ProductModel.findById(item.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with id ${item.id} not found`,
        });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product ${product.name}`,
        });
      }

      // Update product stock
      product.stock -= item.quantity;
      await product.save();

      // Prepare processed product details
      processedProducts.push({
        id: product._id,
        name: product.productName,
        image: product.images[0],
        quantity: item.quantity,
        priceInCents: item.priceInCents,
        supplier_link: product.supplier.supplier_link,
        size: item.size,
        color: item.color,
      });
    }

    // Create an order in the database
    const orderId = Math.floor(100000 + Math.random() * 900000).toString();
    const order = new OrderModel({
      orderId,
      UserDetails,
      products: processedProducts.map((item: any) => ({
        product: item.id,
        image: item.image,
        name: item.name,
        price: item.priceInCents,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        supplier_link: item.supplier_link,
      })),
      address,
      orderQuantity: processedProducts.length,
      totalPrice: totalAmount,
      status: "pending",
      paymentStatus: "pending",
      deliveryCharges: deliveryCharges,
    });

    // Create a Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${process.env.FRONT_END_URL}/payment-success`,
      cancel_url: `${process.env.FRONT_END_URL}/payment-cancel`,
      customer_email: UserDetails.email, // Use customer's email
      metadata: {
        orderId: order._id.toString(),
      },
    });

    await order.save();

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
};

const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook signature verification failed.`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session: any = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        const orderId = session.metadata.orderId;

        // Directly use the existing payment intent ID
        const paymentIntentId = session.payment_intent;
        // Update the order status in the database
        await OrderModel.findByIdAndUpdate(orderId, {
          paymentStatus: "completed",
          paymentIntentId: paymentIntentId,
        });
      }

      break;

    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

const StripePayment = async (req: Request, res: Response) => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const { amount, currency, customerId } = req.body;
    // res.json({amount:amount, currency:currency})
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2023-10-16" }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: currency,
      //   customer: customer.id,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      //   customer: customer.id,
      customer: customerId,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    res.json({
      error: error,
      message: "Something went wrong",
    });
  }
};

const processRefund = async (req: Request, res: Response) => {
  const { orderId, refundAmount } = req.body;
  const whom: any = req.user;

  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Fetch the order from the database
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if the order has a paymentIntentId
    if (!order.paymentIntentId) {
      return res
        .status(400)
        .json({ error: "No payment intent ID for this order" });
    }

    // Use the Stripe API to process the refund
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      amount: refundAmount * 100, // Refund amount in cents (e.g., £50 becomes 5000)
    });

    // Update the order status to reflect the refund
    order.status = "refunded";
    order.refundAmount = refundAmount;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      refund,
    });
    await createLog({
      dateTime: new Date(),
      action: `Refund ${refundAmount} against returned order with id:${orderId}`,
      logType: "Info",
      whom: {
        username: whom.username,
        email: whom.email,
        role: whom.role,
      },
    });
  } catch (error:any) {
    res.status(500).json({ message: error.message });
    await createLog({
      dateTime: new Date(),
      action: `Failed : Refund ${refundAmount} against returned order with id:${orderId}`,
      logType: "Error",
      whom: {
        username: whom?.username,
        email: whom.email,
        role: whom.role,
      },
    });
  }
};

export {
  createCustomer,
  StripePayment,
  processRefund,
  createCheckoutSession,
  handleStripeWebhook,
};
