import express from 'express';
import { sendNotification, notifyAll, sendNotificationToSingleUser } from "../Controllers/notificationController.js";
import {ensureAuthenticated} from '../Middlewares/Auth.js';
const router = express.Router();

// Route for sending notifications
router.post('/notification', ensureAuthenticated, sendNotification);
router.post('/notify-all', notifyAll);
router.post('/notify-single', ensureAuthenticated, sendNotificationToSingleUser);


export default router;
