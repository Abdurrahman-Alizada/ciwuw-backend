import express from "express";
import {
  saveCartForLoggedInUser,
  getCartForLoggedInUser,
  updateCartItemQuantity,
  deleteCartItem,
  checkCartForOldItems,
} from "../controllers/cartController";

const router = express.Router();

// Route to add or update an item in the cart
router.post("/save", saveCartForLoggedInUser);

// Route to retrieve cart items for a user
router.get("/getCart/:userId", getCartForLoggedInUser);

// Route to update the quantity of an item in the cart
router.put("/update-quantity", updateCartItemQuantity);

// Route to delete an item from the cart
router.delete("/delete-item", deleteCartItem);
router.get("/checkCart", checkCartForOldItems);

export default router;
