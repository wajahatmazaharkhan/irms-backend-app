import express from 'express';
import {
  postLeaveApplication,
  getAllLeaveApplications,
  updateLeaveStatus,
  getOwnLeaveApplications   
} from '../Controllers/Leave.js';

import { ensureAuthenticated } from "../Middlewares/Auth.js"

const router = express.Router();

// ✅ Place this ABOVE '/leave' to avoid being overridden
router.get('/leave/mine', ensureAuthenticated, getOwnLeaveApplications);

// POST route to submit leave application by intern
router.post('/leave', ensureAuthenticated, postLeaveApplication);

// GET route to fetch all leave applications for admin
router.get('/leave', getAllLeaveApplications);

// PUT route to update leave application status by admin
router.put('/leave/:id', updateLeaveStatus);

export default router;
