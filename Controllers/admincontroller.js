import User from "../Models/User.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "../config/cloudinaryConfig.js";
import Batch from "../Models/batchModel.js";

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_picture", // Folder in cloudinary bucket
    allowed_formats: ["jpeg", "jpg", "png", "gif", "webp"], // Allowed file formats
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Function to update user details, including profile picture
export const updateUser = async (req, res) => {
  try {
    const { userid } = req.params; // Extract user ID from route parameters
    const updates = req.body; // Get updates from the request body

    // If a file is uploaded, include its URL in the updates
    if (req.file) {
      updates.profilePicture = req.file.path; // Cloudinary stores the file URL in `path`
    }

    console.log("id:", userid, "updates:", updates);

    const updatedUser = await User.findByIdAndUpdate(userid, updates, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validation rules are applied
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

// Middleware to handle file uploads
export const uploadProfilePicture = upload.single("profilePicture");

// Function to get all users for admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
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
    const { userid } = req.params; // Extract user ID from route parameters

    console.log(`Deleting user with ID: ${userid}`);

    const deletedUser = await User.findByIdAndDelete(userid); // Delete user from database
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


// create a new batch
export const createBatch = async (req, res) => {
  try {
    const { name, startDate, endDate, interns, hr } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Batch name is required." });
    }

    // Check for duplicate batch with same name, start and end date
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

    const newBatch = new Batch({
      name,
      startDate,
      endDate,
      interns,
      hr,
    });

    const savedBatch = await newBatch.save();

    // Update the batch field for each intern
    if (interns && interns.length > 0) {
      await User.updateMany(
        { _id: { $in: interns } },
        { $set: { batch: savedBatch._id } }
      );
    }

    return res.status(201).json({
      message: "Batch created successfully",
      data: savedBatch,
    });
  } catch (error) {
    console.error("Error creating batch:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

// controllers/batchController.js

export const getBatchesWithCounts = async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate("interns", "_id")
      .populate("hr"); // no select here, we want full docs

    const result = batches.map((batch, index) => {
      console.log(`\n== Batch ${index + 1}: ${batch.name} ==`);
      console.log("Populated HR array:", batch.hr);

      return {
        _id: batch._id,
        name: batch.name,
        startDate: batch.startDate,
        EndDate: batch.EndDate,
        totalInterns: Array.isArray(batch.interns) ? batch.interns.length : 0,
        totalHR: Array.isArray(batch.hr) ? batch.hr.length : 0,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching batches:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getBatchProgress = async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('tasks.taskId', 'title description')
      .populate('tasks.assignedTo', 'name email');

    const progressData = batches.map((batch) => {
      const progress = batch.allTasks > 0 ? (batch.completedTasks / batch.allTasks) * 100 : 0;
      
      // Get task statistics
      const taskStats = batch.tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, { pending: 0, completed: 0 });

      return {
        _id: batch._id,
        name: batch.name,
        startDate: batch.startDate,
        EndDate: batch.EndDate,
        allTasks: batch.allTasks,
        completedTasks: batch.completedTasks,
        progress: parseFloat(progress.toFixed(2)),
        taskStats,
        tasks: batch.tasks.map(task => ({
          taskId: task.taskId,
          title: task.taskId?.title,
          description: task.taskId?.description,
          status: task.status,
          assignedTo: {
            _id: task.assignedTo?._id,
            name: task.assignedTo?.name,
            email: task.assignedTo?.email
          }
        }))
      };
    });

    res.status(200).json(progressData);
  } catch (error) {
    console.error("Error fetching batch progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBatch = await Batch.findByIdAndDelete(id);

    if (!deletedBatch) {
      return res.status(404).json({ error: "Batch not found." });
    }

    return res.status(200).json({
      message: "Batch deleted successfully.",
      data: deletedBatch,
    });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

// Add user to batch
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

    // Check if user is already in the batch
    if (batch.interns.includes(userId)) {
      return res.status(400).json({ error: "User is already in this batch." });
    }

    // Add user to batch's interns array
    batch.interns.push(userId);
    await batch.save();

    return res.status(200).json({
      message: "User added to batch successfully",
      data: batch
    });
  } catch (error) {
    console.error("Error adding user to batch:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message
    });
  }
};
