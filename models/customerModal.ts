import mongoose, { Model } from "mongoose";
import { BaseUserInterface, createBaseUserSchema } from "./baseUserModal";

interface CustomerInterface extends BaseUserInterface {
  isVerify: boolean;
}

const customerSchema = createBaseUserSchema<CustomerInterface>({
  phoneNumberRequired: false, // Make phoneNumber required for Customer
  addressRequired: false, // Make address required for Customer
});

// Add any additional fields specific to the Customer schema
customerSchema.add({
  isVerify: { type: Boolean, default: false, required: true },
});

const CustomerModel: Model<CustomerInterface> =
  mongoose.models.Customer ||
  mongoose.model<CustomerInterface>("Customer", customerSchema);

export { CustomerInterface, CustomerModel };
