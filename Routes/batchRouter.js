import express from "express";
import { getBatchesWithCounts } from "../Controllers/admincontroller.js";

const batchRouter = express.Router();

batchRouter.get("/get-summary", getBatchesWithCounts);

export default batchRouter;
