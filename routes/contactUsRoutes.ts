// routes/contactUsRoutes.ts

import express from 'express';
import { submitContactForm } from '../controllers/contactUsController';

const router = express.Router();

// Route to submit the contact form
router.post('/submit', submitContactForm);

export default router;
