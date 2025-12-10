// Models/Tasksubmition.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const TaskCompletionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    // Core task submission
    comments: {
      type: String,
      required: true, // your controller requires this
    },
    file: {
      type: String, // Cloudinary URL (PDF / doc)
      default: null,
    },
    image: {
      type: String, // Cloudinary URL (image)
      default: null,
    },

    // ✅ New research-related fields
    methods: {
      type: String,
      default: "",
    },
    results: {
      type: String,
      default: "",
    },
    challenges: {
      type: String,
      default: "",
    },
    timeSpent: {
      type: String, // keep it free-form ("5 hours", "2 days") for now
      default: "",
    },
    githubLink: {
      type: String,
      default: "",
    },
    externalLink: {
      type: String,
      default: "",
    },
    selfEvaluation: {
      type: String,
      enum: ["", "needs_improvement", "satisfactory", "good", "excellent"],
      default: "",
    },

    // Review workflow (already used in your controller)
    reviewed: {
      type: Boolean,
      default: false,
    },
    reviewStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("TaskCompletion", TaskCompletionSchema);