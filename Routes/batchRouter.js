import express from "express";
import { getBatchesWithCounts } from "../Controllers/admincontroller.js";
import { getBatchesWithHrAndInternIDs, getByHr, getBatchById } from "../Controllers/batchController.js";

const batchRouter = express.Router();

batchRouter.get("/get-summary", getBatchesWithCounts);
batchRouter.get("/get-by-hr/:hrId", getByHr);
batchRouter.get("/get/:id", getBatchById);
batchRouter.get("/get-ids", getBatchesWithHrAndInternIDs);

export default batchRouter;
