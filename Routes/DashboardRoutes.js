import express from 'express';
import { getActiveUsers, getTimeSpentByUsers, getWeeklyActiveUsers } from '../Controllers/DashboardController.js';
import { ensureAuthenticated } from '../Middlewares/Auth.js';

const router = express.Router();

router.get('/active-users', ensureAuthenticated, getActiveUsers);
router.get('/time-spent', ensureAuthenticated, getTimeSpentByUsers);
router.get('/weekly-active-users', ensureAuthenticated, getWeeklyActiveUsers);

export default router; 