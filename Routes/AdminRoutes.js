import express from "express";
import {
  getAllUsers,
  updateUser,
  deleteBatch,
  deleteUser,
  acceptUser,
  getAvaialableInternsReq,
  uploadProfilePicture,
} from "../Controllers/admincontroller.js";

import {
  getBatchProgress,
  createBatch,
  getBatchesWithCounts,
  // deleteBatch,
  getBatchById,
  updateBatch,
  getAvailableInterns,
} from "../Controllers/batchController.js";

import { deleteAll } from "../Controllers/deleteAllData.js";

const router = express.Router();

router.get("/uptime", (req, res) => {
  try {
    const processUptimeSeconds = process.uptime(); // process object is globally available, no import needed
    console.log(`Node.js process uptime: ${processUptimeSeconds} seconds`);

    // Optional: Format for better readability
    const formatUptime = (totalSeconds) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      const pad = (num) => String(num).padStart(2, "0");

      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    const upTime = formatUptime(processUptimeSeconds);

    return res.status(200).json({ upTime });

  } catch (error) {
    return res
      .status(500)
      .json({ success: false, msg: "Internal Error Occurred" });
  }
});

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
router.post("/accept/:userid", acceptUser);

// Route to update a user
router.put("/update/:userid", uploadProfilePicture, updateUser);

// Route to get details of a batch
router.get("/batches/:id", getBatchById);

// Route to edit details of a batch
router.put("/batches/:id", updateBatch);
router.get("/available-interns", getAvaialableInternsReq);

// Route to delete a user
router.delete("/delete/:userid", deleteUser);

router.delete("/deleteAll", deleteAll);

// Route for deleting a batch
router.delete("/batches/:id", deleteBatch);

export default router;
