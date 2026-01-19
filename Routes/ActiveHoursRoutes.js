import express from "express";
import { 
  getActiveHoursByRole, 
  getUserActiveHours, 
  getTopActiveUsers, 
  getActiveHoursTrends,
  getRoleComparison
} from "../Controllers/ActiveHoursController.js";
import { ensureAuthenticated } from "../Middlewares/Auth.js";

const router = express.Router();

// Active hours analytics routes
router.get("/by-role", ensureAuthenticated, getActiveHoursByRole);
router.get("/user/:userId", ensureAuthenticated, getUserActiveHours);
router.get("/top-active", ensureAuthenticated, getTopActiveUsers);
router.get("/trends", ensureAuthenticated, getActiveHoursTrends);
router.get("/comparison", ensureAuthenticated, getRoleComparison);

export default router;