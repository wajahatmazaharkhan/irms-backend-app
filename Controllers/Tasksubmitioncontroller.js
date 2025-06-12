import mongoose from "mongoose";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";
import TaskCompletion from "../Models/Tasksubmition.js";
import { ensureAuthenticated } from "../Middlewares/Auth.js";
import User from "../Models/User.js";
import Task from "../Models/Task.js";
import Batch from "../Models/batchModel.js";

// Configure Multer for Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "task_files", // Folder name in Cloudinary
    allowed_formats: ["jpg", "png", "pdf", "docx", "webp"], // Allowed file formats
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});


export const submitTaskCompletion = async (req, res) => {
  console.log("Inside task submission");

  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(403).json({ message: "Unauthorized. User info missing." });
    }

    const { taskId, comments } = req.body;
    if (!taskId || !comments) {
      return res.status(400).json({ error: "Task ID and comments are required." });
    }

    const fileData = req.files || {};
    const uploadedFiles = {
      file: fileData.file?.[0]?.path || null,
      image: fileData.image?.[0]?.path || null,
    };

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Ensure task is assigned to this user
    if (task.assignedTo.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You are not assigned to this task." });
    }

    // Don't update if already completed
    if (task.status === 'completed') {
      return res.status(400).json({ error: "Task has already been completed." });
    }

    const user = await User.findById(userId);
    if (!user || !user.batch) {
      return res.status(404).json({ error: "User not found or not in a batch" });
    }

    const batch = await Batch.findById(user.batch);
    if (!batch || !batch.interns.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({ error: "User is not an intern in this batch" });
    }

    // Save the task completion record
    const taskCompletion = new TaskCompletion({
      user: userId,
      task: taskId,
      comments,
      file: uploadedFiles.file,
      image: uploadedFiles.image,
    });
    await taskCompletion.save();

    // Update the task status
    task.status = 'completed';
    await task.save();

    // Update batch: increment completedTasks and manually update tasks[].status
    const taskToUpdate = batch.tasks.find(t => t.taskId.toString() === task._id.toString());
    if (taskToUpdate) {
      taskToUpdate.status = 'completed';
    }
    batch.completedTasks += 1;
    await batch.save();

    res.status(201).json({ message: "Task submitted successfully.", taskCompletion });

  } catch (error) {
    console.error("Error submitting task:", error);
    res.status(500).json({ error: "An error occurred while submitting the task." });
  }
};




export const getTasksreports = async (req, res) => {
  try {
    const tasks = await TaskCompletion.find()
      .sort({ createdAt: -1 })
      .populate("user", "name")
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "An error occurred while fetching tasks." });
  }
};

// Export the Multer upload function for use in routes
export { upload };

