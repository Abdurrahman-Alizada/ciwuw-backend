import mongoose, { Model, Schema, Document, Types } from "mongoose";

interface ReturnProductsInterface extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  productIds: any;
  returnReason: string;
  status: string;
  returnDate: Date;
}

const returnProductsSchema = new Schema<ReturnProductsInterface>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order", // Reference to the Order table
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Customer", // Reference to the User table
      required: true,
    },

    returnReason: {
      type: String,
      required: true,
    },
    returnDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      default: "processing",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const ReturnProductsModel: Model<ReturnProductsInterface> =
  mongoose.model<ReturnProductsInterface>(
    "ReturnProducts",
    returnProductsSchema
  );

export { ReturnProductsInterface, ReturnProductsModel };
export default ReturnProductsModel;
