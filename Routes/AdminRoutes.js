import express from "express";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  uploadProfilePicture,
} from "../Controllers/admincontroller.js";
import {
  createBatch,
  getBatchesWithCounts,
  getBatchById,
  deleteBatch,
  updateBatch,
} from "../Controllers/batchController.js";

const router = express.Router();

// Route to fetch all users
router.get("/allusers", getAllUsers);

// Route to update a user
router.put("/update/:userid", uploadProfilePicture, updateUser);

// Route to delete a user
router.delete("/delete/:userid", deleteUser);

// Route to create a batch
router.post("/batches", createBatch);

// Route to edit certain batch
router.put("/batches/:id", updateBatch);

// Route to get batches for admin
router.get("/batches/summary", getBatchesWithCounts);

//Route to get certain batch info
router.get("/batches/:id", getBatchById);

// Route for deleting a batch
router.delete("/batches/:id", deleteBatch);

// Route to get batch progress
router.get("/batches/progress", getBatchProgress);

export default router;
