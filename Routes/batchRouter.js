import express from "express";
import { getBatchesWithCounts } from "../Controllers/batchController.js";

const batchRouter = express.Router();

batchRouter.get("/get-summary", getBatchesWithCounts);

export default batchRouter;
