import express from "express";
import { getBatchesWithCounts } from "../Controllers/admincontroller.js";
import { getBatchesWithHrAndInternIDs } from "../Controllers/batchController.js";

const batchRouter = express.Router();

batchRouter.get("/get-summary", getBatchesWithCounts);
batchRouter.get("/get-ids", getBatchesWithHrAndInternIDs);

export default batchRouter;
