import mongoose from "mongoose";

const TaskCompletionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"User",
    },
    task:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    comments: { type: String, required: true },
    file: { type: String },
    image: { type: String },
	reviewed: { type: Boolean, default: false },
	reviewStatus: { type: String, enum: ["Accepted", "Rejected","Pending"], default: "Pending" },
  },
  { timestamps: true }
  
);

const TaskCompletion = mongoose.model("TaskCompletion", TaskCompletionSchema);

export default TaskCompletion;