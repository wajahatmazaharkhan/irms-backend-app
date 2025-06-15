import express from 'express';
import { sendResetOtp, verifyResetOtp, resetPassword } from '../Controllers/Passwordcontroller.js';

const router = express.Router();

// Route for updating password
router.post('/sendresetotp', sendResetOtp);
router.post('/verifyresetotp', verifyResetOtp);
router.post('/resetpassword', resetPassword);

export default router;
