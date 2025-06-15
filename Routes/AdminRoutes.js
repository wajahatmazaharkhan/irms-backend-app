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
  getAvailableInterns
} from "../Controllers/batchController.js";


const router = express.Router();

// Route to fetch all users
router.get("/allusers", getAllUsers);

// Route to get all available interns 
router.get("/available-interns", getAvailableInterns);

// Route to fetch batch progress
router.get("/batches/progress", getBatchProgress);

// Route to get batches for admin
// Previously not working route.
// router.get("/get-batch-summary", getBatchesWithCounts);

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
