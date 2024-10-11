import mongoose, { Model, Schema, Document, Types } from "mongoose";

interface OrderProduct {
  product: Types.ObjectId;
  image: string;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  returned: boolean;
}

interface OrderInterface extends Document {
  orderId: string;
  UserDetails: Types.ObjectId;
  products: OrderProduct[];
  address: {
    address: string;
    city: string;
    province: string;
    country: string;
  };
  orderQuantity: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  deliveryCharges: number;
  paymentIntentId: string; // Corrected type
  refundAmount?: number; // Optional field for refunds
}

const orderSchema = new Schema<OrderInterface>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    UserDetails: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        image: {
          type: String,
        },
        name: {
          type: String,
        },
        price: {
          type: Number,
        },
        color: {
          type: String,
        },
        size: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        returned: {
          type: Boolean,
          default: false,
        },
        supplier_link: {
          type: String,
        },
      },
    ],
    address: {
      type: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        province: { type: String, required: true },
        country: { type: String, required: true },
      },
      required: true,
    },
    orderQuantity: {
      type: Number,
    },
    totalPrice: {
      type: Number,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
    paymentStatus: {
      type: String,
      required: true,
      default: "pending",
    },
    deliveryCharges: {
      type: Number,
    },
    paymentIntentId: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const OrderModel: Model<OrderInterface> = mongoose.model<OrderInterface>(
  "Order",
  orderSchema
);

export { OrderInterface, OrderModel };
export default OrderModel;
