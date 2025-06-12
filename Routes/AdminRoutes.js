import express from "express";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  uploadProfilePicture,
} from "../Controllers/admincontroller.js";

import {
  getBatchProgress,
  createBatch,
  getBatchesWithCounts,
  deleteBatch,
  getBatchById,
  updateBatch,
} from "../Controllers/batchController.js";


const router = express.Router();

// Route to fetch all users
router.get("/allusers", getAllUsers);

// Route to fetch batch progress
router.get("/batches/progress", getBatchProgress);

// Route to get batches for admin
router.get("/api/batches/summary", getBatchesWithCounts);

// Route to create a batch
router.post("/batches", createBatch);

// Route to update a user
router.put("/update/:userid", uploadProfilePicture, updateUser);

// Route to get details of a batch
router.get("/batches/:id", getBatchById);

// Route to edit details of a batch
router.put("/batches/:id", updateBatch);

// Route to delete a user
router.delete("/delete/:userid", deleteUser);



// Route for deleting a batch
router.delete("/batches/:id", deleteBatch);



export default router;
