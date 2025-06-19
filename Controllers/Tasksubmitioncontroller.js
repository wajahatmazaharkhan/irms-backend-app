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




export const reviewTaskSubmission = async (req, res) => {
  try {
    const { userId, taskId, status } = req.body;

    if (!userId || !taskId || !status) {
      console.warn("Missing required fields.");
      return res.status(400).json({ error: "userId, taskId, and status are required." });
    }

    const task = await Task.findById(taskId);
    const user = await User.findById(userId);
    const submission = await TaskCompletion.findOne({ task: taskId, user: userId });

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }
	if (!user) {
      return res.status(404).json({ error: "user not found." });
    }
	if (!submission) {
      return res.status(404).json({ error: "submission not found." });
    }
    if (submission.reviewed) {
      console.warn("Submission already reviewed.");
      return res.status(400).json({ error: "This submission has already been reviewed." });
    }

    const submittedOn = submission.createdAt;
    const deadline = task.endDate;
    const isBeforeDeadline = new Date(submittedOn) <= new Date(deadline);

    let rankChange = 0;

    if (status === "Accepted" && isBeforeDeadline) {
      if (task.taskType === "Technical") {
        rankChange = 1;
      } else if (task.taskType === "Social") {
        rankChange = 1;
      }
    } else if ((status === "Rejected" && task.taskType === "Social")||(!isBeforeDeadline && task.taskType === "Social")) {
      rankChange = -1;
    } else {
      console.log("No rank change criteria matched.");
    }

    if (rankChange !== 0) {
      user.totalPoints = (user.totalPoints || 0) + rankChange;
      await user.save();
      console.log(`User rank updated to ${user.totalPoints}`);
    }

    submission.reviewed = true;
    submission.reviewStatus = status;
    await submission.save();

    if (status === "Accepted") {
      task.status = "completed";
      await task.save();
      console.log("Task status updated to completed.");
    }

    res.status(200).json({
      message: `Task submission ${status.toLowerCase()} and user rank ${rankChange >= 0 ? "increased" : "decreased"} by ${Math.abs(rankChange)}.`,
    });

  } catch (error) {
    console.error("Error reviewing task:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const deleteTaskSubmissionByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required." });
    }

    const submission = await TaskCompletion.findOneAndDelete({ task: taskId });

    if (!submission) {
      return res.status(404).json({ error: "No submission found for this task ID." });
    }

    // Optional: update the task and batch status if needed
    const task = await Task.findById(taskId);
    if (task) {
      task.status = "pending";
      await task.save();
    }

    // Update batch task status if necessary
    const user = await User.findById(submission.user);
    if (user && user.batch) {
      const batch = await Batch.findById(user.batch);
      if (batch) {
        const taskToUpdate = batch.tasks.find(t => t.taskId.toString() === taskId);
        if (taskToUpdate) {
          taskToUpdate.status = "pending";
        }
        batch.completedTasks = Math.max(0, batch.completedTasks - 1);
        await batch.save();
      }
    }

    res.status(200).json({ message: "Task submission deleted successfully." });
  } catch (error) {
    console.error("Error deleting task submission:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
