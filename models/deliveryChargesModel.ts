import mongoose, { Schema, Document } from 'mongoose';

interface DeliveryChargesInterface extends Document {
	deliveryCharges: number;
	createdAt: Date;
	updatedAt: Date;
}

const deliveryChargesSchema = new Schema<DeliveryChargesInterface>(
	{
		deliveryCharges: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true, // Automatically adds createdAt and updatedAt fields
	}
);

const DeliveryChargesModel = mongoose.model<DeliveryChargesInterface>(
	'DeliveryCharges',
	deliveryChargesSchema
);

export { DeliveryChargesInterface, DeliveryChargesModel };
