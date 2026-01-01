import express from "express";
import { createIssue } from "../controllers/issue.controller.js";

const router = express.Router();

router.post("/", createIssue);

export default router;
