import mongoose, { Schema, Document, Types } from 'mongoose';
interface ProductDetail {
	product: Types.ObjectId;
	image: string;
	name: string;
	price: number;
	color: string;
	size: string;
	quantity: number;
}
interface RatingInterface extends Document {
	noOfStars: number;
	content: string;
	UserDetails: mongoose.Types.ObjectId | string;
	orderId: mongoose.Types.ObjectId | string;
	product: ProductDetail;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}

const ratingSchema = new Schema<RatingInterface>(
	{
		noOfStars: {
			type: Number,
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			required: true,
			default: 'under-review', // "under-review" "published" "not-accepted"
		},
		UserDetails: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		orderId: {
			type: Schema.Types.ObjectId,
			ref: 'Order', // Reference to the Order table
			required: true,
		},
		product: {
			product: {
				type: Schema.Types.ObjectId,
				ref: 'Product',
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
		},
	},
	{
		timestamps: true,
	}
);

const RatingModel = mongoose.model<RatingInterface>('Rating', ratingSchema);

export { RatingInterface, RatingModel };
