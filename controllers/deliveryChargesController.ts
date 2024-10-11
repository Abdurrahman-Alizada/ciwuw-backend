import { Request, Response } from 'express';
import {
	DeliveryChargesInterface,
	DeliveryChargesModel,
} from '../models/deliveryChargesModel';

// Create Delivery Charges
const createDeliveryCharges = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { deliveryCharges } = req.body;
		const newDeliveryCharges = new DeliveryChargesModel({ deliveryCharges });
		await newDeliveryCharges.save();
		res.status(201).json(newDeliveryCharges);
	} catch (error) {
		res.status(500).json({ message: 'Internal Server Error' });
	}
};

// View All Delivery Charges
const viewDeliveryCharges = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const deliveryCharges = await DeliveryChargesModel.find();
		res.status(200).json(deliveryCharges);
	} catch (error) {
		res.status(500).json({ message: 'Internal Server Error' });
	}
};

// Update Delivery Charges by ID
const updateDeliveryCharges = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params;
		const { deliveryCharges } = req.body;
		const updatedCharges = await DeliveryChargesModel.findByIdAndUpdate(
			id,
			{ deliveryCharges },
			{ new: true }
		);
		if (!updatedCharges) {
			res.status(404).json({ message: 'Delivery Charges not found' });
			return;
		}
		res.json(updatedCharges);
	} catch (error) {
		res.status(500).json({ message: 'Internal Server Error' });
	}
};

// Delete Delivery Charges by ID
const deleteDeliveryCharges = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params;
		const deletedCharges = await DeliveryChargesModel.findByIdAndDelete(id);
		if (!deletedCharges) {
			res.status(404).json({ message: 'Delivery Charges not found' });
			return;
		}
		res.json({ message: 'Delivery Charges deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Internal Server Error' });
	}
};

export {
	createDeliveryCharges,
	viewDeliveryCharges,
	updateDeliveryCharges,
	deleteDeliveryCharges,
};
