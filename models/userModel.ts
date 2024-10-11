// models/User.ts
import mongoose, { Model, Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Interfaces
interface BaseUserInterface extends Document {
  username: string;
  email: string;
  password: string;
  role: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface AdminInterface extends BaseUserInterface {
  adminSpecificField?: string;
}

interface CustomerInterface extends BaseUserInterface {
  address: string;
  phoneNumber: string;
  status: string;
  isVerify: boolean;
}

// Base Schema
const baseUserSchema = new Schema<BaseUserInterface>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
  },
  {
    timestamps: true,
    discriminatorKey: "role",
  }
);

// Password hashing
baseUserSchema.pre<BaseUserInterface>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
baseUserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create the base model
const UserModel: Model<BaseUserInterface> = mongoose.model(
  "User",
  baseUserSchema
);

// Admin Schema
const adminSchema = new Schema<AdminInterface>({
  adminSpecificField: { type: String },
});

// Customer Schema
const customerSchema = new Schema<CustomerInterface>({
  address: { type: String },
  phoneNumber: { type: String },
  status: { type: String, default: "active" },
  isVerify: { type: Boolean, default: false },
});

// Create discriminators
const AdminModel = UserModel.discriminator<AdminInterface>(
  "Admin",
  adminSchema
);
const CustomerModel = UserModel.discriminator<CustomerInterface>(
  "Customer",
  customerSchema
);

export {
  BaseUserInterface,
  AdminInterface,
  CustomerInterface,
  AdminModel,
  CustomerModel,
};
