import express from "express";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  uploadProfilePicture,
  getBatchProgress,
    createBatch,
  getBatchesWithCounts,
 
  deleteBatch,
 
} from "../Controllers/admincontroller.js";


 

const router = express.Router();

// Route to fetch all users
router.get("/allusers", getAllUsers);

// Route to update a user
router.put("/update/:userid", uploadProfilePicture, updateUser);

// Route to delete a user
router.delete("/delete/:userid", deleteUser);

// Route to create a batch
router.post("/batches", createBatch);




router.get("/batches/summary", getBatchesWithCounts);
router.get("/batches/progress", getBatchProgress);


// Route for deleting a batch
router.delete("/batches/:id", deleteBatch);



export default router;
