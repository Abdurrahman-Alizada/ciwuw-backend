import express from 'express';
import verifyToken from '../middleware/verifyToken';
import isAdmin from '../middleware/adminAuth';
import {
	createReturnProduct,
	deleteReturnProduct,
	getAllReturnProducts,
	getReturnProductDetails,
	updateReturnProduct,
	returnProductByCustomerId,
} from '../controllers/returnProductController';

const router = express.Router();

router.post('/createReturnProduct', verifyToken, createReturnProduct);
router.get('/getAllReturnProducts', getAllReturnProducts);
router.get('/returnProductDetails/:id', getReturnProductDetails);
router.put(
	'/updateReturnProduct/:id',
	verifyToken,
	isAdmin,
	updateReturnProduct
);
router.delete(
	'/deleteReturnProduct/:id',
	verifyToken,
	isAdmin,
	deleteReturnProduct
);
router.get('/returnProductByCustomerId/:id', returnProductByCustomerId);

export default router;
