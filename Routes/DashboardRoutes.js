import express from 'express';
import { getActiveUsers, getTimeSpentByUsers, getMostUsedFeatures, getUserFeatureUsage, getFeatureUsageTrends } from '../Controllers/DashboardController.js';
import { ensureAuthenticated } from '../Middlewares/Auth.js';

const router = express.Router();

router.get('/active-users', ensureAuthenticated, getActiveUsers);
router.get('/time-spent', ensureAuthenticated, getTimeSpentByUsers);

// Feature Usage Analytics Routes
router.get('/most-used-features', ensureAuthenticated, getMostUsedFeatures);
router.get('/user/:userId/feature-usage', ensureAuthenticated, getUserFeatureUsage);
router.get('/feature-usage-trends', ensureAuthenticated, getFeatureUsageTrends);

export default router; 