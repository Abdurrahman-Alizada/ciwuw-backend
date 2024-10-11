import express from 'express';
import verifyToken from '../middleware/verifyToken';
import {
	createProduct,
	deleteProduct,
	getAllProductsCustomer,
	getAllProductsAdmin,
	getAllProductsByCategoryId,
	getAllProductsByCategoryName,
	getNewArrivalProducts,
	getNewArrivalProductsByCategory,
	getProductDetail,
	getTopRatedProductsByCategory,
	getTopRatedProductsOverall,
	searchProducts,
	updateProduct,
	getAllProductsOfAdmin,
} from '../controllers/productController';
import isAdmin from '../middleware/adminAuth';
const router = express.Router();

router.post('/createProduct', verifyToken, isAdmin, createProduct);
router.get('/getAllProductsCustomer', getAllProductsCustomer);
router.get('/getAllProductsAdmin', getAllProductsAdmin);
router.get(
	'/getAllProductsOfAdmin',
	verifyToken,
	isAdmin,
	getAllProductsOfAdmin
);
router.get('/productDetails/:id', getProductDetail);
router.put('/updateProduct/:id', verifyToken, updateProduct);
router.delete('/deleteProduct/:id', verifyToken, deleteProduct);
router.get('/search', searchProducts);
router.get('/getTopRatedProductsByCategory', getTopRatedProductsByCategory);
router.get('/getProductsByCategoryId/:categoryId', getAllProductsByCategoryId);
router.get(
	'/getProductsByCategoryName/:categoryName',
	getAllProductsByCategoryName
);
router.get('/newArrivals', getNewArrivalProducts);
router.get('/getNewArrivalProductsByCategory', getNewArrivalProductsByCategory);

router.get('/getTopRatedProductsOverall', getTopRatedProductsOverall);

export default router;
