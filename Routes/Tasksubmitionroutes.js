import express from 'express';
import { getTasksreports, upload,deleteTaskSubmissionByTaskId, submitTaskSchema } from '../Controllers/Tasksubmitioncontroller.js';
import { ensureAuthenticated } from '../Middlewares/Auth.js';
import { getNotifications, deleteNotification } from '../Controllers/notificationController.js';

const router = express.Router();

router.post('/submitTask', ensureAuthenticated, upload.fields([{ name: 'file' }, { name: 'image' }]), submitTaskSchema);
router.get('/getsubmitedtasks', getTasksreports);
router.post('/get-notifications', getNotifications);
router.delete('/delete-notification', ensureAuthenticated, deleteNotification);
router.delete('/deletetasksubmition/:taskId', deleteTaskSubmissionByTaskId);

export default router;