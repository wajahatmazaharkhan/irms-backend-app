import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true
    },	
	taskType: {
	  type: String,
	  enum: ["Technical", "Social"],
	  default: "Technical"
	},
	penaltyApplied: {
	  type: Boolean,
	  default: false
	}
});

export default mongoose.model('Task', TaskSchema);
