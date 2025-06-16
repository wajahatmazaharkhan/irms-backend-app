import express from "express";
import { getBatchById, getBatchesWithCounts, getByHr } from "../Controllers/batchController.js";

const batchRouter = express.Router();

batchRouter.get("/get-summary", getBatchesWithCounts);
batchRouter.get("/get-by-hr/:hrId", getByHr);
batchRouter.get("/get/:id", getBatchById);

export default batchRouter;
