import mongoose, { Schema, Document } from "mongoose";

interface ICartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  favourite: boolean;
  category: string;
  uId: string;
  _id: string;
  price: number;
  name: string;
  images: string[];
  dateAndTimeOf: Date;
}

interface ICart extends Document {
  userId: string;
  items: ICartItem[];
  lastReminderSent: Date;
  reminderStage: number;
}

const CartSchema: Schema<ICart> = new Schema({
  userId: { type: String, required: true, unique: true },
  items: [
    {
      productId: String,
      size: String,
      color: String,
      quantity: Number,
      favourite: Boolean,
      category: String,
      uId: String,
      _id: String,
      price: Number,
      name: String,
      images: [String],
      dateAndTimeOf: { type: Date, default: Date.now },
    },
  ],
  // ... other cart fields
  reminderStage: {
    type: Number, // 0 for no email sent, 1 for 1-hour email, 2 for 1-day, 3 for 7-days
    default: 0,
  },
  lastReminderSent: {
    type: Date, // To track when the last reminder was sent
    default: null,
  },
});

export default mongoose.model<ICart>("Cart", CartSchema);
