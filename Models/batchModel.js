import mongoose from "mongoose";

const { Schema } = mongoose;

const BatchSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    default: () => new Date(), // Use a proper Date object
  },
  endDate: {
    type: Date,
  },
  interns: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
  hr: {
    type: [{ type: Schema.Types.ObjectId, ref: "HRIntern" }],
    default: [],
  },
  allTasks: {
    type: Number,
    default: 0,
  },
  completedTasks: {
    type: Number,
    default: 0,
  },
  tasks: [
    {
      taskId: {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
      status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
      },
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  teams: [
    {
      name: { type: String, required: true },
      members: [{ type: Schema.Types.ObjectId, ref: "User" }],
      createdBy: { type: Schema.Types.ObjectId, ref: "HRIntern" },
    
    }
  ],
});

export default mongoose.model("Batch", BatchSchema);
