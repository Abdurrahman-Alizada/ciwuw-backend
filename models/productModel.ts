import mongoose, { Model, Schema, Document, Types } from 'mongoose';

interface SupplierInterface extends Document {
	name: string;
	about: string;
	supplier_link: string;
}

interface ProductInterface extends Document {
	productId: string;
	productName: string;
	sizes: string[];
	shortDescription: string;
	longDescription: string;
	stock: number;
	price: number;
	discountPrice: number;
	brand: string;
	images: string[];
	colors: string[];
	ratingId: Types.ObjectId;
	category: mongoose.Types.ObjectId | string;
	subCategory: mongoose.Types.ObjectId | string;
	supplier: SupplierInterface;
	admin_private_note: string;
}

const supplierSchema = new Schema<SupplierInterface>({
	name: {
		type: String,
		required: true,
	},
	about: {
		type: String,
		required: true,
	},
	supplier_link: {
		type: String,
		required: true,
	},
});

const productSchema = new Schema<ProductInterface>(
	{
		productId: {
			type: String,
			required: true,
			unique: true,
		},
		productName: {
			type: String,
			required: true,
		},
		sizes: {
			type: [String],
			default: [],
		},
		shortDescription: {
			type: String,
			required: true,
		},
		longDescription: {
			type: String,
			required: true,
		},
		stock: {
			type: Number,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		discountPrice: {
			type: Number,
		},
		brand: {
			type: String,
			required: true,
		},
		images: {
			type: [String],
			default: [],
		},
		colors: {
			type: [String],
			default: [],
		},
		ratingId: {
			type: Schema.Types.ObjectId,
			ref: 'Rating', // Reference to the Rating table
		},
		category: {
			type: Schema.Types.ObjectId,
			ref: 'Category',
			required: true,
		},
		subCategory: {
			type: Schema.Types.ObjectId,
			ref: 'Category',
			// required: true,
		},
		supplier: {
			type: supplierSchema,
			required: true,
		},
		admin_private_note: {
			type: String,
		},
	},
	{
		timestamps: true, // Automatically adds createdAt and updatedAt fields
	}
);

const ProductModel: Model<ProductInterface> = mongoose.model<ProductInterface>(
	'Product',
	productSchema
);

export { ProductInterface, ProductModel };
export default ProductModel;
