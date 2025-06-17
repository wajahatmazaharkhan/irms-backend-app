import express from 'express';
import { markAttendance, getAttendance, getAttedanceByid } from '../Controllers/AttendanceController.js';
import { deleteTodayAttendance } from '../Controllers/AttendanceController.js';

const router = express.Router();

router.post('/attendance', markAttendance);
router.get('/attendance', getAttendance);
router.get('/attendance/:userId', getAttedanceByid);
router.delete('/attendance/:userId', deleteTodayAttendance); 

export default router;
