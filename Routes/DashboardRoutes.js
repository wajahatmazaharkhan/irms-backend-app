import express from 'express';
import { getActiveUsers, getTimeSpentByUsers } from '../Controllers/DashboardController.js';
import { ensureAuthenticated } from '../Middlewares/Auth.js';

const router = express.Router();

router.get('/active-users', ensureAuthenticated, getActiveUsers);
router.get('/time-spent', ensureAuthenticated, getTimeSpentByUsers);

export default router; 