import express from 'express';
import { sendResetOtp, verifyResetOtp, resetPassword,sendSignupOtp,verifySignupOtp } from '../Controllers/Passwordcontroller.js';

const router = express.Router();

// Route for updating password
router.post('/sendresetotp', sendResetOtp);
router.post('/verifyresetotp', verifyResetOtp);
router.post('/resetpassword', resetPassword);
router.post('/signuprequest',sendSignupOtp);
router.post('/signupvalidate',verifySignupOtp);

export default router;
