import express from "express";
import { createIssue } from "../Controllers/issue.controller.js";

const router = express.Router();

router.post("/", createIssue);

export default router;
