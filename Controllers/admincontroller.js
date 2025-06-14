import mongoose from "mongoose";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";
import User from "../Models/User.js";
import Batch from "../Models/batchModel.js";

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_picture",
    allowedFormats: ["jpeg", "jpg", "png", "gif", "webp"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Middleware to handle profile picture upload
export const uploadProfilePicture = upload.single("profilePicture");

// Update user details
export const updateUser = async (req, res) => {
  try {
    const { userid } = req.params;
    const updates = req.body;

    if (req.file) {
      updates.profilePicture = req.file.path;
    }

    console.log("id:", userid, "updates:", updates);

    const updatedUser = await User.findByIdAndUpdate(userid, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res
      .status(200)
      .json({ message: "Users fetched successfully", data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};


// Function to delete a user

export const deleteUser = async (req, res) => {
  try {
    const { userid } = req.params;

    console.log(`Deleting user with ID: ${userid}`);

    const deletedUser = await User.findByIdAndDelete(userid);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User deleted successfully", data: deletedUser });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

export const createBatch = async (req, res) => {
  try {
    const { name, startDate, endDate, interns, hr } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Batch name is required." });
    }

    const existingBatch = await Batch.findOne({
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    if (existingBatch) {
      return res.status(409).json({
        error:
          "A batch with the same name, start date, and end date already exists.",
      });
    }

    const newBatch = new Batch({ name, startDate, endDate, interns, hr });
    const savedBatch = await newBatch.save();

    const internIds = (interns || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (internIds.length > 0) {
      const result = await User.updateMany(
        { _id: { $in: internIds } },
        { $set: { batch: savedBatch._id } }
      );

      console.log(
        `✅ Updated ${result.modifiedCount} interns with batch ID ${savedBatch._id}`
      );
    }

    return res.status(201).json({
      message: "Batch created successfully",
      data: savedBatch,
    });
  } catch (error) {
    console.error("❌ Error creating batch:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

// Get all batches with counts
export const getBatchesWithCounts = async (req, res) => {
  console.log("== getBatchesWithCounts controller invoked ==");

  try {
    // Sanity check: confirm DB is accessible
    const batches = await Batch.find()
      .populate("interns", "_id")
      .populate("hr");

    console.log(`Fetched ${batches.length} batches from DB.`);

    const result = batches.map((batch, index) => {
      console.log(`\n== Batch ${index + 1}: ${batch.name} ==`);
      console.log("Batch ID:", batch._id);
      console.log("Populated interns:", batch.interns);
      console.log("Populated HR:", batch.hr);

      return {
        _id: batch._id,
        name: batch.name,
        startDate: batch.startDate,
        endDate: batch.endDate,
        totalInterns: Array.isArray(batch.interns) ? batch.interns.length : 0,
        totalHR: Array.isArray(batch.hr) ? batch.hr.length : 0,
      };
    });

    console.log("Returning response with result:", result);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getBatchesWithCounts:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get batch progress
export const getBatchProgress = async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate({
        path: "tasks.taskId",
        select: "title description",
      })
      .populate({
        path: "tasks.assignedTo",
        select: "name email",
      });

    const progressData = batches.map((batch) => {
      const taskList = batch.tasks || [];

      // 🔄 Dynamic counts
      const allTasks = taskList.length;
      const completedTasks = taskList.filter(
        (task) => task.status === "completed"
      ).length;
      const progress = allTasks > 0 ? (completedTasks / allTasks) * 100 : 0;

      // ⏱️ Status breakdown
      const taskStats = taskList.reduce(
        (acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        },
        { pending: 0, completed: 0 }
      );

      return {
        _id: batch._id,
        name: batch.name,
        startDate: batch.startDate,
        endDate: batch.endDate,
        allTasks,
        completedTasks,
        progress: parseFloat(progress.toFixed(2)),
        taskStats,
        tasks: taskList.map((task) => ({
          taskId: task.taskId,
          title: task.taskId?.title,
          description: task.taskId?.description,
          status: task.status,
          assignedTo: {
            _id: task.assignedTo?._id,
            name: task.assignedTo?.name,
            email: task.assignedTo?.email,
          },
        })),
      };
    });

    res.status(200).json(progressData);
  } catch (error) {
    console.error("Error fetching batch progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a batch
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBatch = await Batch.findByIdAndDelete(id);
    if (!deletedBatch) {
      return res.status(404).json({ error: "Batch not found." });
    }

    return res
      .status(200)
      .json({ message: "Batch deleted successfully.", data: deletedBatch });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Add a user to a batch
export const updateBatchWithUser = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found." });
    }

    if (batch.interns.includes(userId)) {
      return res.status(400).json({ error: "User is already in this batch." });
    }

    batch.interns.push(userId);
    await batch.save();

    return res
      .status(200)
      .json({ message: "User added to batch successfully", data: batch });
  } catch (error) {
    console.error("Error adding user to batch:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};
