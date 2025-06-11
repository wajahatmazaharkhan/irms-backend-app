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

// Controller for submitting task completion data
export const submitTaskCompletion = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    console.log(`Task submission in progress by user: ${userId}`);

    if (!userId) {
      return res.status(403).json({ message: "Unauthorized. User information is missing." });
    }

    const { taskId, comments } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required." });
    }

    if (!comments) {
      return res.status(400).json({ error: "Comments/Description are required." });
    }

    // Extract and handle files
    const fileData = req.files || {};
    const uploadedFiles = {};

    if (fileData.file) {
      uploadedFiles.file = fileData.file[0].path;
    }
    if (fileData.image) {
      uploadedFiles.image = fileData.image[0].path;
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Find the user's batch
    const user = await User.findById(userId);
    if (!user || !user.batch) {
      return res.status(404).json({ error: "User not found or not assigned to a batch" });
    }

    // Find the batch and check if user is in interns array
    const batch = await Batch.findById(user.batch);
    if (!batch || !batch.interns.includes(userId)) {
      return res.status(403).json({ error: "User is not in this batch" });
    }

    // Create and save the task completion
    const taskCompletion = new TaskCompletion({
      user: userId,
      task: taskId,
      comments,
      file: uploadedFiles.file || null,
      image: uploadedFiles.image || null,
    });

    await taskCompletion.save();

    // Update task status and batch progress
    task.status = 'completed';
    await task.save();
    
    // Update batch progress and task status
    await Batch.findByIdAndUpdate(user.batch, {
        $inc: { completedTasks: 1 },
        $set: { "tasks.$[elem].status": "completed" }
    }, {
        arrayFilters: [{ "elem.taskId": taskId }]
    });

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