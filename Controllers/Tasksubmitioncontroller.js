import mongoose from "mongoose";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";
import TaskCompletionSchema from "../Models/Tasksubmition.js";
import { ensureAuthenticated } from "../Middlewares/Auth.js";
import User from "../Models/User.js";
import Task from "../Models/Task.js";
import Batch from "../Models/batchModel.js";
import connectDB from "../src/db/index.js";

// Configure Multer for Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "task_files",
    resource_type: "auto",        // 👈 let Cloudinary decide: image vs raw
    use_filename: true,           // keep original filename base
    unique_filename: true,        // avoid collisions
    allowed_formats: ["jpg", "png", "pdf", "doc", "docx", "webp"],
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const submitTaskSchema = async (req, res) => {
  console.log("Inside task submission");
  await connectDB();

  try {
    const userId = req.user?._id || req.user?.id;

    const {
      taskId,
      comments,
      methods,
      results,
      challenges,
      timeSpent,
      githubLink,
      externalLink,
      selfEvaluation,
    } = req.body;

    if (!taskId || !comments) {
      return res
        .status(400)
        .json({ error: "Task ID and comments are required." });
    }

    const fileData = req.files || {};
    const fileField = fileData.file?.[0] || null;
    const imageField = fileData.image?.[0] || null;

    console.log("FILE FIELD:", fileField);   // 👈 add this once to inspect
    console.log("IMAGE FIELD:", imageField); // 👈 add this once to inspect

    const uploadedFiles = {
      file: fileField ? fileField.path : null,   // ✅ use path as-is
      image: imageField ? imageField.path : null,
    };

    const taskCompletion = new TaskCompletionSchema({
      user: userId,
      task: taskId,
      comments,
      file: uploadedFiles.file,
      image: uploadedFiles.image,
      methods,
      results,
      challenges,
      timeSpent,
      githubLink,
      externalLink,
      selfEvaluation,
    });

    await taskCompletion.save();

    // update task + batch as you already do...

    res
      .status(201)
      .json({ message: "Task submitted successfully.", taskCompletion });
  } catch (error) {
    console.error("Error submitting task:", error);
    res
      .status(500)
      .json({ error: "An error occurred while submitting the task." });
  }
};


export const getTasksreports = async (req, res) => {
  await connectDB();
  try {
    const tasks = await TaskCompletionSchema.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email department role")
      .populate("task", "title description taskType startDate endDate status");

    // All fields from TaskCompletion (comments, methods, results, etc.)
    // are included by default in `tasks`
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "An error occurred while fetching tasks." });
  }
};

export const reviewTaskSubmission = async (req, res) => {
  await connectDB();
  try {
    const { userId, taskId, status } = req.body;

    if (!userId || !taskId || !status) {
      console.warn("Missing required fields.");
      return res
        .status(400)
        .json({ error: "userId, taskId, and status are required." });
    }
    console.log("Task: ", taskId);
    console.log("userId: ", userId);
    console.log("status: ", status);
    const task = await Task.findById(taskId);
    const user = await User.findById(userId);
    const submission = await TaskCompletionSchema.findOne({
      task: taskId,
      user: userId,
    });

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
      return res
        .status(409)
        .json({ error: "This submission has already been reviewed." });
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
    } else if (
      (status === "Rejected" && task.taskType === "Social") ||
      (!isBeforeDeadline && task.taskType === "Social")
    ) {
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
  await connectDB();
  try {
    console.log("Inside delete");
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required." });
    }
    console.log("Taskid: ", taskId);
    const submission = await TaskCompletionSchema.findOneAndDelete({
      task: taskId,
    });
    console.log("submission: ", submission);
    if (!submission) {
      return res
        .status(404)
        .json({ error: "No submission found for this task ID." });
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
        const taskToUpdate = batch.tasks.find(
          (t) => t.taskId.toString() === taskId
        );
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
