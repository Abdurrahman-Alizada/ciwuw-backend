// routes/logRoutes.ts
import express from 'express';
import { createLog, getAllLogs } from '../controllers/logController';

const router = express.Router();

router.post('/create', createLog);
router.get('/getAll', getAllLogs);

export default router;
