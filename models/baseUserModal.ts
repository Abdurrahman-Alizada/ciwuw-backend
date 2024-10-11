import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

interface BaseUserInterface extends Document {
  username: string;
  email: string;
  phoneNumber?: string; // Optional
  password: string;
  address?: string; // Optional
  status: string;
  role: string;
  isVerify: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Generic base schema creation function
function createBaseUserSchema<T extends BaseUserInterface>(
  options: { phoneNumberRequired?: boolean; addressRequired?: boolean } = {}
) {
  const baseUserSchema = new Schema<T>(
    {
      username: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      phoneNumber: {
        type: String,
        required: options.phoneNumberRequired || false,
      }, // Optional
      password: { type: String, required: true },
      address: { type: String, required: options.addressRequired || false }, // Optional
      status: { type: String, default: "active" },
      role: { type: String, required: true },
      isVerify: { type: Boolean, default: false },
    },
    {
      timestamps: true,
    }
  );

  // Password hashing
  baseUserSchema.pre<T>("save", async function (next) {
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

  return baseUserSchema;
}

export { BaseUserInterface, createBaseUserSchema };
