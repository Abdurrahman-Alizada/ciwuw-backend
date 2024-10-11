import mongoose, { Model } from "mongoose";
import { BaseUserInterface, createBaseUserSchema } from "./baseUserModal";

interface AdminInterface extends BaseUserInterface {
  // Add any additional fields specific to Admin here
  adminSpecificField?: string;
}

const adminSchema = createBaseUserSchema<AdminInterface>({
  phoneNumberRequired: false, // Make phoneNumber optional for Admin
  addressRequired: false, // Make address optional for Admin
});

// Add any additional fields specific to the Admin schema
adminSchema.add({
  adminSpecificField: { type: String },
});

const AdminModel: Model<AdminInterface> = mongoose.model<AdminInterface>(
  "Admin",
  adminSchema
);
export { AdminInterface, AdminModel };
