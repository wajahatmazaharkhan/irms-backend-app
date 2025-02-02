import express from "express";
import { submitWeeklyStatus, getAllWeeklyStatusReports } from "../Controllers/Submitreport.js";
import {ensureAuthenticated} from "../Middlewares/Auth.js"

const router = express.Router();

// POST: Submit a Weekly Status Report
router.post("/submit", ensureAuthenticated,submitWeeklyStatus);

// GET: Retrieve all Weekly Status Reports
router.get("/reports", getAllWeeklyStatusReports);

export default router;
