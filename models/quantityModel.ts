import mongoose, { Model, Schema, Document, Types } from "mongoose";

// Define interface for Quantity document
interface QuantityInterface extends Document {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

// Define Quantity schema
const QuantitySchema = new Schema<QuantityInterface>(
  {
    quantity: {
      type: Number,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export Quantity model
const QuantityModel: Model<QuantityInterface> =
  mongoose.model<QuantityInterface>("Quantity", QuantitySchema);

export default QuantityModel;
