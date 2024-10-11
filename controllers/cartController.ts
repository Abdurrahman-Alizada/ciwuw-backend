import { Request, Response } from "express";
import Cart from "../models/cartModal";
import moment from "moment";
import { sendReminderEmail } from "../services/cartService";

// Add or update a single item in the cart
export const saveCartForLoggedInUser = async (req: Request, res: Response) => {
  const { userId, cartItems } = req.body;

  try {
    if (!Array.isArray(cartItems)) {
      return res.status(400).json({
        message: "Invalid cart data: cartItems should be a non-empty array.",
      });
    }

    // If cartItems is empty, delete the cart for the user
    if (cartItems.length === 0) {
      await Cart.deleteOne({ userId });
      return res.status(200).json({ message: "Cart deleted successfully." });
    }

    // Find the existing cart for the user
    const existingCart = await Cart.findOne({ userId });

    // Check if cartItems have changed
    const hasCartChanged =
      !existingCart ||
      JSON.stringify(existingCart.items) !== JSON.stringify(cartItems);

    // If cartItems have changed, reset lastReminderSent and reminderStage
    const updateFields: any = { items: cartItems };
    if (hasCartChanged) {
      updateFields.lastReminderSent = null;
      updateFields.reminderStage = 0;
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    res.status(500).json({ message: "Failed to update cart", error });
  }
};

// Update the quantity of an item in the cart
export const updateCartItemQuantity = async (req: Request, res: Response) => {
  const { userId, cartItemId, quantity } = req.body;

  try {
    // Find the cart by userId
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the item to update by cartItemId
    const itemIndex = cart.items.findIndex(
      (item) => item && item._id && item._id.toString() === cartItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Update the quantity of the item
    cart.items[itemIndex].quantity = quantity;

    // Save the updated cart
    await cart.save();

    res
      .status(200)
      .json({ message: "Cart item quantity updated successfully", cart });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error updating cart item quantity:", error);
    res
      .status(500)
      .json({ message: "Failed to update cart item quantity", error });
  }
};

// Delete an item from the cart
export const deleteCartItem = async (req: Request, res: Response) => {
  const { userId, cartItemId } = req.body;

  try {
    // Find the cart by userId
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the item to delete by cartItemId
    const itemIndex = cart.items.findIndex(
      (item) => item && item._id && item._id.toString() === cartItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: "Cart item deleted successfully", cart });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Failed to delete cart item", error });
  }
};

// Retrieve cart items for the logged-in user
export const getCartForLoggedInUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ cart: [] });
    }

    const validItems = cart.items.filter(
      (item) => item.images && item.images.length > 0
    );

    res.status(200).json({ cart: validItems });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve cart", error });
  }
};

// Function to send reminder emails for old cart items
export const checkCartForOldItems = async (req: Request, res: Response) => {
  try {
    const now = moment();

    // Find carts that contain items and haven't had emails sent for the current stage
    const carts = await Cart.find({
      items: {
        $elemMatch: {
          dateAndTimeOf: { $lte: moment().subtract(5, "minutes").toDate() }, // Only find carts with items older than 5 minutes
        },
      },
    });

    for (const cart of carts) {
      const lastReminderSent = cart.lastReminderSent
        ? moment(cart.lastReminderSent)
        : null;
      const timeSinceLastReminder = lastReminderSent
        ? now.diff(lastReminderSent, "minutes")
        : null;

      for (const item of cart.items) {
        const itemAge = now.diff(moment(item.dateAndTimeOf), "minutes");

        // Send first email after 5 minutes
        if (itemAge >= 5 && cart.reminderStage === 0) {
          await sendReminderEmail(cart.userId, cart.items, "5 minutes");
          cart.reminderStage = 1;
          cart.lastReminderSent = now.toDate(); // Track when the first email was sent
        }

        // Send second email 10 minutes after the first email
        else if (
          cart.reminderStage === 1 &&
          timeSinceLastReminder !== null &&
          timeSinceLastReminder >= 10
        ) {
          await sendReminderEmail(cart.userId, cart.items, "10 minutes");
          cart.reminderStage = 2;
          cart.lastReminderSent = now.toDate(); // Track when the second email was sent
        }

        // Send third email 15 minutes after the second email
        else if (
          cart.reminderStage === 2 &&
          timeSinceLastReminder !== null &&
          timeSinceLastReminder >= 15
        ) {
          await sendReminderEmail(cart.userId, cart.items, "15 minutes");
          cart.reminderStage = 3; // No more reminders after this
          cart.lastReminderSent = now.toDate(); // Track when the third email was sent
        }
      }

      // Save the updated reminderStage and lastReminderSent timestamp
      await cart.save();
    }

    res.status(200).json({ message: "Reminder emails sent if applicable." });
  } catch (error) {
    console.error("Error checking carts:", error);
    res.status(500).json({ message: "Failed to check carts", error });
  }
};
