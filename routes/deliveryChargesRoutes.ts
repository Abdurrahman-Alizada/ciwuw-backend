import express from 'express';
import {
	createDeliveryCharges,
	viewDeliveryCharges,
	updateDeliveryCharges,
	deleteDeliveryCharges,
} from '../controllers/deliveryChargesController';
import verifyToken from '../middleware/verifyToken';

const router = express.Router();

// Create delivery charges
router.post('/create', verifyToken, createDeliveryCharges);

// View all delivery charges
router.get('/view', viewDeliveryCharges);

// Update delivery charges by ID
router.put('/update/:id', verifyToken, updateDeliveryCharges);

// Delete delivery charges by ID
router.delete('/delete/:id', verifyToken, deleteDeliveryCharges);

export default router;
