import express from 'express';
import verifyToken from '../middleware/verifyToken';
import {
	createRating,
	getRatingDetails,
	getRatingsForProduct,
	updateRating,
	getAllRatings,
} from '../controllers/ratingController';
const router = express.Router();

router.post('/createRating', createRating);
router.get('/getAllRatingsForProduct/:productId', getRatingsForProduct);
router.get('/getRatingDetails/:id', getRatingDetails);
router.get('/getAllRating', getAllRatings);
router.put('/update/:id', updateRating);

export default router;
