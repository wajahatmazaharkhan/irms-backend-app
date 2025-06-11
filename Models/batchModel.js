import mongoose, { mongo } from "mongoose";
import moment from "moment";

const { Schema } = mongoose;

const BatchSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
    set: (value) => moment(value).format("YYYY-MM-DD"), // Only date, no time
  },
  EndDate: {
    type: Date,
    set: (value) => moment(value).format("YYYY-MM-DD"), // Only date, no time
  },
  interns: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
  hr: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "HRIntern",
      },
    ],
  },
  allTasks: {
    type: Number,
    default: 0,
  },
  completedTasks: {
    type: Number,
    default: 0,
  },
  tasks: [{
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task"
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending"
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  }]
});

export default mongoose.model("Batch", BatchSchema);
