import express from "express";
import { getBatchesWithCounts } from "../Controllers/admincontroller.js";
import { getBatchesWithHrAndInternIDs, getByHr, getBatchById,getUsersByBatchId,getAllPendingBatchApprovals,approveUserBatch } from "../Controllers/batchController.js";

const batchRouter = express.Router();

batchRouter.get("/get-summary", getBatchesWithCounts);
batchRouter.get("/get-by-hr/:hrId", getByHr);
batchRouter.get("/get/:id", getBatchById);
batchRouter.get("/get-ids", getBatchesWithHrAndInternIDs);

batchRouter.get("/batch-requests/:batchId", getUsersByBatchId);
batchRouter.get("/batch-requests", getAllPendingBatchApprovals);
batchRouter.patch("/approve-batch/:userId", approveUserBatch);


export default batchRouter;
