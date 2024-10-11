import mongoose, { Schema, Document } from "mongoose";

interface CategoryInterface extends Document {
  categoryName: string;
  description: string;
  parentCategory?: mongoose.Types.ObjectId | CategoryInterface;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subcategories: any[];
  division: "Men" | "Women" | "Children"; // New division field
}

const categorySchema = new Schema<CategoryInterface>(
  {
    categoryName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    division: {
      type: String,
      enum: ["Men", "Women", "Children"], // Restrict values to the enum
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const CategoryModel = mongoose.model<CategoryInterface>(
  "Category",
  categorySchema
);

export { CategoryInterface, CategoryModel };
