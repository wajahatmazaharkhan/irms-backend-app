import express from 'express';
import { signupValidation, loginValidation } from '../Middlewares/AuthValidation.js';
import { signup, login,getUserById, logout } from '../Controllers/AuthController.js';
import { ensureAuthenticated } from '../Middlewares/Auth.js';
import { updateProfile } from '../Controllers/ProfileController.js';

const router = express.Router();

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/user/:id', getUserById);
router.post('/logout', ensureAuthenticated, logout);
router.post('/user/update-profile', ensureAuthenticated, updateProfile);


export default router;
