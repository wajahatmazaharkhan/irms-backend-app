import express from "express";
import { getBatchesWithCounts } from "../Controllers/admincontroller.js";

import {
  getBatchesWithHrAndInternIDs,
  getByHr,
  getBatchById,
  getUsersByBatchId,
  getAllPendingBatchApprovals,
  approveUserBatch,
  rejectUserBatch,
  createTeam,
  addMembersToTeam,
  removeMemberFromTeam,
  moveMemberBetweenTeams,
  updateTeam,
  deleteTeam
} from "../Controllers/batchController.js";
import { ensureAuthenticated } from "../Middlewares/Auth.js";

const batchRouter = express.Router();

batchRouter.get("/get-summary", getBatchesWithCounts);
batchRouter.get("/get-by-hr/:hrId", getByHr);
batchRouter.get("/get/:id", getBatchById);
batchRouter.get("/get-ids", getBatchesWithHrAndInternIDs);

batchRouter.get("/batch-requests/:batchId", getUsersByBatchId);
batchRouter.get("/batch-requests", getAllPendingBatchApprovals);
batchRouter.patch("/approve-batch/:userId", approveUserBatch);
batchRouter.patch("/reject-batch/:userId", rejectUserBatch);


batchRouter.post("/:batchId/teams", ensureAuthenticated, createTeam);
batchRouter.post("/:batchId/teams/:teamId/members", ensureAuthenticated, addMembersToTeam);
batchRouter.delete("/:batchId/teams/:teamId/members/:memberId", ensureAuthenticated, removeMemberFromTeam);
batchRouter.post("/:batchId/teams/move-member", ensureAuthenticated, moveMemberBetweenTeams);
batchRouter.patch("/:batchId/teams/:teamId", ensureAuthenticated, updateTeam);
batchRouter.delete("/:batchId/teams/:teamId", ensureAuthenticated, deleteTeam);


export default batchRouter;
